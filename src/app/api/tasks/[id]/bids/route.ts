import { NextRequest, NextResponse } from "next/server";
import { addBid, getTaskById } from "@/lib/store";

// POST /api/tasks/[id]/bids - Submit a bid
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  try {
    // Check task exists and is open
    const task = await getTaskById(id);
    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }
    if (task.status !== "open") {
      return NextResponse.json({ error: "Task is not open for bids" }, { status: 400 });
    }

    const body = await request.json();
    
    const { bidder, amount, currency, pitch, estimatedDelivery } = body;
    
    if (!bidder?.name || !amount || !pitch || !estimatedDelivery) {
      return NextResponse.json(
        { error: "Missing required fields: bidder.name, amount, pitch, estimatedDelivery" },
        { status: 400 }
      );
    }

    const bid = await addBid(id, {
      bidder: {
        name: bidder.name,
        moltbook: bidder.moltbook,
        wallet: bidder.wallet,
      },
      amount,
      currency: currency || "ETH",
      pitch,
      estimatedDelivery,
    });

    if (!bid) {
      return NextResponse.json({ error: "Failed to create bid" }, { status: 500 });
    }

    return NextResponse.json(bid, { status: 201 });
  } catch (error) {
    console.error("Failed to create bid:", error);
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
