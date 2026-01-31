import { NextRequest, NextResponse } from "next/server";
import { getTaskById, updateTaskStatus, acceptBid } from "@/lib/store";

// GET /api/tasks/[id] - Get a single task
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  try {
    const task = await getTaskById(id);
    
    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }
    
    return NextResponse.json(task);
  } catch (error) {
    console.error("Failed to fetch task:", error);
    return NextResponse.json(
      { error: "Failed to fetch task" },
      { status: 500 }
    );
  }
}

// PATCH /api/tasks/[id] - Update task (status, accept bid)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  try {
    const body = await request.json();
    
    // Accept a bid
    if (body.acceptBid) {
      const task = await acceptBid(id, body.acceptBid);
      if (!task) {
        return NextResponse.json({ error: "Task or bid not found" }, { status: 404 });
      }
      return NextResponse.json(task);
    }
    
    // Update status
    if (body.status) {
      const task = await updateTaskStatus(id, body.status);
      if (!task) {
        return NextResponse.json({ error: "Task not found" }, { status: 404 });
      }
      return NextResponse.json(task);
    }
    
    return NextResponse.json({ error: "No valid update provided" }, { status: 400 });
  } catch (error) {
    console.error("Failed to update task:", error);
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
