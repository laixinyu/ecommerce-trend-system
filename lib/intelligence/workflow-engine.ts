import { createClient } from '@/lib/supabase/server';
import {
  Workflow,
  WorkflowStep,
  WorkflowExecution,
  WorkflowLog,
  WorkflowCondition,
  StepConfig,
} from '@/types/intelligence';

export class WorkflowEngine {
  private supabase: any;
  private userId: string;

  constructor(supabase: any, userId: string) {
    this.supabase = supabase;
    this.userId = userId;
  }

  /**
   * Execute a workflow
   */
  async executeWorkflow(workflowId: string, context: any = {}): Promise<WorkflowExecution> {
    // Fetch workflow
    const { data: workflow, error } = await this.supabase
      .from('workflows')
      .select('*')
      .eq('id', workflowId)
      .eq('user_id', this.userId)
      .single();

    if (error || !workflow) {
      throw new Error('Workflow not found');
    }

    if (workflow.status !== 'active') {
      throw new Error('Workflow is not active');
    }

    // Create execution record
    const execution: WorkflowExecution = {
      id: crypto.randomUUID(),
      workflow_id: workflowId,
      status: 'running',
      started_at: new Date().toISOString(),
      logs: [],
    };

    try {
      // Execute workflow steps
      await this.executeSteps(workflow, execution, context);

      execution.status = 'completed';
      execution.completed_at = new Date().toISOString();
    } catch (error: any) {
      execution.status = 'failed';
      execution.error = error.message;
      execution.completed_at = new Date().toISOString();
      
      this.addLog(execution, 'error', 'Workflow failed', { error: error.message });
    }

    // Save execution record
    await this.saveExecution(execution);

    // Update workflow last_run_at
    await this.supabase
      .from('workflows')
      .update({ last_run_at: new Date().toISOString() })
      .eq('id', workflowId);

    return execution;
  }

  /**
   * Execute workflow steps sequentially
   */
  private async executeSteps(
    workflow: Workflow,
    execution: WorkflowExecution,
    context: any
  ): Promise<void> {
    if (!workflow.steps || workflow.steps.length === 0) {
      throw new Error('Workflow has no steps');
    }

    let currentStep = workflow.steps[0];
    let stepIndex = 0;
    const maxIterations = 100; // Prevent infinite loops

    while (currentStep && stepIndex < maxIterations) {
      this.addLog(execution, 'info', `Executing step: ${currentStep.name}`, {
        step_id: currentStep.id,
        type: currentStep.type,
      });

      const result = await this.executeStep(currentStep, execution, context);

      // Determine next step
      if (currentStep.type === 'condition') {
        const nextStepId = result.passed ? currentStep.next_step_id : currentStep.else_step_id;
        currentStep = workflow.steps.find(s => s.id === nextStepId);
      } else {
        currentStep = workflow.steps.find(s => s.id === currentStep.next_step_id);
      }

      stepIndex++;
    }

    if (stepIndex >= maxIterations) {
      throw new Error('Workflow exceeded maximum iterations');
    }
  }

  /**
   * Execute a single workflow step
   */
  private async executeStep(
    step: WorkflowStep,
    execution: WorkflowExecution,
    context: any
  ): Promise<any> {
    switch (step.type) {
      case 'condition':
        return this.executeConditionStep(step, execution, context);
      case 'action':
        return this.executeActionStep(step, execution, context);
      case 'delay':
        return this.executeDelayStep(step, execution);
      case 'loop':
        return this.executeLoopStep(step, execution, context);
      default:
        throw new Error(`Unknown step type: ${step.type}`);
    }
  }

  /**
   * Execute condition step
   */
  private async executeConditionStep(
    step: WorkflowStep,
    execution: WorkflowExecution,
    context: any
  ): Promise<{ passed: boolean }> {
    const config = step.config;
    const conditions = config.conditions || [];
    const operator = config.operator || 'and';

    if (conditions.length === 0) {
      return { passed: true };
    }

    const results = conditions.map(condition => 
      this.evaluateCondition(condition, context)
    );

    const passed = operator === 'and' 
      ? results.every(r => r)
      : results.some(r => r);

    this.addLog(execution, 'info', `Condition evaluated: ${passed}`, {
      step_id: step.id,
      conditions,
      results,
    });

    return { passed };
  }

  /**
   * Evaluate a single condition
   */
  private evaluateCondition(condition: WorkflowCondition, context: any): boolean {
    const fieldValue = this.getFieldValue(condition.field, context);
    const compareValue = condition.value;

    switch (condition.operator) {
      case 'eq':
        return fieldValue === compareValue;
      case 'ne':
        return fieldValue !== compareValue;
      case 'gt':
        return fieldValue > compareValue;
      case 'gte':
        return fieldValue >= compareValue;
      case 'lt':
        return fieldValue < compareValue;
      case 'lte':
        return fieldValue <= compareValue;
      case 'contains':
        return String(fieldValue).includes(String(compareValue));
      case 'in':
        return Array.isArray(compareValue) && compareValue.includes(fieldValue);
      default:
        return false;
    }
  }

  /**
   * Get field value from context using dot notation
   */
  private getFieldValue(field: string, context: any): any {
    const parts = field.split('.');
    let value = context;

    for (const part of parts) {
      if (value && typeof value === 'object' && part in value) {
        value = value[part];
      } else {
        return undefined;
      }
    }

    return value;
  }

  /**
   * Execute action step
   */
  private async executeActionStep(
    step: WorkflowStep,
    execution: WorkflowExecution,
    context: any
  ): Promise<any> {
    const config = step.config;
    const actionType = config.action_type;
    const actionParams = config.action_params || {};

    this.addLog(execution, 'info', `Executing action: ${actionType}`, {
      step_id: step.id,
      params: actionParams,
    });

    switch (actionType) {
      case 'send_email':
        return this.sendEmail(actionParams, context);
      case 'send_notification':
        return this.sendNotification(actionParams, context);
      case 'update_database':
        return this.updateDatabase(actionParams, context);
      case 'call_api':
        return this.callApi(actionParams, context);
      case 'trigger_workflow':
        return this.triggerWorkflow(actionParams, context);
      default:
        throw new Error(`Unknown action type: ${actionType}`);
    }
  }

  /**
   * Execute delay step
   */
  private async executeDelayStep(
    step: WorkflowStep,
    execution: WorkflowExecution
  ): Promise<void> {
    const config = step.config;
    const duration = config.duration || 0;
    const unit = config.unit || 'seconds';

    let milliseconds = duration * 1000;
    if (unit === 'minutes') milliseconds *= 60;
    if (unit === 'hours') milliseconds *= 3600;
    if (unit === 'days') milliseconds *= 86400;

    this.addLog(execution, 'info', `Delaying for ${duration} ${unit}`, {
      step_id: step.id,
    });

    await new Promise(resolve => setTimeout(resolve, milliseconds));
  }

  /**
   * Execute loop step
   */
  private async executeLoopStep(
    step: WorkflowStep,
    execution: WorkflowExecution,
    context: any
  ): Promise<void> {
    const config = step.config;
    const itemsPath = config.items || '';
    const maxIterations = config.max_iterations || 100;

    const items = this.getFieldValue(itemsPath, context);
    if (!Array.isArray(items)) {
      throw new Error('Loop items must be an array');
    }

    this.addLog(execution, 'info', `Looping over ${items.length} items`, {
      step_id: step.id,
    });

    for (let i = 0; i < Math.min(items.length, maxIterations); i++) {
      const itemContext = { ...context, current_item: items[i], index: i };
      // Execute nested steps would go here
      // For simplicity, we'll just log
      this.addLog(execution, 'info', `Processing item ${i + 1}/${items.length}`, {
        step_id: step.id,
        item: items[i],
      });
    }
  }

  /**
   * Action implementations
   */
  private async sendEmail(params: any, context: any): Promise<void> {
    // Placeholder for email sending
    console.log('Sending email:', params);
  }

  private async sendNotification(params: any, context: any): Promise<void> {
    // Create in-app notification
    await this.supabase.from('notifications').insert({
      user_id: this.userId,
      title: params.title || 'Workflow Notification',
      message: params.message || '',
      type: 'workflow',
      created_at: new Date().toISOString(),
    });
  }

  private async updateDatabase(params: any, context: any): Promise<void> {
    const { table, id, data } = params;
    
    await this.supabase
      .from(table)
      .update(data)
      .eq('id', id)
      .eq('user_id', this.userId);
  }

  private async callApi(params: any, context: any): Promise<any> {
    const { url, method = 'GET', headers = {}, body } = params;

    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    return response.json();
  }

  private async triggerWorkflow(params: any, context: any): Promise<void> {
    const { workflow_id } = params;
    
    // Trigger another workflow asynchronously
    const engine = new WorkflowEngine(this.supabase, this.userId);
    await engine.executeWorkflow(workflow_id, context);
  }

  /**
   * Helper methods
   */
  private addLog(
    execution: WorkflowExecution,
    level: 'info' | 'warning' | 'error',
    message: string,
    data?: any
  ): void {
    execution.logs.push({
      step_id: data?.step_id || '',
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
    });
  }

  private async saveExecution(execution: WorkflowExecution): Promise<void> {
    await this.supabase.from('workflow_executions').insert({
      id: execution.id,
      workflow_id: execution.workflow_id,
      user_id: this.userId,
      status: execution.status,
      started_at: execution.started_at,
      completed_at: execution.completed_at,
      error: execution.error,
      logs: execution.logs,
    });
  }

  /**
   * Check if workflow should be triggered based on trigger config
   */
  static shouldTrigger(workflow: Workflow, event: any): boolean {
    const trigger = workflow.trigger;

    if (trigger.type === 'manual') {
      return false; // Manual workflows don't auto-trigger
    }

    if (trigger.type === 'event') {
      const config = trigger.config as any;
      if (config.event_type !== event.type) {
        return false;
      }

      // Check conditions
      if (config.conditions && config.conditions.length > 0) {
        const engine = new WorkflowEngine(null as any, '');
        return config.conditions.every((condition: WorkflowCondition) =>
          engine['evaluateCondition'](condition, event.data)
        );
      }

      return true;
    }

    return false;
  }
}
