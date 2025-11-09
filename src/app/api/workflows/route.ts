import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import jwt from 'jsonwebtoken';

// Force dynamic rendering (don't prerender at build time)
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';


const sql = neon(process.env.DATABASE_URL!);

export async function GET(request: NextRequest) {
  try {
    // Get JWT token from headers
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    const userId = decoded.userId;

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const isActive = searchParams.get('is_active');
    const triggerType = searchParams.get('trigger_type');

    // Fetch workflows with nested data
    let workflows;
    
    if (triggerType) {
      workflows = await sql`
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
        WHERE w.user_id = ${userId}
        AND EXISTS (
          SELECT 1 FROM workflow_triggers t
          WHERE t.workflow_id = w.id
          AND t.trigger_type = ${triggerType}
        )
        ${isActive !== null ? sql`AND w.is_active = ${isActive === 'true'}` : sql``}
        ORDER BY w.created_at DESC
      `;
    } else {
      workflows = await sql`
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
        WHERE w.user_id = ${userId}
        ${isActive !== null ? sql`AND w.is_active = ${isActive === 'true'}` : sql``}
        ORDER BY w.created_at DESC
      `;
    }

    return NextResponse.json({ workflows }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching workflows:', error);
    return NextResponse.json({ error: 'Failed to fetch workflows' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get JWT token from headers
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    const userId = decoded.userId;

    const body = await request.json();
    const { name, description, triggers, conditions = [], actions, is_active = true } = body;

    // Validation
    if (!name || !triggers || triggers.length === 0 || !actions || actions.length === 0) {
      return NextResponse.json(
        { error: 'Name, at least one trigger, and at least one action are required' },
        { status: 400 }
      );
    }

    // Create workflow
    const workflow = await sql`
      INSERT INTO email_workflows (user_id, name, description, is_active)
      VALUES (${userId}, ${name}, ${description || null}, ${is_active})
      RETURNING id
    `;

    const workflowId = workflow[0].id;

    // Create triggers
    for (const trigger of triggers) {
      await sql`
        INSERT INTO workflow_triggers (workflow_id, trigger_type, trigger_config)
        VALUES (${workflowId}, ${trigger.trigger_type}, ${JSON.stringify(trigger.trigger_config || {})}::jsonb)
      `;
    }

    // Create conditions
    for (const condition of conditions) {
      await sql`
        INSERT INTO workflow_conditions (workflow_id, condition_type, operator, value)
        VALUES (${workflowId}, ${condition.condition_type}, ${condition.operator}, ${condition.value})
      `;
    }

    // Create actions
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

    // Fetch complete workflow
    const completeWorkflow = await sql`
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

    return NextResponse.json({ workflow: completeWorkflow[0] }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating workflow:', error);
    return NextResponse.json({ error: 'Failed to create workflow' }, { status: 500 });
  }
}
