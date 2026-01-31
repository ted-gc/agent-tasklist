import { Task, Bid } from "@/types/task";
import * as db from "./db";

// Check if database is configured
const useDatabase = () => !!process.env.DATABASE_URL;

// ============================================
// In-memory fallback (for local dev without DB)
// ============================================
let memoryTasks: Task[] = [];
let memoryInitialized = false;

async function initMemoryStore() {
  if (memoryInitialized) return;
  // Dynamically import sample data for local dev
  try {
    const initialTasks = (await import("@/data/tasks.json")).default;
    memoryTasks = [...initialTasks] as Task[];
  } catch {
    memoryTasks = [];
  }
  memoryInitialized = true;
}

// ============================================
// Exported functions (route to DB or memory)
// ============================================

export async function getAllTasks(): Promise<Task[]> {
  if (useDatabase()) {
    return db.getAllTasks();
  }
  await initMemoryStore();
  return memoryTasks.filter(t => t.status !== 'cancelled');
}

export async function getTaskById(id: string): Promise<Task | null> {
  if (useDatabase()) {
    return db.getTaskById(id);
  }
  await initMemoryStore();
  return memoryTasks.find(t => t.id === id) || null;
}

export async function createTask(
  data: Omit<Task, 'id' | 'createdAt' | 'bids' | 'status'>
): Promise<Task> {
  if (useDatabase()) {
    return db.createTask(data);
  }
  await initMemoryStore();
  const task: Task = {
    ...data,
    id: `task-${Date.now()}`,
    status: 'open',
    createdAt: new Date().toISOString(),
    bids: [],
  };
  memoryTasks.push(task);
  return task;
}

export async function addBid(
  taskId: string, 
  data: Omit<Bid, 'id' | 'taskId' | 'createdAt' | 'status'>
): Promise<Bid | null> {
  if (useDatabase()) {
    return db.addBid(taskId, data);
  }
  await initMemoryStore();
  const task = memoryTasks.find(t => t.id === taskId);
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

export async function updateTaskStatus(
  taskId: string, 
  status: Task['status']
): Promise<Task | null> {
  if (useDatabase()) {
    return db.updateTaskStatus(taskId, status);
  }
  await initMemoryStore();
  const task = memoryTasks.find(t => t.id === taskId);
  if (!task) return null;
  task.status = status;
  return task;
}

export async function acceptBid(taskId: string, bidId: string): Promise<Task | null> {
  if (useDatabase()) {
    return db.acceptBid(taskId, bidId);
  }
  await initMemoryStore();
  const task = memoryTasks.find(t => t.id === taskId);
  if (!task) return null;
  
  const bid = task.bids.find(b => b.id === bidId);
  if (!bid) return null;
  
  task.bids.forEach(b => {
    b.status = b.id === bidId ? 'accepted' : 'rejected';
  });
  task.acceptedBid = bidId;
  task.status = 'in_progress';
  
  return task;
}

// Database initialization (call once on first request or via setup endpoint)
export async function initializeDatabase() {
  if (!useDatabase()) {
    return { success: false, error: 'DATABASE_URL not configured' };
  }
  return db.initializeDatabase();
}
