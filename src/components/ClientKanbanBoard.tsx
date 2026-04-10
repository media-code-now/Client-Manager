'use client';

import { TrashIcon, XMarkIcon, PlusIcon, ChevronDownIcon, Bars2Icon } from '@heroicons/react/24/outline';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import type { FC } from 'react';
import { useState } from 'react';

type TaskStatus = 'Open' | 'In progress' | 'Done';
type TaskPriority = 'Low' | 'Medium' | 'High';

interface Task {
  id: string;
  clientId: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string;
  description?: string;
}

interface Client {
  id: string;
  name: string;
  company?: string;
}

interface ClientKanbanBoardProps {
  clientId: string;
  clientName: string;
  tasks: Task[];
  onTaskUpdate: (taskId: string, updates: Partial<Task>) => void;
  onTaskDelete: (taskId: string) => void;
  onTaskCreate: (task: Partial<Task>) => void;
  onBack: () => void;
}

const ClientKanbanBoard: FC<ClientKanbanBoardProps> = ({
  clientId,
  clientName,
  tasks,
  onTaskUpdate,
  onTaskDelete,
  onTaskCreate,
  onBack,
}) => {
  const [draggedTask, setDraggedTask] = useState<string | null>(null);
  const [draggedFrom, setDraggedFrom] = useState<TaskStatus | null>(null);
  const [expandedTask, setExpandedTask] = useState<string | null>(null);
  const [activeAddColumn, setActiveAddColumn] = useState<TaskStatus | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState<string>('');
  const [newTaskDescription, setNewTaskDescription] = useState<string>('');
  const [newTaskPriority, setNewTaskPriority] = useState<TaskPriority>('Medium');
  const [newTaskDueDate, setNewTaskDueDate] = useState<string>('');

  // Filter tasks for this client
  const clientTasks = tasks.filter(task => task.clientId === clientId);

  // Group tasks by status
  const tasksByStatus = {
    Open: clientTasks.filter(t => t.status === 'Open'),
    'In progress': clientTasks.filter(t => t.status === 'In progress'),
    Done: clientTasks.filter(t => t.status === 'Done'),
  };

  // Calculate statistics
  const stats = {
    total: clientTasks.length,
    inProgress: tasksByStatus['In progress'].length,
    done: tasksByStatus.Done.length,
    overdue: clientTasks.filter(t => {
      if (!t.dueDate || t.status === 'Done') return false;
      return new Date(t.dueDate) < new Date();
    }).length,
  };

  const handleDragStart = (taskId: string, status: TaskStatus) => {
    setDraggedTask(taskId);
    setDraggedFrom(status);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (newStatus: TaskStatus) => {
    if (draggedTask && draggedFrom !== newStatus) {
      onTaskUpdate(draggedTask, { status: newStatus });
    }
    setDraggedTask(null);
    setDraggedFrom(null);
  };

  const handleAddTask = (status: TaskStatus) => {
    if (newTaskTitle.trim()) {
      onTaskCreate({
        title: newTaskTitle,
        status,
        priority: newTaskPriority,
        dueDate: newTaskDueDate,
        description: newTaskDescription,
        clientId,
      });
      setNewTaskTitle('');
      setNewTaskDescription('');
      setNewTaskPriority('Medium');
      setNewTaskDueDate('');
      setActiveAddColumn(null);
    }
  };

  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case 'High':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'Low':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      default:
        return 'bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-300';
    }
  };

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case 'Open':
        return 'bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-700';
      case 'In progress':
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700';
      case 'Done':
        return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700';
      default:
        return '';
    }
  };

  const renderColumn = (status: TaskStatus, columnTasks: Task[]) => {
    const columnColors = {
      Open: 'text-slate-700 dark:text-slate-300',
      'In progress': 'text-blue-700 dark:text-blue-300',
      Done: 'text-green-700 dark:text-green-300',
    };

    return (
      <div
        key={status}
        onDragOver={handleDragOver}
        onDrop={() => handleDrop(status)}
        className={`flex flex-col rounded-2xl border-2 p-4 min-h-96 ${getStatusColor(status)} transition-all`}
      >
        {/* Column Header */}
        <div className="mb-4 flex items-center justify-between">
          <h3 className={`text-lg font-semibold ${columnColors[status]}`}>
            {status}
          </h3>
          <span className="rounded-full bg-slate-200 px-3 py-1 text-sm font-medium text-slate-700 dark:bg-slate-700 dark:text-slate-200">
            {columnTasks.length}
          </span>
        </div>

        {/* Tasks */}
        <div className="flex flex-1 flex-col gap-3">
          {columnTasks.map(task => (
            <div
              key={task.id}
              draggable
              onDragStart={() => handleDragStart(task.id, status)}
              className="group relative cursor-move rounded-xl border-2 border-slate-200 bg-white p-4 shadow-md transition-all hover:shadow-lg dark:border-slate-600 dark:bg-slate-800"
            >
              {/* Task Title */}
              <div className="mb-2 flex items-start justify-between gap-2">
                <button
                  onClick={() =>
                    setExpandedTask(expandedTask === task.id ? null : task.id)
                  }
                  className="flex-1 text-left"
                >
                  <h4 className="font-medium text-slate-900 dark:text-slate-100 hover:underline">
                    {task.title}
                  </h4>
                </button>

                {/* Delete Button */}
                <button
                  onClick={() => onTaskDelete(task.id)}
                  className="rounded-lg p-1 text-slate-400 transition-all hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>

              {/* Priority Badge */}
              <div className="mb-3 inline-block">
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getPriorityColor(task.priority)}`}>
                  {task.priority}
                </span>
              </div>

              {/* Due Date */}
              {task.dueDate && (
                <div className="mb-3 text-xs text-slate-500 dark:text-slate-400">
                  Due: {new Date(task.dueDate).toLocaleDateString()}
                  {new Date(task.dueDate) < new Date() && task.status !== 'Done' && (
                    <span className="ml-2 font-semibold text-red-600 dark:text-red-400">
                      OVERDUE
                    </span>
                  )}
                </div>
              )}

              {/* Description (Expandable) */}
              {expandedTask === task.id && task.description && (
                <div className="mb-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-700 dark:bg-slate-700/50 dark:text-slate-300">
                  {task.description}
                </div>
              )}

              {/* Expand Button */}
              {task.description && (
                <button
                  onClick={() =>
                    setExpandedTask(expandedTask === task.id ? null : task.id)
                  }
                  className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                >
                  <ChevronDownIcon
                    className={`h-4 w-4 transition-transform ${
                      expandedTask === task.id ? 'rotate-180' : ''
                    }`}
                  />
                  Details
                </button>
              )}

              {/* Complete Button */}
              {status !== 'Done' && (
                <button
                  onClick={() => onTaskUpdate(task.id, { status: 'Done' })}
                  className="mt-3 flex items-center gap-2 rounded-lg bg-green-100 px-3 py-2 text-xs font-medium text-green-700 transition-all hover:bg-green-200 dark:bg-green-900/30 dark:text-green-300 dark:hover:bg-green-900/50"
                >
                  <CheckCircleIcon className="h-4 w-4" />
                  Complete
                </button>
              )}
            </div>
          ))}

          {/* Empty State */}
          {columnTasks.length === 0 && (
            <div className="flex flex-1 items-center justify-center rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                No tasks
              </p>
            </div>
          )}
        </div>

        {/* Add Task Button */}
        <button
          onClick={() => setActiveAddColumn(activeAddColumn === status ? null : status)}
          className="mt-4 flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 transition-all hover:bg-slate-200 dark:bg-slate-700/50 dark:text-slate-300 dark:hover:bg-slate-700"
        >
          <PlusIcon className="h-4 w-4" />
          Add Task
        </button>

        {/* Add Task Form */}
        {activeAddColumn === status && (
          <div className="mt-4 space-y-3 rounded-xl bg-white p-4 shadow-lg dark:bg-slate-900">
            <input
              type="text"
              placeholder="Task title..."
              value={newTaskTitle}
              onChange={e => setNewTaskTitle(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500"
            />

            <textarea
              placeholder="Description (optional)..."
              value={newTaskDescription}
              onChange={e => setNewTaskDescription(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500"
            />

            <div className="grid grid-cols-2 gap-3">
              <select
                value={newTaskPriority}
                onChange={e => setNewTaskPriority(e.target.value as TaskPriority)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
              >
                <option value="Low">Low Priority</option>
                <option value="Medium">Medium Priority</option>
                <option value="High">High Priority</option>
              </select>

              <input
                type="date"
                value={newTaskDueDate}
                onChange={e => setNewTaskDueDate(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => handleAddTask(status)}
                className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
              >
                Add Task
              </button>
              <button
                onClick={() => setActiveAddColumn(null)}
                className="rounded-lg bg-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition-all hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-100">
            📊 {clientName} Kanban Board
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Track all tasks and projects for this client
          </p>
        </div>
        <button
          onClick={onBack}
          className="rounded-2xl bg-slate-600 px-6 py-3 text-sm font-medium text-white shadow-lg shadow-slate-600/25 transition-all hover:bg-slate-700 hover:shadow-slate-600/40 dark:bg-slate-500 dark:hover:bg-slate-600"
        >
          ← Back to Client
        </button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded-2xl bg-white/70 p-6 shadow-lg shadow-slate-900/5 backdrop-blur-md dark:bg-slate-900/60 border border-white/60 dark:border-slate-800/60">
          <div className="text-3xl font-bold text-slate-900 dark:text-slate-100">
            {stats.total}
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400">Total Tasks</p>
        </div>

        <div className="rounded-2xl bg-blue-100/50 p-6 shadow-lg shadow-blue-900/5 backdrop-blur-md dark:bg-blue-900/20 border border-blue-200/60 dark:border-blue-800/60">
          <div className="text-3xl font-bold text-blue-900 dark:text-blue-300">
            {stats.inProgress}
          </div>
          <p className="text-sm text-blue-700 dark:text-blue-400">In Progress</p>
        </div>

        <div className="rounded-2xl bg-green-100/50 p-6 shadow-lg shadow-green-900/5 backdrop-blur-md dark:bg-green-900/20 border border-green-200/60 dark:border-green-800/60">
          <div className="text-3xl font-bold text-green-900 dark:text-green-300">
            {stats.done}
          </div>
          <p className="text-sm text-green-700 dark:text-green-400">Completed</p>
        </div>

        {stats.overdue > 0 && (
          <div className="rounded-2xl bg-red-100/50 p-6 shadow-lg shadow-red-900/5 backdrop-blur-md dark:bg-red-900/20 border border-red-200/60 dark:border-red-800/60">
            <div className="text-3xl font-bold text-red-900 dark:text-red-300">
              {stats.overdue}
            </div>
            <p className="text-sm text-red-700 dark:text-red-400">Overdue</p>
          </div>
        )}
      </div>

      {/* Kanban Board */}
      <div className="grid auto-cols-fr gap-6 md:grid-cols-3">
        {renderColumn('Open', tasksByStatus.Open)}
        {renderColumn('In progress', tasksByStatus['In progress'])}
        {renderColumn('Done', tasksByStatus.Done)}
      </div>
    </div>
  );
};

export default ClientKanbanBoard;
