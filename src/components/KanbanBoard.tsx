'use client';

import React, { useState, useEffect } from 'react';
import {
  PlusIcon,
  XMarkIcon,
  EllipsisHorizontalIcon,
  CalendarIcon,
  CheckIcon,
  TrashIcon,
  ArrowPathIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';

type TaskStatus = 'Open' | 'In progress' | 'Done';
type TaskPriority = 'Low' | 'Medium' | 'High';

type Task = {
  id: string;
  clientId: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string;
  description?: string;
};

type Client = {
  id: string;
  name: string;
  company?: string;
};

interface KanbanBoardProps {
  tasks: Task[];
  clients: Client[];
  onTaskUpdate?: (taskId: string, updates: Partial<Task>) => void;
  onTaskDelete?: (taskId: string) => void;
  onTaskCreate?: (task: Partial<Task>) => void;
  onClientSelect?: (clientId: string) => void;
}

export default function KanbanBoard({
  tasks,
  clients,
  onTaskUpdate,
  onTaskDelete,
  onTaskCreate,
  onClientSelect,
}: KanbanBoardProps) {
  const [draggedTask, setDraggedTask] = useState<string | null>(null);
  const [draggedFrom, setDraggedFrom] = useState<TaskStatus | null>(null);
  const [showAddTask, setShowAddTask] = useState<TaskStatus | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [taskMenuOpen, setTaskMenuOpen] = useState<string | null>(null);

  const statuses: TaskStatus[] = ['Open', 'In progress', 'Done'];

  // Group tasks by status
  const tasksByStatus = {
    Open: tasks.filter(t => t.status === 'Open'),
    'In progress': tasks.filter(t => t.status === 'In progress'),
    Done: tasks.filter(t => t.status === 'Done'),
  };

  const handleDragStart = (e: React.DragEvent, taskId: string, status: TaskStatus) => {
    setDraggedTask(taskId);
    setDraggedFrom(status);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, newStatus: TaskStatus) => {
    e.preventDefault();
    if (!draggedTask || !draggedFrom) return;

    const task = tasks.find(t => t.id === draggedTask);
    if (task && task.status !== newStatus) {
      onTaskUpdate?.(draggedTask, { status: newStatus });
    }

    setDraggedTask(null);
    setDraggedFrom(null);
  };

  const handleAddTask = (status: TaskStatus) => {
    if (!newTaskTitle.trim()) return;

    const newTask: Partial<Task> = {
      title: newTaskTitle,
      status,
      priority: 'Medium',
      clientId: selectedClientId,
    };

    onTaskCreate?.(newTask);
    setNewTaskTitle('');
    setSelectedClientId('');
    setShowAddTask(null);
  };

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case 'Done':
        return {
          bg: 'bg-green-50 dark:bg-green-950/30',
          header: 'bg-green-100 dark:bg-green-900/40',
          text: 'text-green-700 dark:text-green-300',
          badge: 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300',
        };
      case 'In progress':
        return {
          bg: 'bg-blue-50 dark:bg-blue-950/30',
          header: 'bg-blue-100 dark:bg-blue-900/40',
          text: 'text-blue-700 dark:text-blue-300',
          badge: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300',
        };
      default:
        return {
          bg: 'bg-slate-50 dark:bg-slate-950/30',
          header: 'bg-slate-100 dark:bg-slate-900/40',
          text: 'text-slate-700 dark:text-slate-300',
          badge: 'bg-slate-100 text-slate-700 dark:bg-slate-500/20 dark:text-slate-300',
        };
    }
  };

  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case 'High':
        return 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-300';
      default:
        return 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300';
    }
  };

  const getClientName = (clientId: string) => {
    return clients.find(c => c.id === clientId)?.name || 'Unknown Client';
  };

  const isOverdue = (dueDate?: string) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const stats = {
    total: tasks.length,
    open: tasksByStatus.Open.length,
    inProgress: tasksByStatus['In progress'].length,
    done: tasksByStatus.Done.length,
    overdue: tasks.filter(t => isOverdue(t.dueDate) && t.status !== 'Done').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-100">
            Kanban Board
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Drag and drop tasks to organize your workflow
          </p>
        </div>

        {/* Stats */}
        <div className="flex flex-wrap gap-3">
          <div className="rounded-2xl bg-white/70 px-4 py-2 shadow-lg shadow-slate-900/5 dark:bg-slate-900/70 dark:shadow-slate-950/20">
            <p className="text-xs text-slate-500 dark:text-slate-400">Total</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stats.total}</p>
          </div>
          <div className="rounded-2xl bg-blue-50 px-4 py-2 shadow-lg shadow-slate-900/5 dark:bg-blue-950/30 dark:shadow-slate-950/20">
            <p className="text-xs text-blue-600 dark:text-blue-300">In Progress</p>
            <p className="text-2xl font-bold text-blue-700 dark:text-blue-200">{stats.inProgress}</p>
          </div>
          <div className="rounded-2xl bg-green-50 px-4 py-2 shadow-lg shadow-slate-900/5 dark:bg-green-950/30 dark:shadow-slate-950/20">
            <p className="text-xs text-green-600 dark:text-green-300">Done</p>
            <p className="text-2xl font-bold text-green-700 dark:text-green-200">{stats.done}</p>
          </div>
          {stats.overdue > 0 && (
            <div className="rounded-2xl bg-red-50 px-4 py-2 shadow-lg shadow-slate-900/5 dark:bg-red-950/30 dark:shadow-slate-950/20">
              <p className="text-xs text-red-600 dark:text-red-300">Overdue</p>
              <p className="text-2xl font-bold text-red-700 dark:text-red-200">{stats.overdue}</p>
            </div>
          )}
        </div>
      </div>

      {/* Kanban Columns */}
      <div className="grid gap-6 lg:grid-cols-3">
        {statuses.map((status) => {
          const color = getStatusColor(status);
          const columnTasks = tasksByStatus[status];

          return (
            <div
              key={status}
              className={`rounded-3xl border border-white/60 p-6 shadow-lg shadow-slate-900/5 backdrop-blur-md dark:border-slate-800/60 dark:shadow-slate-950/20 ${color.bg}`}
            >
              {/* Column Header */}
              <div className={`-m-6 mb-6 rounded-t-3xl px-6 py-4 ${color.header}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <h2 className={`font-semibold ${color.text}`}>{status}</h2>
                    <span className={`rounded-full px-3 py-1 text-sm font-bold ${color.badge}`}>
                      {columnTasks.length}
                    </span>
                  </div>
                  <button
                    onClick={() => setShowAddTask(status)}
                    className={`rounded-lg p-1 transition-colors hover:bg-white/20 dark:hover:bg-slate-700/30 ${color.text}`}
                    title="Add task"
                  >
                    <PlusIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Drop Zone */}
              <div
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, status)}
                className="min-h-[600px] space-y-4 rounded-2xl transition-colors"
              >
                {columnTasks.length === 0 ? (
                  <div className="flex h-96 items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700">
                    <p className="text-center text-sm text-slate-500 dark:text-slate-400">
                      No tasks yet
                      <br />
                      Drag tasks here or add new ones
                    </p>
                  </div>
                ) : (
                  columnTasks.map((task) => (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, task.id, status)}
                      onClick={() => setExpandedTaskId(expandedTaskId === task.id ? null : task.id)}
                      className={`group cursor-grab rounded-2xl border border-white/60 bg-white/80 p-4 shadow-md shadow-slate-900/10 transition-all active:cursor-grabbing dark:border-slate-700/60 dark:bg-slate-900/80 dark:shadow-slate-950/20 hover:shadow-lg hover:shadow-slate-900/20 dark:hover:shadow-slate-950/40 ${
                        expandedTaskId === task.id ? 'ring-2 ring-blue-400 dark:ring-blue-500' : ''
                      }`}
                    >
                      {/* Task Content */}
                      <div className="space-y-2">
                        {/* Title */}
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="flex-1 font-semibold text-slate-900 dark:text-slate-100">
                            {task.title}
                          </h3>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setTaskMenuOpen(taskMenuOpen === task.id ? null : task.id);
                            }}
                            className="rounded-lg p-1 opacity-0 transition-opacity hover:bg-slate-200 dark:hover:bg-slate-700 group-hover:opacity-100"
                          >
                            <EllipsisHorizontalIcon className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                          </button>

                          {/* Task Menu */}
                          {taskMenuOpen === task.id && (
                            <div className="absolute right-4 top-16 rounded-2xl border border-white/60 bg-white/95 shadow-2xl backdrop-blur-md dark:border-slate-800/60 dark:bg-slate-900/95 z-50">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onTaskDelete?.(task.id);
                                  setTaskMenuOpen(null);
                                }}
                                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
                              >
                                <TrashIcon className="h-4 w-4" />
                                Delete
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Client */}
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            onClientSelect?.(task.clientId);
                          }}
                          className="cursor-pointer text-xs font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 flex items-center gap-1"
                        >
                          <UserGroupIcon className="h-3 w-3" />
                          {getClientName(task.clientId)}
                        </div>

                        {/* Priority & Status Badges */}
                        <div className="flex flex-wrap gap-2">
                          <span
                            className={`inline-block rounded-full px-2 py-1 text-xs font-semibold ${getPriorityColor(task.priority)}`}
                          >
                            {task.priority}
                          </span>
                        </div>

                        {/* Due Date */}
                        {task.dueDate && (
                          <div className="flex items-center gap-2">
                            <CalendarIcon className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                            <span
                              className={`text-xs font-medium ${
                                isOverdue(task.dueDate)
                                  ? 'text-red-600 dark:text-red-400'
                                  : 'text-slate-600 dark:text-slate-400'
                              }`}
                            >
                              {isOverdue(task.dueDate) && '⚠️ Overdue: '}
                              {formatDate(task.dueDate)}
                            </span>
                          </div>
                        )}

                        {/* Description (Expanded) */}
                        {expandedTaskId === task.id && task.description && (
                          <div className="mt-3 rounded-lg bg-slate-100 p-3 dark:bg-slate-800">
                            <p className="text-sm text-slate-700 dark:text-slate-300">
                              {task.description}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Bottom Actions */}
                      {expandedTaskId === task.id && (
                        <div className="mt-4 flex gap-2 border-t border-slate-200 pt-3 dark:border-slate-700">
                          {task.status !== 'Done' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onTaskUpdate?.(task.id, { status: 'Done' });
                              }}
                              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-green-500 py-2 text-sm font-medium text-white hover:bg-green-600 transition-colors"
                            >
                              <CheckIcon className="h-4 w-4" />
                              Complete
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setTaskMenuOpen(taskMenuOpen === task.id ? null : task.id);
                            }}
                            className="flex-1 rounded-lg bg-slate-200 py-2 text-sm font-medium text-slate-700 hover:bg-slate-300 transition-colors dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
                          >
                            More
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                )}

                {/* Add Task Form */}
                {showAddTask === status && (
                  <div className="space-y-3 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-4 dark:border-slate-600 dark:bg-slate-900/50">
                    <input
                      type="text"
                      placeholder="Task title..."
                      value={newTaskTitle}
                      onChange={(e) => setNewTaskTitle(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleAddTask(status);
                        }
                      }}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200/60 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:ring-blue-400/30"
                      autoFocus
                    />
                    <select
                      value={selectedClientId}
                      onChange={(e) => setSelectedClientId(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200/60 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:focus:ring-blue-400/30"
                    >
                      <option value="">Select a client...</option>
                      {clients.map((client) => (
                        <option key={client.id} value={client.id}>
                          {client.name}
                        </option>
                      ))}
                    </select>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAddTask(status)}
                        className="flex-1 rounded-lg bg-blue-600 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors dark:bg-blue-500 dark:hover:bg-blue-600"
                      >
                        Add Task
                      </button>
                      <button
                        onClick={() => setShowAddTask(null)}
                        className="rounded-lg bg-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-300 transition-colors dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
