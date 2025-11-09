import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import jwt from 'jsonwebtoken';
import WorkflowEngine from '@/lib/workflow-engine';

const sql = neon(process.env.DATABASE_URL!);

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const workflowId = parseInt(params.id);

    // Get JWT token from headers
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    const userId = decoded.userId;

    // Check workflow exists and belongs to user
    const workflowCheck = await sql`
      SELECT id FROM email_workflows
      WHERE id = ${workflowId}
      AND user_id = ${userId}
    `;

    if (workflowCheck.length === 0) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });
    }

    // Get test data from request body
    const body = await request.json();
    const { testData = {} } = body;

    // Initialize workflow engine
    const engine = new WorkflowEngine();

    // Determine trigger type from workflow
    const triggers = await sql`
      SELECT trigger_type FROM workflow_triggers
      WHERE workflow_id = ${workflowId}
      LIMIT 1
    `;

    if (triggers.length === 0) {
      return NextResponse.json({ error: 'Workflow has no triggers' }, { status: 400 });
    }

    const triggerType = triggers[0].trigger_type;

    // Execute workflow manually with test data
    // Note: This bypasses condition checking for testing purposes
    const result = await executeWorkflowManually(workflowId, triggerType, testData);

    return NextResponse.json({ 
      message: 'Workflow executed successfully',
      execution: result
    }, { status: 200 });
  } catch (error: any) {
    console.error('Error executing workflow:', error);
    return NextResponse.json({ 
      error: 'Failed to execute workflow',
      details: error.message 
    }, { status: 500 });
  }
}

async function executeWorkflowManually(
  workflowId: number,
  triggerType: string,
  testData: any
) {
  // Get workflow details
  const workflow = await sql`
    SELECT w.*,
      (
        SELECT json_agg(
          json_build_object(
            'id', t.id,
            'trigger_type', t.trigger_type,
            'trigger_config', t.trigger_config
          )
        )
        FROM workflow_triggers t
        WHERE t.workflow_id = w.id
      ) as triggers,
      (
        SELECT json_agg(
          json_build_object(
            'id', c.id,
            'condition_type', c.condition_type,
            'operator', c.operator,
            'value', c.value
          )
        )
        FROM workflow_conditions c
        WHERE c.workflow_id = w.id
      ) as conditions,
      (
        SELECT json_agg(
          json_build_object(
            'id', a.id,
            'action_type', a.action_type,
            'action_config', a.action_config,
            'execution_order', a.execution_order
          ) ORDER BY a.execution_order
        )
        FROM workflow_actions a
        WHERE a.workflow_id = w.id
      ) as actions
    FROM email_workflows w
    WHERE w.id = ${workflowId}
  `;

  if (workflow.length === 0) {
    throw new Error('Workflow not found');
  }

  const wf = workflow[0];

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
      ${workflowId},
      ${testData.email_id || null},
      ${triggerType},
      ${JSON.stringify(testData)}::jsonb,
      'running',
      ${wf.actions?.length || 0},
      NOW()
    )
    RETURNING id
  `;

  const executionId = execution[0].id;

  try {
    const actionResults = [];

    // Execute each action
    if (wf.actions && wf.actions.length > 0) {
      for (let i = 0; i < wf.actions.length; i++) {
        const action = wf.actions[i];

        try {
          // Log action start
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

          // Simulate action execution
          const result = {
            action_type: action.action_type,
            action_config: action.action_config,
            status: 'simulated',
            message: `Action ${action.action_type} would be executed with config: ${JSON.stringify(action.action_config)}`
          };

          actionResults.push(result);

          // Update action log
          await sql`
            UPDATE workflow_action_logs
            SET status = 'completed',
                result = ${JSON.stringify(result)}::jsonb
            WHERE id = ${logId}
          `;

          // Update execution progress
          await sql`
            UPDATE workflow_executions
            SET actions_executed = ${i + 1}
            WHERE id = ${executionId}
          `;
        } catch (actionError: any) {
          console.error(`Error executing action:`, actionError);
          actionResults.push({
            action_type: action.action_type,
            status: 'failed',
            error: actionError.message
          });
        }
      }
    }

    // Mark execution as completed
    await sql`
      UPDATE workflow_executions
      SET status = 'completed',
          completed_at = NOW()
      WHERE id = ${executionId}
    `;

    return {
      execution_id: executionId,
      workflow_id: workflowId,
      trigger_type: triggerType,
      test_data: testData,
      actions_executed: actionResults.length,
      actions_total: wf.actions?.length || 0,
      action_results: actionResults,
      status: 'completed'
    };
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
