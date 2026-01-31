import { neon } from '@neondatabase/serverless';
import { Task, Bid } from '@/types/task';

// Get database connection
function getDb() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set');
  }
  return neon(connectionString);
}

// Initialize database schema
export async function initializeDatabase() {
  const sql = getDb();
  
  await sql`
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      acceptance_criteria JSONB NOT NULL DEFAULT '[]',
      bounty_amount TEXT NOT NULL,
      bounty_currency TEXT NOT NULL DEFAULT 'ETH',
      poster_name TEXT NOT NULL,
      poster_moltbook TEXT,
      poster_wallet TEXT,
      status TEXT NOT NULL DEFAULT 'open',
      deadline TEXT,
      accepted_bid TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS bids (
      id TEXT PRIMARY KEY,
      task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
      bidder_name TEXT NOT NULL,
      bidder_moltbook TEXT,
      bidder_wallet TEXT,
      amount TEXT NOT NULL,
      currency TEXT NOT NULL DEFAULT 'ETH',
      pitch TEXT NOT NULL,
      estimated_delivery TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `;

  await sql`CREATE INDEX IF NOT EXISTS idx_bids_task_id ON bids(task_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status)`;

  return { success: true };
}

// Convert DB row to Task object
function rowToTask(row: Record<string, unknown>, bids: Bid[] = []): Task {
  return {
    id: row.id as string,
    title: row.title as string,
    description: row.description as string,
    acceptanceCriteria: row.acceptance_criteria as string[],
    bounty: {
      amount: row.bounty_amount as string,
      currency: row.bounty_currency as string,
    },
    poster: {
      name: row.poster_name as string,
      moltbook: row.poster_moltbook as string | undefined,
      wallet: row.poster_wallet as string | undefined,
    },
    status: row.status as Task['status'],
    deadline: row.deadline as string | undefined,
    createdAt: (row.created_at as Date).toISOString(),
    bids,
    acceptedBid: row.accepted_bid as string | undefined,
  };
}

// Convert DB row to Bid object
function rowToBid(row: Record<string, unknown>): Bid {
  return {
    id: row.id as string,
    taskId: row.task_id as string,
    bidder: {
      name: row.bidder_name as string,
      moltbook: row.bidder_moltbook as string | undefined,
      wallet: row.bidder_wallet as string | undefined,
    },
    amount: row.amount as string,
    currency: row.currency as string,
    pitch: row.pitch as string,
    estimatedDelivery: row.estimated_delivery as string,
    createdAt: (row.created_at as Date).toISOString(),
    status: row.status as Bid['status'],
  };
}

// Get all tasks (excluding cancelled)
export async function getAllTasks(): Promise<Task[]> {
  const sql = getDb();
  
  const taskRows = await sql`
    SELECT * FROM tasks 
    WHERE status != 'cancelled' 
    ORDER BY created_at DESC
  `;

  if (taskRows.length === 0) return [];

  const taskIds = taskRows.map(t => t.id);
  const bidRows = await sql`
    SELECT * FROM bids 
    WHERE task_id = ANY(${taskIds})
    ORDER BY created_at ASC
  `;

  // Group bids by task
  const bidsByTask = new Map<string, Bid[]>();
  for (const row of bidRows) {
    const taskId = row.task_id as string;
    if (!bidsByTask.has(taskId)) {
      bidsByTask.set(taskId, []);
    }
    bidsByTask.get(taskId)!.push(rowToBid(row));
  }

  return taskRows.map(row => rowToTask(row, bidsByTask.get(row.id as string) || []));
}

// Get single task by ID
export async function getTaskById(id: string): Promise<Task | null> {
  const sql = getDb();
  
  const taskRows = await sql`SELECT * FROM tasks WHERE id = ${id}`;
  if (taskRows.length === 0) return null;

  const bidRows = await sql`
    SELECT * FROM bids 
    WHERE task_id = ${id} 
    ORDER BY created_at ASC
  `;

  const bids = bidRows.map(rowToBid);
  return rowToTask(taskRows[0], bids);
}

// Create a new task
export async function createTask(data: Omit<Task, 'id' | 'createdAt' | 'bids' | 'status'>): Promise<Task> {
  const sql = getDb();
  const id = `task-${Date.now()}`;

  await sql`
    INSERT INTO tasks (
      id, title, description, acceptance_criteria, 
      bounty_amount, bounty_currency,
      poster_name, poster_moltbook, poster_wallet,
      deadline
    ) VALUES (
      ${id}, ${data.title}, ${data.description}, ${JSON.stringify(data.acceptanceCriteria)},
      ${data.bounty.amount}, ${data.bounty.currency},
      ${data.poster.name}, ${data.poster.moltbook || null}, ${data.poster.wallet || null},
      ${data.deadline || null}
    )
  `;

  return (await getTaskById(id))!;
}

// Add a bid to a task
export async function addBid(
  taskId: string, 
  data: Omit<Bid, 'id' | 'taskId' | 'createdAt' | 'status'>
): Promise<Bid | null> {
  const sql = getDb();
  
  // Check task exists and is open
  const task = await getTaskById(taskId);
  if (!task || task.status !== 'open') return null;

  const id = `bid-${Date.now()}`;

  await sql`
    INSERT INTO bids (
      id, task_id, bidder_name, bidder_moltbook, bidder_wallet,
      amount, currency, pitch, estimated_delivery
    ) VALUES (
      ${id}, ${taskId}, ${data.bidder.name}, ${data.bidder.moltbook || null}, ${data.bidder.wallet || null},
      ${data.amount}, ${data.currency}, ${data.pitch}, ${data.estimatedDelivery}
    )
  `;

  const bidRows = await sql`SELECT * FROM bids WHERE id = ${id}`;
  return rowToBid(bidRows[0]);
}

// Update task status
export async function updateTaskStatus(taskId: string, status: Task['status']): Promise<Task | null> {
  const sql = getDb();
  
  const result = await sql`
    UPDATE tasks SET status = ${status} WHERE id = ${taskId} RETURNING id
  `;
  
  if (result.length === 0) return null;
  return getTaskById(taskId);
}

// Accept a bid
export async function acceptBid(taskId: string, bidId: string): Promise<Task | null> {
  const sql = getDb();
  
  // Verify task and bid exist
  const task = await getTaskById(taskId);
  if (!task) return null;
  
  const bid = task.bids.find(b => b.id === bidId);
  if (!bid) return null;

  // Accept this bid, reject others, update task
  await sql`UPDATE bids SET status = 'rejected' WHERE task_id = ${taskId}`;
  await sql`UPDATE bids SET status = 'accepted' WHERE id = ${bidId}`;
  await sql`UPDATE tasks SET status = 'in_progress', accepted_bid = ${bidId} WHERE id = ${taskId}`;

  return getTaskById(taskId);
}
