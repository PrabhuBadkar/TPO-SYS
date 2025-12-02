/**
 * Workflow Service
 * Automated workflows and triggers
 */

import { PrismaClient } from '@prisma/client';
import { notificationService } from './notification.service';
import { reminderService } from './reminder.service';

const prisma = new PrismaClient();

export type WorkflowTrigger = 
  | 'APPLICATION_SUBMITTED' | 'APPLICATION_DEADLINE_APPROACHING'
  | 'PROFILE_INCOMPLETE' | 'DOCUMENT_MISSING'
  | 'OFFER_RECEIVED' | 'OFFER_EXPIRING'
  | 'EVENT_UPCOMING' | 'VERIFICATION_PENDING';

export type WorkflowAction = 
  | 'SEND_NOTIFICATION' | 'SEND_REMINDER' | 'UPDATE_STATUS'
  | 'APPROVE_APPLICATION' | 'GENERATE_REPORT' | 'SEND_EMAIL';

export interface WorkflowTemplate {
  name: string;
  description: string;
  trigger: WorkflowTrigger;
  conditions: Record<string, any>;
  actions: Array<{
    type: WorkflowAction;
    config: Record<string, any>;
  }>;
  is_active: boolean;
}

export interface WorkflowExecution {
  workflow_id: string;
  trigger_data: Record<string, any>;
  executed_at: Date;
  status: 'success' | 'failed';
  result?: any;
  error?: string;
}

/**
 * Workflow Service
 */
export class WorkflowService {
  /**
   * Create workflow template
   */
  async createWorkflow(template: WorkflowTemplate, creatorId: string): Promise<any> {
    try {
      const workflow = await prisma.workflowTemplate.create({
        data: {
          name: template.name,
          description: template.description,
          trigger: template.trigger,
          conditions: template.conditions,
          actions: template.actions,
          is_active: template.is_active,
          created_by: creatorId,
        },
      });

      console.log('[Workflow] Template created:', workflow.id);

      return {
        success: true,
        workflow,
      };
    } catch (error) {
      console.error('[Workflow] Error creating template:', error);
      throw new Error('Failed to create workflow template');
    }
  }

  /**
   * Get active workflows
   */
  async getActiveWorkflows(): Promise<any> {
    try {
      const workflows = await prisma.workflowTemplate.findMany({
        where: { is_active: true },
        orderBy: { created_at: 'desc' },
      });

      return {
        success: true,
        workflows,
        count: workflows.length,
      };
    } catch (error) {
      console.error('[Workflow] Error getting workflows:', error);
      throw new Error('Failed to get workflows');
    }
  }

  /**
   * Execute workflow
   */
  async executeWorkflow(workflowId: string, triggerData: Record<string, any>): Promise<any> {
    try {
      const workflow = await prisma.workflowTemplate.findUnique({
        where: { id: workflowId },
      });

      if (!workflow || !workflow.is_active) {
        throw new Error('Workflow not found or inactive');
      }

      // Check conditions
      const conditionsMet = this.checkConditions(workflow.conditions, triggerData);

      if (!conditionsMet) {
        console.log('[Workflow] Conditions not met for:', workflowId);
        return {
          success: false,
          message: 'Workflow conditions not met',
        };
      }

      // Execute actions
      const results = [];
      for (const action of workflow.actions as any[]) {
        const result = await this.executeAction(action.type, action.config, triggerData);
        results.push(result);
      }

      // Log execution
      await this.logExecution({
        workflow_id: workflowId,
        trigger_data: triggerData,
        executed_at: new Date(),
        status: 'success',
        result: results,
      });

      console.log('[Workflow] Executed successfully:', workflowId);

      return {
        success: true,
        results,
      };
    } catch (error) {
      console.error('[Workflow] Error executing workflow:', error);
      
      // Log failed execution
      await this.logExecution({
        workflow_id: workflowId,
        trigger_data: triggerData,
        executed_at: new Date(),
        status: 'failed',
        error: (error as Error).message,
      });

      throw error;
    }
  }

  /**
   * Process trigger event
   */
  async processTrigger(trigger: WorkflowTrigger, data: Record<string, any>): Promise<any> {
    try {
      // Find workflows matching this trigger
      const workflows = await prisma.workflowTemplate.findMany({
        where: {
          trigger,
          is_active: true,
        },
      });

      console.log('[Workflow] Found', workflows.length, 'workflows for trigger:', trigger);

      const results = [];
      for (const workflow of workflows) {
        try {
          const result = await this.executeWorkflow(workflow.id, data);
          results.push({ workflow_id: workflow.id, ...result });
        } catch (error) {
          console.error('[Workflow] Error executing workflow:', workflow.id, error);
          results.push({
            workflow_id: workflow.id,
            success: false,
            error: (error as Error).message,
          });
        }
      }

      return {
        success: true,
        workflows_executed: results.length,
        results,
      };
    } catch (error) {
      console.error('[Workflow] Error processing trigger:', error);
      throw new Error('Failed to process trigger');
    }
  }

  /**
   * Check if conditions are met
   */
  private checkConditions(conditions: Record<string, any>, data: Record<string, any>): boolean {
    // Simple condition checking - can be extended
    for (const [key, value] of Object.entries(conditions)) {
      if (data[key] !== value) {
        return false;
      }
    }
    return true;
  }

  /**
   * Execute action
   */
  private async executeAction(
    type: WorkflowAction,
    config: Record<string, any>,
    data: Record<string, any>
  ): Promise<any> {
    switch (type) {
      case 'SEND_NOTIFICATION':
        return await this.sendNotificationAction(config, data);
      
      case 'SEND_REMINDER':
        return await this.sendReminderAction(config, data);
      
      case 'UPDATE_STATUS':
        return await this.updateStatusAction(config, data);
      
      case 'APPROVE_APPLICATION':
        return await this.approveApplicationAction(config, data);
      
      case 'SEND_EMAIL':
        return await this.sendEmailAction(config, data);
      
      default:
        console.log('[Workflow] Unknown action type:', type);
        return { success: false, message: 'Unknown action type' };
    }
  }

  /**
   * Send notification action
   */
  private async sendNotificationAction(config: Record<string, any>, data: Record<string, any>): Promise<any> {
    try {
      await notificationService.sendNotification({
        user_id: data.user_id || config.user_id,
        type: config.notification_type || 'workflow',
        title: this.replaceVariables(config.title, data),
        message: this.replaceVariables(config.message, data),
        channels: config.channels || ['in_app'],
      });

      return { success: true, action: 'SEND_NOTIFICATION' };
    } catch (error) {
      console.error('[Workflow] Error sending notification:', error);
      return { success: false, action: 'SEND_NOTIFICATION', error: (error as Error).message };
    }
  }

  /**
   * Send reminder action
   */
  private async sendReminderAction(config: Record<string, any>, data: Record<string, any>): Promise<any> {
    try {
      await reminderService.sendBulkReminder({
        reminder_type: config.reminder_type || 'CUSTOM',
        audience: config.audience || { type: 'all' },
        message: {
          subject: this.replaceVariables(config.subject, data),
          body: this.replaceVariables(config.body, data),
        },
        channels: config.channels || ['in_app', 'email'],
      }, 'workflow-system');

      return { success: true, action: 'SEND_REMINDER' };
    } catch (error) {
      console.error('[Workflow] Error sending reminder:', error);
      return { success: false, action: 'SEND_REMINDER', error: (error as Error).message };
    }
  }

  /**
   * Update status action
   */
  private async updateStatusAction(config: Record<string, any>, data: Record<string, any>): Promise<any> {
    try {
      const { resource_type, resource_id, new_status } = config;

      if (resource_type === 'application') {
        await prisma.application.update({
          where: { id: resource_id || data.application_id },
          data: { status: new_status },
        });
      }

      return { success: true, action: 'UPDATE_STATUS' };
    } catch (error) {
      console.error('[Workflow] Error updating status:', error);
      return { success: false, action: 'UPDATE_STATUS', error: (error as Error).message };
    }
  }

  /**
   * Approve application action
   */
  private async approveApplicationAction(config: Record<string, any>, data: Record<string, any>): Promise<any> {
    try {
      await prisma.application.update({
        where: { id: data.application_id },
        data: { status: 'approved' },
      });

      return { success: true, action: 'APPROVE_APPLICATION' };
    } catch (error) {
      console.error('[Workflow] Error approving application:', error);
      return { success: false, action: 'APPROVE_APPLICATION', error: (error as Error).message };
    }
  }

  /**
   * Send email action
   */
  private async sendEmailAction(config: Record<string, any>, data: Record<string, any>): Promise<any> {
    try {
      // Email sending logic would go here
      console.log('[Workflow] Sending email:', config.to, config.subject);
      
      return { success: true, action: 'SEND_EMAIL' };
    } catch (error) {
      console.error('[Workflow] Error sending email:', error);
      return { success: false, action: 'SEND_EMAIL', error: (error as Error).message };
    }
  }

  /**
   * Replace variables in template
   */
  private replaceVariables(template: string, data: Record<string, any>): string {
    let result = template;
    
    Object.keys(data).forEach(key => {
      result = result.replace(new RegExp(`{{${key}}}`, 'g'), data[key]);
    });

    return result;
  }

  /**
   * Log workflow execution
   */
  private async logExecution(execution: WorkflowExecution): Promise<void> {
    try {
      await prisma.workflowExecution.create({
        data: {
          workflow_id: execution.workflow_id,
          trigger_data: execution.trigger_data,
          executed_at: execution.executed_at,
          status: execution.status,
          result: execution.result || {},
          error: execution.error,
        },
      });
    } catch (error) {
      console.error('[Workflow] Error logging execution:', error);
    }
  }

  /**
   * Get workflow execution history
   */
  async getExecutionHistory(workflowId?: string, limit: number = 50): Promise<any> {
    try {
      const where: any = {};
      if (workflowId) where.workflow_id = workflowId;

      const executions = await prisma.workflowExecution.findMany({
        where,
        orderBy: { executed_at: 'desc' },
        take: limit,
        include: {
          workflow: {
            select: {
              name: true,
              trigger: true,
            },
          },
        },
      });

      return {
        success: true,
        executions,
        count: executions.length,
      };
    } catch (error) {
      console.error('[Workflow] Error getting execution history:', error);
      throw new Error('Failed to get execution history');
    }
  }

  /**
   * Get workflow statistics
   */
  async getStatistics(): Promise<any> {
    try {
      const [totalWorkflows, activeWorkflows, totalExecutions, successfulExecutions] = await Promise.all([
        prisma.workflowTemplate.count(),
        prisma.workflowTemplate.count({ where: { is_active: true } }),
        prisma.workflowExecution.count(),
        prisma.workflowExecution.count({ where: { status: 'success' } }),
      ]);

      return {
        success: true,
        statistics: {
          total_workflows: totalWorkflows,
          active_workflows: activeWorkflows,
          total_executions: totalExecutions,
          successful_executions: successfulExecutions,
          success_rate: totalExecutions > 0 
            ? Math.round((successfulExecutions / totalExecutions) * 100)
            : 0,
        },
      };
    } catch (error) {
      console.error('[Workflow] Error getting statistics:', error);
      throw new Error('Failed to get workflow statistics');
    }
  }
}

// Export singleton instance
export const workflowService = new WorkflowService();
