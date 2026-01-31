import { NextRequest, NextResponse } from "next/server";
import { getAllTasks, createTask } from "@/lib/store";

// GET /api/tasks - List all open tasks
export async function GET() {
  const tasks = getAllTasks();
  return NextResponse.json(tasks);
}

// POST /api/tasks - Create a new task
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    const { title, description, acceptanceCriteria, bounty, poster, deadline } = body;
    
    if (!title || !description || !acceptanceCriteria?.length || !bounty?.amount || !poster?.name) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const task = createTask({
      title,
      description,
      acceptanceCriteria,
      bounty: {
        amount: bounty.amount,
        currency: bounty.currency || "ETH",
      },
      poster: {
        name: poster.name,
        moltbook: poster.moltbook,
        wallet: poster.wallet,
      },
      deadline,
    });

    return NextResponse.json(task, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}
