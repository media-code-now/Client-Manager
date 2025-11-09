import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import jwt from 'jsonwebtoken';

// Force dynamic rendering (don't prerender at build time)
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';


const sql = neon(process.env.DATABASE_URL!);

export async function GET(
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

    // Fetch workflow with nested data
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
      AND w.user_id = ${userId}
    `;

    if (workflow.length === 0) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });
    }

    return NextResponse.json({ workflow: workflow[0] }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching workflow:', error);
    return NextResponse.json({ error: 'Failed to fetch workflow' }, { status: 500 });
  }
}

export async function PUT(
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

    const body = await request.json();
    const { name, description, triggers, conditions = [], actions, is_active } = body;

    // Check workflow exists and belongs to user
    const existing = await sql`
      SELECT id FROM email_workflows
      WHERE id = ${workflowId}
      AND user_id = ${userId}
    `;

    if (existing.length === 0) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });
    }

    // Update workflow
    await sql`
      UPDATE email_workflows
      SET name = ${name},
          description = ${description || null},
          is_active = ${is_active},
          updated_at = NOW()
      WHERE id = ${workflowId}
    `;

    // Delete existing triggers, conditions, and actions
    await sql`DELETE FROM workflow_triggers WHERE workflow_id = ${workflowId}`;
    await sql`DELETE FROM workflow_conditions WHERE workflow_id = ${workflowId}`;
    await sql`DELETE FROM workflow_actions WHERE workflow_id = ${workflowId}`;

    // Create new triggers
    if (triggers && triggers.length > 0) {
      for (const trigger of triggers) {
        await sql`
          INSERT INTO workflow_triggers (workflow_id, trigger_type, trigger_config)
          VALUES (${workflowId}, ${trigger.trigger_type}, ${JSON.stringify(trigger.trigger_config || {})}::jsonb)
        `;
      }
    }

    // Create new conditions
    if (conditions && conditions.length > 0) {
      for (const condition of conditions) {
        await sql`
          INSERT INTO workflow_conditions (workflow_id, condition_type, operator, value)
          VALUES (${workflowId}, ${condition.condition_type}, ${condition.operator}, ${condition.value})
        `;
      }
    }

    // Create new actions
    if (actions && actions.length > 0) {
      for (let i = 0; i < actions.length; i++) {
        const action = actions[i];
        await sql`
          INSERT INTO workflow_actions (workflow_id, action_type, action_config, execution_order)
          VALUES (
            ${workflowId},
            ${action.action_type},
            ${JSON.stringify(action.action_config || {})}::jsonb,
            ${action.execution_order || i}
          )
        `;
      }
    }

    // Fetch updated workflow
    const updatedWorkflow = await sql`
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

    return NextResponse.json({ workflow: updatedWorkflow[0] }, { status: 200 });
  } catch (error: any) {
    console.error('Error updating workflow:', error);
    return NextResponse.json({ error: 'Failed to update workflow' }, { status: 500 });
  }
}

export async function DELETE(
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
    const existing = await sql`
      SELECT id FROM email_workflows
      WHERE id = ${workflowId}
      AND user_id = ${userId}
    `;

    if (existing.length === 0) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });
    }

    // Delete workflow (triggers/conditions/actions will cascade due to foreign keys)
    await sql`DELETE FROM email_workflows WHERE id = ${workflowId}`;

    return NextResponse.json({ message: 'Workflow deleted successfully' }, { status: 200 });
  } catch (error: any) {
    console.error('Error deleting workflow:', error);
    return NextResponse.json({ error: 'Failed to delete workflow' }, { status: 500 });
  }
}

export async function PATCH(
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
    const existing = await sql`
      SELECT is_active FROM email_workflows
      WHERE id = ${workflowId}
      AND user_id = ${userId}
    `;

    if (existing.length === 0) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });
    }

    // Toggle is_active
    const newStatus = !existing[0].is_active;
    
    await sql`
      UPDATE email_workflows
      SET is_active = ${newStatus},
          updated_at = NOW()
      WHERE id = ${workflowId}
    `;

    return NextResponse.json({ 
      message: 'Workflow status updated',
      is_active: newStatus
    }, { status: 200 });
  } catch (error: any) {
    console.error('Error toggling workflow:', error);
    return NextResponse.json({ error: 'Failed to toggle workflow' }, { status: 500 });
  }
}
