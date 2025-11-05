import express, { Response } from 'express';
import { authMiddleware, AuthenticatedRequest } from '../middleware/authMiddleware';

const router = express.Router();

// Apply authentication middleware to all routes in this router
router.use(authMiddleware);

/**
 * GET /tasks
 * Get all tasks for the authenticated user
 */
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { status, priority, clientId } = req.query;
    
    // Mock task data - replace with actual database query
    let tasks = [
      {
        id: 1,
        title: 'Review project proposal',
        description: 'Review and provide feedback on the Q4 project proposal',
        status: 'pending',
        priority: 'high',
        dueDate: new Date('2024-12-15'),
        clientId: 1,
        userId: userId,
        createdAt: new Date('2024-11-01'),
        updatedAt: new Date('2024-11-01')
      },
      {
        id: 2,
        title: 'Client meeting preparation',
        description: 'Prepare presentation materials for client meeting',
        status: 'in-progress',
        priority: 'medium',
        dueDate: new Date('2024-11-10'),
        clientId: 2,
        userId: userId,
        createdAt: new Date('2024-11-02'),
        updatedAt: new Date('2024-11-04')
      },
      {
        id: 3,
        title: 'Update website content',
        description: 'Update the about page with new team member information',
        status: 'completed',
        priority: 'low',
        dueDate: new Date('2024-11-05'),
        clientId: 1,
        userId: userId,
        createdAt: new Date('2024-10-28'),
        updatedAt: new Date('2024-11-03')
      }
    ];

    // Apply filters if provided
    if (status) {
      tasks = tasks.filter(task => task.status === status);
    }
    if (priority) {
      tasks = tasks.filter(task => task.priority === priority);
    }
    if (clientId) {
      tasks = tasks.filter(task => task.clientId === parseInt(clientId as string));
    }

    res.json({
      success: true,
      data: tasks,
      message: 'Tasks retrieved successfully',
      filters: { status, priority, clientId }
    });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve tasks'
    });
  }
});

/**
 * POST /tasks
 * Create a new task for the authenticated user
 */
router.post('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { title, description, status, priority, dueDate, clientId } = req.body;

    // Validation
    if (!title) {
      res.status(400).json({
        success: false,
        error: 'Title is required'
      });
      return;
    }

    // Validate status
    const validStatuses = ['pending', 'in-progress', 'completed', 'cancelled'];
    if (status && !validStatuses.includes(status)) {
      res.status(400).json({
        success: false,
        error: 'Invalid status. Must be one of: ' + validStatuses.join(', ')
      });
      return;
    }

    // Validate priority
    const validPriorities = ['low', 'medium', 'high', 'urgent'];
    if (priority && !validPriorities.includes(priority)) {
      res.status(400).json({
        success: false,
        error: 'Invalid priority. Must be one of: ' + validPriorities.join(', ')
      });
      return;
    }

    // Mock task creation - replace with actual database insert
    const newTask = {
      id: Math.floor(Math.random() * 1000) + 100, // Mock ID
      title,
      description: description || null,
      status: status || 'pending',
      priority: priority || 'medium',
      dueDate: dueDate ? new Date(dueDate) : null,
      clientId: clientId || null,
      userId: userId,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    res.status(201).json({
      success: true,
      data: newTask,
      message: 'Task created successfully'
    });
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create task'
    });
  }
});

/**
 * GET /tasks/:id
 * Get a specific task by ID (must belong to authenticated user)
 */
router.get('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const taskId = parseInt(req.params.id);

    if (isNaN(taskId)) {
      res.status(400).json({
        success: false,
        error: 'Invalid task ID'
      });
      return;
    }

    // Mock task lookup - replace with actual database query
    const task = {
      id: taskId,
      title: 'Sample Task',
      description: 'This is a sample task description',
      status: 'pending',
      priority: 'medium',
      dueDate: new Date('2024-12-01'),
      clientId: 1,
      userId: userId,
      createdAt: new Date('2024-11-01'),
      updatedAt: new Date('2024-11-01')
    };

    res.json({
      success: true,
      data: task,
      message: 'Task retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching task:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve task'
    });
  }
});

/**
 * PUT /tasks/:id
 * Update a specific task (must belong to authenticated user)
 */
router.put('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const taskId = parseInt(req.params.id);
    const { title, description, status, priority, dueDate, clientId } = req.body;

    if (isNaN(taskId)) {
      res.status(400).json({
        success: false,
        error: 'Invalid task ID'
      });
      return;
    }

    // Mock task update - replace with actual database update
    const updatedTask = {
      id: taskId,
      title: title || 'Updated Task',
      description: description || 'Updated description',
      status: status || 'pending',
      priority: priority || 'medium',
      dueDate: dueDate ? new Date(dueDate) : null,
      clientId: clientId || null,
      userId: userId,
      createdAt: new Date('2024-11-01'),
      updatedAt: new Date()
    };

    res.json({
      success: true,
      data: updatedTask,
      message: 'Task updated successfully'
    });
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update task'
    });
  }
});

/**
 * DELETE /tasks/:id
 * Delete a specific task (must belong to authenticated user)
 */
router.delete('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const taskId = parseInt(req.params.id);

    if (isNaN(taskId)) {
      res.status(400).json({
        success: false,
        error: 'Invalid task ID'
      });
      return;
    }

    // Mock task deletion - replace with actual database delete
    // In real implementation, ensure task belongs to authenticated user

    res.json({
      success: true,
      message: 'Task deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete task'
    });
  }
});

export default router;