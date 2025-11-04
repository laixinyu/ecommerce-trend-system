// 自动化营销引擎
import { createClient } from '@/lib/supabase/server';
import {
  AutomationRule,
  TriggerConfig,
  ActionConfig,
  AutomationExecution,
} from '@/types/automation';
import { Customer } from '@/types/crm';

/**
 * 自动化营销引擎
 * 负责评估触发条件和执行自动化动作
 */
export class AutomationEngine {
  /**
   * 评估触发条件
   * @param trigger 触发器配置
   * @param customer 客户数据
   * @param context 上下文数据
   */
  async evaluateTrigger(
    trigger: TriggerConfig,
    customer: Customer,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    context?: Record<string, any>
  ): Promise<boolean> {
    switch (trigger.type) {
      case 'purchase':
        return this.evaluatePurchaseTrigger(trigger, customer, context);

      case 'abandoned_cart':
        return this.evaluateAbandonedCartTrigger(trigger, customer, context);

      case 'segment_change':
        return this.evaluateSegmentChangeTrigger(trigger, customer, context);

      case 'time_based':
        return this.evaluateTimeBasedTrigger(trigger, customer);

      case 'inactivity':
        return this.evaluateInactivityTrigger(trigger, customer);

      default:
        return false;
    }
  }

  /**
   * 评估购买触发器
   * 条件: days_after_purchase - 购买后N天
   */
  private evaluatePurchaseTrigger(
    trigger: TriggerConfig,
    customer: Customer,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
    context?: Record<string, any>
  ): boolean {
    const { days_after_purchase } = trigger.conditions;

    if (!customer.last_purchase_at) {
      return false;
    }

    const daysSinceLastPurchase = Math.floor(
      (Date.now() - new Date(customer.last_purchase_at).getTime()) /
        (1000 * 60 * 60 * 24)
    );

    return daysSinceLastPurchase === days_after_purchase;
  }

  /**
   * 评估弃购触发器
   * 条件: hours_since_cart - 加购后N小时未购买
   */
  private evaluateAbandonedCartTrigger(
    trigger: TriggerConfig,
    customer: Customer,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    context?: Record<string, any>
  ): boolean {
    const { hours_since_cart } = trigger.conditions;

    // 这里需要从context中获取购物车数据
    if (!context?.cart_created_at) {
      return false;
    }

    const hoursSinceCart = Math.floor(
      (Date.now() - new Date(context.cart_created_at).getTime()) /
        (1000 * 60 * 60)
    );

    return hoursSinceCart >= hours_since_cart && !context.purchased;
  }

  /**
   * 评估分层变化触发器
   * 条件: from_segment, to_segment - 从某个分层变为另一个分层
   */
  private evaluateSegmentChangeTrigger(
    trigger: TriggerConfig,
    customer: Customer,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    context?: Record<string, any>
  ): boolean {
    const { from_segment, to_segment } = trigger.conditions;

    if (!context?.previous_segment) {
      return false;
    }

    return (
      context.previous_segment === from_segment &&
      customer.segment === to_segment
    );
  }

  /**
   * 评估基于时间的触发器
   * 条件: days_since_first_purchase - 首次购买后N天
   */
  private evaluateTimeBasedTrigger(
    trigger: TriggerConfig,
    customer: Customer
  ): boolean {
    const { days_since_first_purchase } = trigger.conditions;

    if (!customer.first_purchase_at) {
      return false;
    }

    const daysSinceFirstPurchase = Math.floor(
      (Date.now() - new Date(customer.first_purchase_at).getTime()) /
        (1000 * 60 * 60 * 24)
    );

    return daysSinceFirstPurchase === days_since_first_purchase;
  }

  /**
   * 评估不活跃触发器
   * 条件: days_inactive - N天未购买
   */
  private evaluateInactivityTrigger(
    trigger: TriggerConfig,
    customer: Customer
  ): boolean {
    const { days_inactive } = trigger.conditions;

    if (!customer.last_purchase_at) {
      return false;
    }

    const daysSinceLastPurchase = Math.floor(
      (Date.now() - new Date(customer.last_purchase_at).getTime()) /
        (1000 * 60 * 60 * 24)
    );

    return daysSinceLastPurchase >= days_inactive;
  }

  /**
   * 执行自动化动作
   * @param action 动作配置
   * @param customer 客户数据
   */
  async executeAction(
    action: ActionConfig,
    customer: Customer
  ): Promise<{ success: boolean; message?: string }> {
    try {
      switch (action.type) {
        case 'send_email':
          return await this.executeSendEmail(action, customer);

        case 'send_sms':
          return await this.executeSendSMS(action, customer);

        case 'add_tag':
          return await this.executeAddTag(action, customer);

        case 'update_segment':
          return await this.executeUpdateSegment(action, customer);

        case 'webhook':
          return await this.executeWebhook(action, customer);

        default:
          return { success: false, message: 'Unknown action type' };
      }
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }

  /**
   * 执行发送邮件动作
   */
  private async executeSendEmail(
    action: ActionConfig,
    customer: Customer
  ): Promise<{ success: boolean; message?: string }> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
    const { template, subject, body } = action.config as any;

    // 这里应该集成邮件服务（如SendGrid、AWS SES等）
    // 目前仅记录日志
    console.log('Sending email to:', customer.email);
    console.log('Subject:', subject);
    console.log('Template:', template);

    // 模拟发送成功
    return {
      success: true,
      message: `Email sent to ${customer.email}`,
    };
  }

  /**
   * 执行发送短信动作
   */
  private async executeSendSMS(
    action: ActionConfig,
    customer: Customer
  ): Promise<{ success: boolean; message?: string }> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { message } = action.config as any;

    if (!customer.phone) {
      return { success: false, message: 'Customer has no phone number' };
    }

    // 这里应该集成短信服务（如Twilio等）
    console.log('Sending SMS to:', customer.phone);
    console.log('Message:', message);

    return {
      success: true,
      message: `SMS sent to ${customer.phone}`,
    };
  }

  /**
   * 执行添加标签动作
   */
  private async executeAddTag(
    action: ActionConfig,
    customer: Customer
  ): Promise<{ success: boolean; message?: string }> {
    const { tags } = action.config;
    const supabase = await createClient();

    // 更新客户标签（假设在rfm_score中存储标签）
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const currentTags = (customer.rfm_score as any)?.tags || [];
    const newTags = Array.from(new Set([...currentTags, ...tags]));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('crm_customers')
      .update({
        rfm_score: {
          ...customer.rfm_score,
          tags: newTags,
        },
      })
      .eq('id', customer.id);

    if (error) {
      return { success: false, message: error.message };
    }

    return {
      success: true,
      message: `Tags added: ${tags.join(', ')}`,
    };
  }

  /**
   * 执行更新分层动作
   */
  private async executeUpdateSegment(
    action: ActionConfig,
    customer: Customer
  ): Promise<{ success: boolean; message?: string }> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { segment } = action.config as any;
    const supabase = await createClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('crm_customers')
      .update({ segment })
      .eq('id', customer.id);

    if (error) {
      return { success: false, message: error.message };
    }

    return {
      success: true,
      message: `Segment updated to ${segment}`,
    };
  }

  /**
   * 执行Webhook动作
   */
  private async executeWebhook(
    action: ActionConfig,
    customer: Customer
  ): Promise<{ success: boolean; message?: string }> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { url, method = 'POST', headers = {} } = action.config as any;

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: JSON.stringify({
          customer,
          timestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        return {
          success: false,
          message: `Webhook failed: ${response.statusText}`,
        };
      }

      return {
        success: true,
        message: 'Webhook executed successfully',
      };
    } catch (error: unknown) {
      return { success: false, message: error.message };
    }
  }

  /**
   * 执行自动化规则
   * @param rule 自动化规则
   * @param customer 客户数据
   * @param context 上下文数据
   */
  async executeRule(
    rule: AutomationRule,
    customer: Customer,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    context?: Record<string, any>
  ): Promise<AutomationExecution> {
    const supabase = await createClient();

    // 创建执行记录
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: execution, error: executionError } = await (supabase as any)
      .from('automation_executions')
      .insert({
        rule_id: rule.id,
        customer_id: customer.id,
        status: 'running',
        trigger_data: context || {},
        actions_executed: 0,
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (executionError || !execution) {
      throw new Error('Failed to create execution record');
    }

    let actionsExecuted = 0;
    const errors: string[] = [];

    // 执行所有动作
    for (const action of rule.actions) {
      const result = await this.executeAction(action, customer);

      // 记录日志
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from('automation_logs').insert({
        rule_id: rule.id,
        execution_id: execution.id,
        action_type: action.type,
        status: result.success ? 'success' : 'failed',
        details: action.config,
        error_message: result.message,
        created_at: new Date().toISOString(),
      });

      if (result.success) {
        actionsExecuted++;
      } else {
        errors.push(result.message || 'Unknown error');
      }
    }

    // 更新执行记录
    const finalStatus = errors.length === 0 ? 'completed' : 'failed';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from('automation_executions')
      .update({
        status: finalStatus,
        actions_executed: actionsExecuted,
        error_message: errors.join('; '),
        completed_at: new Date().toISOString(),
      })
      .eq('id', execution.id);

    // 更新规则的最后运行时间
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from('automation_rules')
      .update({ last_run_at: new Date().toISOString() })
      .eq('id', rule.id);

    return {
      ...execution,
      status: finalStatus as 'pending' | 'running' | 'completed' | 'failed',
      actions_executed: actionsExecuted,
      error_message: errors.join('; ') || undefined,
      completed_at: new Date().toISOString(),
    };
  }

  /**
   * 检查并执行所有活跃的自动化规则
   * @param userId 用户ID
   */
  async checkAndExecuteRules(userId: string): Promise<void> {
    const supabase = await createClient();

    // 获取所有活跃的规则
    const { data: rules } = await supabase
      .from('automation_rules')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active');

    if (!rules || rules.length === 0) {
      return;
    }

    // 获取所有客户
    const { data: customers } = await supabase
      .from('crm_customers')
      .select('*')
      .eq('user_id', userId);

    if (!customers || customers.length === 0) {
      return;
    }

    // 检查每个规则对每个客户
    for (const rule of rules as AutomationRule[]) {
      for (const customer of customers as Customer[]) {
        const shouldTrigger = await this.evaluateTrigger(
          rule.trigger,
          customer
        );

        if (shouldTrigger) {
          await this.executeRule(rule, customer);
        }
      }
    }
  }
}

export const automationEngine = new AutomationEngine();
