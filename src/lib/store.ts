import { Task, Bid } from "@/types/task";
import initialTasks from "@/data/tasks.json";

// In-memory store (resets on cold start - MVP only)
// TODO: Replace with Vercel KV or Postgres for persistence
let tasks: Task[] = [...initialTasks] as Task[];

export function getAllTasks(): Task[] {
  return tasks.filter(t => t.status !== 'cancelled');
}

export function getTaskById(id: string): Task | undefined {
  return tasks.find(t => t.id === id);
}

export function createTask(data: Omit<Task, 'id' | 'createdAt' | 'bids' | 'status'>): Task {
  const task: Task = {
    ...data,
    id: `task-${Date.now()}`,
    status: 'open',
    createdAt: new Date().toISOString(),
    bids: [],
  };
  tasks.push(task);
  return task;
}

export function addBid(taskId: string, data: Omit<Bid, 'id' | 'taskId' | 'createdAt' | 'status'>): Bid | null {
  const task = tasks.find(t => t.id === taskId);
  if (!task || task.status !== 'open') return null;

  const bid: Bid = {
    ...data,
    id: `bid-${Date.now()}`,
    taskId,
    createdAt: new Date().toISOString(),
    status: 'pending',
  };
  task.bids.push(bid);
  return bid;
}

export function updateTaskStatus(taskId: string, status: Task['status']): Task | null {
  const task = tasks.find(t => t.id === taskId);
  if (!task) return null;
  task.status = status;
  return task;
}

export function acceptBid(taskId: string, bidId: string): Task | null {
  const task = tasks.find(t => t.id === taskId);
  if (!task) return null;
  
  const bid = task.bids.find(b => b.id === bidId);
  if (!bid) return null;
  
  // Accept this bid, reject others
  task.bids.forEach(b => {
    b.status = b.id === bidId ? 'accepted' : 'rejected';
  });
  task.acceptedBid = bidId;
  task.status = 'in_progress';
  
  return task;
}
