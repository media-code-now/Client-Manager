import { neon } from '@neondatabase/serverless';
import { EmailService } from './email-service';

const sql = neon(process.env.DATABASE_URL!);

interface WorkflowTrigger {
  id: number;
  workflow_id: number;
  trigger_type: string;
  trigger_config: any;
}

interface WorkflowCondition {
  id: number;
  workflow_id: number;
  condition_type: string;
  operator: string;
  value: string;
}

interface WorkflowAction {
  id: number;
  workflow_id: number;
  action_type: string;
  action_config: any;
  execution_order: number;
}

interface Workflow {
  id: number;
  user_id: number;
  name: string;
  description?: string;
  is_active: boolean;
  triggers: WorkflowTrigger[];
  conditions: WorkflowCondition[];
  actions: WorkflowAction[];
}

export class WorkflowEngine {
  /**
   * Process email received trigger
   */
  async processEmailReceived(emailId: number): Promise<void> {
    try {
      // Get email details
      const emails = await sql`
        SELECT * FROM emails WHERE id = ${emailId}
      `;

      if (emails.length === 0) return;

      const email = emails[0];

      // Find workflows triggered by email_received
      const workflows = await this.findMatchingWorkflows('email_received', {
        email_id: emailId,
        from_email: email.from_email,
        subject: email.subject,
        contact_id: email.contact_id
      });

      // Execute matching workflows
      for (const workflow of workflows) {
        await this.executeWorkflow(workflow, 'email_received', {
          email_id: emailId,
          email_data: email
        });
      }

      // Update contact last_contacted_at if exists
      if (email.contact_id) {
        await sql`
          UPDATE clients
          SET last_contacted_at = NOW()
          WHERE id = ${email.contact_id}
        `;
      }
    } catch (error) {
      console.error('Error processing email received:', error);
    }
  }

  /**
   * Process email sent trigger
   */
  async processEmailSent(emailId: number): Promise<void> {
    try {
      const emails = await sql`
        SELECT * FROM emails WHERE id = ${emailId}
      `;

      if (emails.length === 0) return;

      const email = emails[0];

      const workflows = await this.findMatchingWorkflows('email_sent', {
        email_id: emailId,
        to_emails: email.to_emails,
        subject: email.subject,
        contact_id: email.contact_id
      });

      for (const workflow of workflows) {
        await this.executeWorkflow(workflow, 'email_sent', {
          email_id: emailId,
          email_data: email
        });
      }

      // Schedule follow-up check for "no reply after X days" workflows
      await this.scheduleFollowUpCheck(emailId);

      // Update contact last_contacted_at
      if (email.contact_id) {
        await sql`
          UPDATE clients
          SET last_contacted_at = NOW()
          WHERE id = ${email.contact_id}
        `;
      }
    } catch (error) {
      console.error('Error processing email sent:', error);
    }
  }

  /**
   * Process email opened trigger
   */
  async processEmailOpened(emailId: number): Promise<void> {
    try {
      const emails = await sql`
        SELECT * FROM emails WHERE id = ${emailId}
      `;

      if (emails.length === 0) return;

      const email = emails[0];

      const workflows = await this.findMatchingWorkflows('email_opened', {
        email_id: emailId,
        open_count: email.open_count,
        contact_id: email.contact_id
      });

      for (const workflow of workflows) {
        await this.executeWorkflow(workflow, 'email_opened', {
          email_id: emailId,
          email_data: email
        });
      }

      // Auto-mark lead as engaged if email was opened
      if (email.contact_id) {
        await this.markLeadAsEngaged(email.contact_id, 'Email opened');
      }
    } catch (error) {
      console.error('Error processing email opened:', error);
    }
  }

  /**
   * Process email clicked trigger
   */
  async processEmailClicked(emailId: number, linkUrl?: string): Promise<void> {
    try {
      const emails = await sql`
        SELECT * FROM emails WHERE id = ${emailId}
      `;

      if (emails.length === 0) return;

      const email = emails[0];

      const workflows = await this.findMatchingWorkflows('email_clicked', {
        email_id: emailId,
        link_url: linkUrl,
        click_count: email.click_count,
        contact_id: email.contact_id
      });

      for (const workflow of workflows) {
        await this.executeWorkflow(workflow, 'email_clicked', {
          email_id: emailId,
          link_url: linkUrl,
          email_data: email
        });
      }

      // Auto-mark lead as engaged if link was clicked
      if (email.contact_id) {
        await this.markLeadAsEngaged(email.contact_id, 'Email link clicked');
      }
    } catch (error) {
      console.error('Error processing email clicked:', error);
    }
  }

  /**
   * Process email replied trigger
   */
  async processEmailReplied(originalEmailId: number, replyEmailId: number): Promise<void> {
    try {
      const workflows = await this.findMatchingWorkflows('email_replied', {
        original_email_id: originalEmailId,
        reply_email_id: replyEmailId
      });

      for (const workflow of workflows) {
        await this.executeWorkflow(workflow, 'email_replied', {
          original_email_id: originalEmailId,
          reply_email_id: replyEmailId
        });
      }

      // Cancel any pending follow-ups for the original email
      await sql`
        UPDATE scheduled_followups
        SET status = 'cancelled'
        WHERE original_email_id = ${originalEmailId}
        AND status = 'pending'
      `;
    } catch (error) {
      console.error('Error processing email replied:', error);
    }
  }

  /**
   * Find workflows that match the trigger type and pass conditions
   */
  private async findMatchingWorkflows(triggerType: string, triggerData: any): Promise<Workflow[]> {
    // Get all active workflows with this trigger type
    const workflowsResult = await sql`
      SELECT DISTINCT w.*
      FROM email_workflows w
      JOIN workflow_triggers t ON t.workflow_id = w.id
      WHERE w.is_active = true
      AND t.trigger_type = ${triggerType}
    `;

    const matchingWorkflows: Workflow[] = [];

    for (const workflowRow of workflowsResult) {
      // Get triggers
      const triggers = await sql`
        SELECT * FROM workflow_triggers
        WHERE workflow_id = ${workflowRow.id}
      `;

      // Get conditions
      const conditions = await sql`
        SELECT * FROM workflow_conditions
        WHERE workflow_id = ${workflowRow.id}
      `;

      // Get actions
      const actions = await sql`
        SELECT * FROM workflow_actions
        WHERE workflow_id = ${workflowRow.id}
        ORDER BY execution_order ASC
      `;

      const workflow: Workflow = {
        id: workflowRow.id,
        user_id: workflowRow.user_id,
        name: workflowRow.name,
        description: workflowRow.description,
        is_active: workflowRow.is_active,
        triggers: triggers as WorkflowTrigger[],
        conditions: conditions as WorkflowCondition[],
        actions: actions as WorkflowAction[]
      };

      // Check if all conditions pass
      if (await this.checkConditions(workflow, triggerData)) {
        matchingWorkflows.push(workflow);
      }
    }

    return matchingWorkflows;
  }

  /**
   * Check if all workflow conditions pass
   */
  private async checkConditions(workflow: Workflow, triggerData: any): Promise<boolean> {
    if (workflow.conditions.length === 0) {
      return true; // No conditions means always pass
    }

    for (const condition of workflow.conditions) {
      if (!(await this.evaluateCondition(condition, triggerData))) {
        return false; // All conditions must pass
      }
    }

    return true;
  }

  /**
   * Evaluate a single condition
   */
  private async evaluateCondition(condition: WorkflowCondition, triggerData: any): Promise<boolean> {
    const { condition_type, operator, value } = condition;

    try {
      switch (condition_type) {
        case 'lead_stage':
          if (triggerData.contact_id) {
            const contact = await sql`
              SELECT lead_stage FROM clients WHERE id = ${triggerData.contact_id}
            `;
            if (contact.length === 0) return false;
            return this.compareValues(contact[0].lead_stage, operator, value);
          }
          return false;

        case 'contact_tag':
          if (triggerData.contact_id) {
            const contact = await sql`
              SELECT tags FROM clients WHERE id = ${triggerData.contact_id}
            `;
            if (contact.length === 0 || !contact[0].tags) return false;
            const tags = contact[0].tags;
            return this.compareValues(tags, operator, value);
          }
          return false;

        case 'email_subject_contains':
          if (triggerData.email_data && triggerData.email_data.subject) {
            return this.compareValues(triggerData.email_data.subject, operator, value);
          }
          return false;

        case 'email_from_domain':
          if (triggerData.email_data && triggerData.email_data.from_email) {
            const domain = triggerData.email_data.from_email.split('@')[1];
            return this.compareValues(domain, operator, value);
          }
          return false;

        case 'days_since_last_contact':
          if (triggerData.contact_id) {
            const contact = await sql`
              SELECT last_contacted_at FROM clients WHERE id = ${triggerData.contact_id}
            `;
            if (contact.length === 0 || !contact[0].last_contacted_at) return true;
            
            const daysSince = Math.floor(
              (Date.now() - new Date(contact[0].last_contacted_at).getTime()) / (1000 * 60 * 60 * 24)
            );
            return this.compareValues(daysSince.toString(), operator, value);
          }
          return false;

        default:
          console.warn(`Unknown condition type: ${condition_type}`);
          return true;
      }
    } catch (error) {
      console.error(`Error evaluating condition ${condition_type}:`, error);
      return false;
    }
  }

  /**
   * Compare values based on operator
   */
  private compareValues(actual: any, operator: string, expected: string): boolean {
    const actualStr = String(actual).toLowerCase();
    const expectedStr = String(expected).toLowerCase();

    switch (operator) {
      case 'equals':
        return actualStr === expectedStr;
      case 'not_equals':
        return actualStr !== expectedStr;
      case 'contains':
        return actualStr.includes(expectedStr);
      case 'not_contains':
        return !actualStr.includes(expectedStr);
      case 'greater_than':
        return parseFloat(actual) > parseFloat(expected);
      case 'less_than':
        return parseFloat(actual) < parseFloat(expected);
      case 'in':
        const inList = expectedStr.split(',').map(s => s.trim());
        return inList.includes(actualStr);
      case 'not_in':
        const notInList = expectedStr.split(',').map(s => s.trim());
        return !notInList.includes(actualStr);
      default:
        return false;
    }
  }

  /**
   * Execute a workflow
   */
  private async executeWorkflow(workflow: Workflow, triggerType: string, triggerData: any): Promise<void> {
    // Create execution record
    const execution = await sql`
      INSERT INTO workflow_executions (
        workflow_id,
        trigger_event_id,
        trigger_type,
        trigger_data,
        status,
        actions_total,
        started_at
      ) VALUES (
        ${workflow.id},
        ${triggerData.email_id || null},
        ${triggerType},
        ${JSON.stringify(triggerData)}::jsonb,
        'running',
        ${workflow.actions.length},
        NOW()
      )
      RETURNING id
    `;

    const executionId = execution[0].id;

    try {
      let actionsExecuted = 0;

      // Execute actions in order
      for (const action of workflow.actions) {
        try {
          await this.executeAction(action, triggerData, executionId);
          actionsExecuted++;

          // Update execution progress
          await sql`
            UPDATE workflow_executions
            SET actions_executed = ${actionsExecuted}
            WHERE id = ${executionId}
          `;
        } catch (actionError: any) {
          console.error(`Error executing action ${action.action_type}:`, actionError);
          
          // Log action failure
          await sql`
            UPDATE workflow_action_logs
            SET status = 'failed',
                error_message = ${actionError.message}
            WHERE execution_id = ${executionId}
            AND action_id = ${action.id}
          `;
        }
      }

      // Mark execution as completed
      await sql`
        UPDATE workflow_executions
        SET status = 'completed',
            completed_at = NOW()
        WHERE id = ${executionId}
      `;
    } catch (error: any) {
      // Mark execution as failed
      await sql`
        UPDATE workflow_executions
        SET status = 'failed',
            error_message = ${error.message},
            completed_at = NOW()
        WHERE id = ${executionId}
      `;
      throw error;
    }
  }

  /**
   * Execute a single action
   */
  private async executeAction(action: WorkflowAction, triggerData: any, executionId: number): Promise<void> {
    // Create action log
    const actionLog = await sql`
      INSERT INTO workflow_action_logs (
        execution_id,
        action_id,
        action_type,
        action_config,
        status
      ) VALUES (
        ${executionId},
        ${action.id},
        ${action.action_type},
        ${JSON.stringify(action.action_config)}::jsonb,
        'running'
      )
      RETURNING id
    `;

    const logId = actionLog[0].id;

    try {
      let result = null;

      switch (action.action_type) {
        case 'send_email':
          result = await this.actionSendEmail(action.action_config, triggerData);
          break;

        case 'update_lead_stage':
          result = await this.actionUpdateLeadStage(action.action_config, triggerData);
          break;

        case 'add_tag':
          result = await this.actionAddTag(action.action_config, triggerData);
          break;

        case 'remove_tag':
          result = await this.actionRemoveTag(action.action_config, triggerData);
          break;

        case 'create_task':
          result = await this.actionCreateTask(action.action_config, triggerData);
          break;

        case 'send_notification':
          result = await this.actionSendNotification(action.action_config, triggerData);
          break;

        case 'mark_as_engaged':
          result = await this.actionMarkAsEngaged(action.action_config, triggerData);
          break;

        case 'update_contact_field':
          result = await this.actionUpdateContactField(action.action_config, triggerData);
          break;

        default:
          throw new Error(`Unknown action type: ${action.action_type}`);
      }

      // Update action log as completed
      await sql`
        UPDATE workflow_action_logs
        SET status = 'completed',
            result = ${JSON.stringify(result)}::jsonb
        WHERE id = ${logId}
      `;
    } catch (error: any) {
      // Update action log as failed
      await sql`
        UPDATE workflow_action_logs
        SET status = 'failed',
            error_message = ${error.message}
        WHERE id = ${logId}
      `;
      throw error;
    }
  }

  // Action implementations

  private async actionSendEmail(config: any, triggerData: any): Promise<any> {
    const { template_id, delay_hours = 0 } = config;

    // Get template
    const template = await sql`
      SELECT * FROM email_templates WHERE id = ${template_id}
    `;

    if (template.length === 0) {
      throw new Error(`Template ${template_id} not found`);
    }

    // Get contact info if available
    let recipientEmail = null;
    let contactName = 'there';

    if (triggerData.contact_id) {
      const contact = await sql`
        SELECT email, first_name, last_name FROM clients WHERE id = ${triggerData.contact_id}
      `;
      if (contact.length > 0) {
        recipientEmail = contact[0].email;
        contactName = `${contact[0].first_name} ${contact[0].last_name}`.trim();
      }
    } else if (triggerData.email_data) {
      recipientEmail = triggerData.email_data.from_email;
    }

    if (!recipientEmail) {
      throw new Error('No recipient email found');
    }

    // TODO: Implement variable substitution in template
    // TODO: Schedule email if delay_hours > 0
    // TODO: Actually send the email

    return {
      template_id,
      recipient: recipientEmail,
      scheduled: delay_hours > 0
    };
  }

  private async actionUpdateLeadStage(config: any, triggerData: any): Promise<any> {
    const { stage, reason } = config;

    if (!triggerData.contact_id) {
      throw new Error('No contact ID available');
    }

    await sql`
      UPDATE clients
      SET lead_stage = ${stage},
          updated_at = NOW()
      WHERE id = ${triggerData.contact_id}
    `;

    return { contact_id: triggerData.contact_id, new_stage: stage, reason };
  }

  private async actionAddTag(config: any, triggerData: any): Promise<any> {
    const { tag } = config;

    if (!triggerData.contact_id) {
      throw new Error('No contact ID available');
    }

    // Get current tags
    const contact = await sql`
      SELECT tags FROM clients WHERE id = ${triggerData.contact_id}
    `;

    if (contact.length === 0) {
      throw new Error('Contact not found');
    }

    const currentTags = contact[0].tags || [];
    if (!currentTags.includes(tag)) {
      currentTags.push(tag);
      
      await sql`
        UPDATE clients
        SET tags = ${currentTags},
            updated_at = NOW()
        WHERE id = ${triggerData.contact_id}
      `;
    }

    return { contact_id: triggerData.contact_id, tag, tags: currentTags };
  }

  private async actionRemoveTag(config: any, triggerData: any): Promise<any> {
    const { tag } = config;

    if (!triggerData.contact_id) {
      throw new Error('No contact ID available');
    }

    const contact = await sql`
      SELECT tags FROM clients WHERE id = ${triggerData.contact_id}
    `;

    if (contact.length === 0) {
      throw new Error('Contact not found');
    }

    const currentTags = contact[0].tags || [];
    const newTags = currentTags.filter((t: string) => t !== tag);
    
    await sql`
      UPDATE clients
      SET tags = ${newTags},
          updated_at = NOW()
      WHERE id = ${triggerData.contact_id}
    `;

    return { contact_id: triggerData.contact_id, removed_tag: tag, tags: newTags };
  }

  private async actionCreateTask(config: any, triggerData: any): Promise<any> {
    const { title, description, due_in_days = 1, priority = 'Medium' } = config;

    if (!triggerData.contact_id) {
      throw new Error('No contact ID available');
    }

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + due_in_days);

    // TODO: Create task in tasks table
    return {
      contact_id: triggerData.contact_id,
      title,
      due_date: dueDate.toISOString()
    };
  }

  private async actionSendNotification(config: any, triggerData: any): Promise<any> {
    const { user_id, message } = config;

    // TODO: Create notification in notifications table
    return { user_id, message, sent: true };
  }

  private async actionMarkAsEngaged(config: any, triggerData: any): Promise<any> {
    if (!triggerData.contact_id) {
      throw new Error('No contact ID available');
    }

    await this.markLeadAsEngaged(triggerData.contact_id, config.reason || 'Workflow action');

    return { contact_id: triggerData.contact_id, marked_engaged: true };
  }

  private async actionUpdateContactField(config: any, triggerData: any): Promise<any> {
    const { field, value } = config;

    if (!triggerData.contact_id) {
      throw new Error('No contact ID available');
    }

    // TODO: Validate field name and update
    return { contact_id: triggerData.contact_id, field, value };
  }

  /**
   * Mark lead as engaged and update engagement score
   */
  private async markLeadAsEngaged(contactId: number, reason: string): Promise<void> {
    await sql`
      UPDATE clients
      SET lead_stage = CASE 
            WHEN lead_stage IN ('new', 'contacted') THEN 'engaged'
            ELSE lead_stage
          END,
          engagement_score = engagement_score + 10,
          updated_at = NOW()
      WHERE id = ${contactId}
    `;
  }

  /**
   * Schedule follow-up check for emails with no reply
   */
  private async scheduleFollowUpCheck(emailId: number): Promise<void> {
    // Find workflows with "no_reply_after_days" trigger
    const workflows = await sql`
      SELECT w.*, t.trigger_config
      FROM email_workflows w
      JOIN workflow_triggers t ON t.workflow_id = w.id
      WHERE w.is_active = true
      AND t.trigger_type = 'no_reply_after_days'
    `;

    for (const workflow of workflows) {
      const config = workflow.trigger_config || {};
      const days = config.days || 3;

      const scheduledFor = new Date();
      scheduledFor.setDate(scheduledFor.getDate() + days);

      const email = await sql`
        SELECT contact_id FROM emails WHERE id = ${emailId}
      `;

      await sql`
        INSERT INTO scheduled_followups (
          original_email_id,
          workflow_id,
          contact_id,
          scheduled_for,
          days_after_original,
          status
        ) VALUES (
          ${emailId},
          ${workflow.id},
          ${email[0]?.contact_id || null},
          ${scheduledFor.toISOString()},
          ${days},
          'pending'
        )
      `;
    }
  }

  /**
   * Process pending follow-ups (should be called by a cron job)
   */
  async processPendingFollowUps(): Promise<void> {
    const now = new Date().toISOString();

    // Find pending follow-ups that are due
    const followups = await sql`
      SELECT f.*, e.thread_id, e.contact_id, e.reply_count
      FROM scheduled_followups f
      JOIN emails e ON e.id = f.original_email_id
      WHERE f.status = 'pending'
      AND f.scheduled_for <= ${now}
    `;

    for (const followup of followups) {
      try {
        // Check if email was replied to
        if (followup.reply_count > 0) {
          // Mark as cancelled since reply was received
          await sql`
            UPDATE scheduled_followups
            SET status = 'cancelled',
                execution_result = '{"reason": "Reply received"}'::jsonb
            WHERE id = ${followup.id}
          `;
          continue;
        }

        // Execute the workflow
        const workflow = await this.findMatchingWorkflows('no_reply_after_days', {
          email_id: followup.original_email_id,
          contact_id: followup.contact_id,
          days_since: followup.days_after_original
        });

        for (const wf of workflow) {
          await this.executeWorkflow(wf, 'no_reply_after_days', {
            email_id: followup.original_email_id,
            contact_id: followup.contact_id,
            followup_id: followup.id
          });
        }

        // Mark as executed
        await sql`
          UPDATE scheduled_followups
          SET status = 'executed',
              executed_at = NOW(),
              execution_result = '{"success": true}'::jsonb
          WHERE id = ${followup.id}
        `;
      } catch (error: any) {
        console.error(`Error processing followup ${followup.id}:`, error);
        
        await sql`
          UPDATE scheduled_followups
          SET status = 'failed',
              execution_result = ${JSON.stringify({ error: error.message })}::jsonb
          WHERE id = ${followup.id}
        `;
      }
    }
  }
}

export default WorkflowEngine;
