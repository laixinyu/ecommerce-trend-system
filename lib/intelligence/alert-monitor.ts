import { createClient } from '@/lib/supabase/server';
import {
  Alert,
  MetricMonitor,
  AlertCondition,
  DataSource,
} from '@/types/intelligence';
import { DataAggregator } from './data-aggregator';

export class AlertMonitor {
  private supabase: any;
  private userId: string;

  constructor(supabase: any, userId: string) {
    this.supabase = supabase;
    this.userId = userId;
  }

  /**
   * Check all active monitors and generate alerts
   */
  async checkAllMonitors(): Promise<Alert[]> {
    const { data: monitors } = await this.supabase
      .from('metric_monitors')
      .select('*')
      .eq('user_id', this.userId)
      .eq('status', 'active');

    if (!monitors || monitors.length === 0) {
      return [];
    }

    const alerts: Alert[] = [];

    for (const monitor of monitors) {
      try {
        const alert = await this.checkMonitor(monitor);
        if (alert) {
          alerts.push(alert);
        }
      } catch (error) {
        console.error(`Error checking monitor ${monitor.id}:`, error);
      }
    }

    return alerts;
  }

  /**
   * Check a single monitor
   */
  private async checkMonitor(monitor: MetricMonitor): Promise<Alert | null> {
    // Fetch current metric value
    const currentValue = await this.fetchMetricValue(monitor.data_source);

    // Check each condition
    for (const condition of monitor.conditions) {
      const triggered = await this.evaluateCondition(
        condition,
        currentValue,
        monitor.data_source
      );

      if (triggered) {
        // Check if alert already exists and is active
        const { data: existingAlerts } = await this.supabase
          .from('alerts')
          .select('*')
          .eq('user_id', this.userId)
          .eq('metric', monitor.metric)
          .eq('status', 'active')
          .limit(1);

        if (existingAlerts && existingAlerts.length > 0) {
          // Alert already exists, don't create duplicate
          return null;
        }

        // Create alert
        const alert = await this.createAlert(monitor, condition, currentValue);
        
        // Send notifications
        await this.sendNotifications(alert, monitor);

        return alert;
      }
    }

    return null;
  }

  /**
   * Fetch current value for a metric
   */
  private async fetchMetricValue(dataSource: DataSource): Promise<number> {
    try {
      const data = await DataAggregator.fetchDataFromSource(dataSource, this.userId);

      if (Array.isArray(data)) {
        // Apply aggregation
        if (dataSource.aggregation === 'count') {
          return data.length;
        } else if (dataSource.aggregation === 'sum') {
          return data.reduce((sum, item) => sum + (item.value || 0), 0);
        } else if (dataSource.aggregation === 'avg') {
          const sum = data.reduce((sum, item) => sum + (item.value || 0), 0);
          return data.length > 0 ? sum / data.length : 0;
        }
      }

      return typeof data === 'number' ? data : 0;
    } catch (error) {
      console.error('Error fetching metric value:', error);
      return 0;
    }
  }

  /**
   * Evaluate an alert condition
   */
  private async evaluateCondition(
    condition: AlertCondition,
    currentValue: number,
    dataSource: DataSource
  ): Promise<boolean> {
    switch (condition.type) {
      case 'threshold':
        return this.evaluateThreshold(condition, currentValue);
      
      case 'change':
        return await this.evaluateChange(condition, currentValue, dataSource);
      
      case 'anomaly':
        return await this.evaluateAnomaly(currentValue, dataSource);
      
      default:
        return false;
    }
  }

  /**
   * Evaluate threshold condition
   */
  private evaluateThreshold(condition: AlertCondition, currentValue: number): boolean {
    const { operator, value } = condition;

    if (!operator || value === undefined) return false;

    switch (operator) {
      case 'gt':
        return currentValue > value;
      case 'lt':
        return currentValue < value;
      case 'eq':
        return currentValue === value;
      default:
        return false;
    }
  }

  /**
   * Evaluate change condition (percentage change over time window)
   */
  private async evaluateChange(
    condition: AlertCondition,
    currentValue: number,
    dataSource: DataSource
  ): Promise<boolean> {
    const { change_percentage, time_window = 24 } = condition;

    if (change_percentage === undefined) return false;

    // Fetch historical value from time_window hours ago
    const historicalValue = await this.fetchHistoricalValue(dataSource, time_window);

    if (historicalValue === 0) return false;

    const actualChange = ((currentValue - historicalValue) / historicalValue) * 100;

    return Math.abs(actualChange) >= Math.abs(change_percentage);
  }

  /**
   * Evaluate anomaly detection
   */
  private async evaluateAnomaly(
    currentValue: number,
    dataSource: DataSource
  ): Promise<boolean> {
    // Fetch historical values for the past 30 days
    const historicalValues = await this.fetchHistoricalValues(dataSource, 30);

    if (historicalValues.length < 7) return false; // Need at least 7 days of data

    // Calculate mean and standard deviation
    const mean = historicalValues.reduce((a, b) => a + b, 0) / historicalValues.length;
    const variance = historicalValues.reduce((sum, val) => 
      sum + Math.pow(val - mean, 2), 0) / historicalValues.length;
    const stdDev = Math.sqrt(variance);

    // Check if current value is more than 2 standard deviations from mean
    const zScore = Math.abs((currentValue - mean) / stdDev);

    return zScore > 2; // Anomaly if z-score > 2
  }

  /**
   * Fetch historical metric value
   */
  private async fetchHistoricalValue(
    dataSource: DataSource,
    hoursAgo: number
  ): Promise<number> {
    // This is a simplified implementation
    // In production, you'd store metric snapshots in a time-series table
    return 0;
  }

  /**
   * Fetch historical metric values
   */
  private async fetchHistoricalValues(
    dataSource: DataSource,
    days: number
  ): Promise<number[]> {
    // This is a simplified implementation
    // In production, you'd query time-series data
    return [];
  }

  /**
   * Create an alert
   */
  private async createAlert(
    monitor: MetricMonitor,
    condition: AlertCondition,
    currentValue: number
  ): Promise<Alert> {
    const severity = this.determineSeverity(condition, currentValue);
    const suggestedActions = this.generateSuggestedActions(monitor, condition, currentValue);

    const alert: Alert = {
      id: crypto.randomUUID(),
      user_id: this.userId,
      type: condition.type,
      severity,
      title: `${monitor.name} 触发预警`,
      message: this.generateAlertMessage(monitor, condition, currentValue),
      metric: monitor.metric,
      current_value: currentValue,
      threshold_value: condition.value,
      suggested_actions: suggestedActions,
      status: 'active',
      created_at: new Date().toISOString(),
    };

    await this.supabase.from('alerts').insert(alert);

    return alert;
  }

  /**
   * Determine alert severity
   */
  private determineSeverity(
    condition: AlertCondition,
    currentValue: number
  ): 'info' | 'warning' | 'critical' {
    if (condition.type === 'anomaly') {
      return 'warning';
    }

    if (condition.value === undefined) {
      return 'info';
    }

    const deviation = Math.abs(currentValue - condition.value) / condition.value;

    if (deviation > 0.5) return 'critical';
    if (deviation > 0.2) return 'warning';
    return 'info';
  }

  /**
   * Generate alert message
   */
  private generateAlertMessage(
    monitor: MetricMonitor,
    condition: AlertCondition,
    currentValue: number
  ): string {
    const metricName = monitor.name;

    switch (condition.type) {
      case 'threshold':
        const operator = condition.operator === 'gt' ? '超过' : '低于';
        return `${metricName} 当前值 ${currentValue.toFixed(2)} ${operator}阈值 ${condition.value}`;
      
      case 'change':
        return `${metricName} 在过去 ${condition.time_window} 小时内变化超过 ${condition.change_percentage}%`;
      
      case 'anomaly':
        return `${metricName} 检测到异常值: ${currentValue.toFixed(2)}`;
      
      default:
        return `${metricName} 触发预警`;
    }
  }

  /**
   * Generate suggested actions
   */
  private generateSuggestedActions(
    monitor: MetricMonitor,
    condition: AlertCondition,
    currentValue: number
  ): string[] {
    const actions: string[] = [];

    // Generic actions based on metric type
    if (monitor.metric.includes('inventory')) {
      if (condition.operator === 'lt') {
        actions.push('检查库存水平并考虑补货');
        actions.push('联系供应商确认交货时间');
      }
    } else if (monitor.metric.includes('sales')) {
      if (condition.operator === 'lt') {
        actions.push('检查营销活动效果');
        actions.push('分析竞品动态');
        actions.push('考虑促销活动');
      }
    } else if (monitor.metric.includes('cost') || monitor.metric.includes('spend')) {
      if (condition.operator === 'gt') {
        actions.push('审查支出明细');
        actions.push('优化成本结构');
        actions.push('暂停低效活动');
      }
    }

    if (actions.length === 0) {
      actions.push('查看详细数据分析');
      actions.push('联系相关负责人');
    }

    return actions;
  }

  /**
   * Send notifications for an alert
   */
  private async sendNotifications(alert: Alert, monitor: MetricMonitor): Promise<void> {
    for (const channel of monitor.notification_channels) {
      try {
        await this.sendNotification(alert, channel);
      } catch (error) {
        console.error(`Error sending notification via ${channel.type}:`, error);
      }
    }
  }

  /**
   * Send a single notification
   */
  private async sendNotification(alert: Alert, channel: any): Promise<void> {
    switch (channel.type) {
      case 'in_app':
        await this.supabase.from('notifications').insert({
          user_id: this.userId,
          title: alert.title,
          message: alert.message,
          type: 'alert',
          severity: alert.severity,
          link: `/intelligence/alerts/${alert.id}`,
          created_at: new Date().toISOString(),
        });
        break;
      
      case 'email':
        // Email sending would be implemented here
        console.log('Sending email notification:', alert.title);
        break;
      
      case 'sms':
        // SMS sending would be implemented here
        console.log('Sending SMS notification:', alert.title);
        break;
      
      case 'webhook':
        // Webhook call would be implemented here
        if (channel.config.url) {
          await fetch(channel.config.url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(alert),
          });
        }
        break;
    }
  }

  /**
   * Acknowledge an alert
   */
  async acknowledgeAlert(alertId: string): Promise<void> {
    await this.supabase
      .from('alerts')
      .update({
        status: 'acknowledged',
        acknowledged_at: new Date().toISOString(),
      })
      .eq('id', alertId)
      .eq('user_id', this.userId);
  }

  /**
   * Resolve an alert
   */
  async resolveAlert(alertId: string): Promise<void> {
    await this.supabase
      .from('alerts')
      .update({
        status: 'resolved',
        resolved_at: new Date().toISOString(),
      })
      .eq('id', alertId)
      .eq('user_id', this.userId);
  }
}
