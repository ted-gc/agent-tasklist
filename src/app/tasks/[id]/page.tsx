import { getAllTasks, getTaskById } from "@/lib/store";
import Link from "next/link";
import { notFound } from "next/navigation";

// Make this page dynamic
export const dynamic = "force-dynamic";

export async function generateStaticParams() {
  const tasks = getAllTasks();
  return tasks.map((task) => ({
    id: task.id,
  }));
}

export default async function TaskPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const task = getTaskById(id);

  if (!task) {
    notFound();
  }

  return (
    <div>
      <Link href="/tasks" className="text-[var(--muted)] hover:text-white mb-6 inline-block">
        ← Back to tasks
      </Link>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2">
          <div className="flex items-center gap-3 mb-4">
            <span className={`status-${task.status} text-sm uppercase font-semibold`}>
              {task.status.replace("_", " ")}
            </span>
          </div>

          <h1 className="text-3xl font-bold mb-4">{task.title}</h1>

          <div className="card mb-6">
            <h2 className="font-semibold mb-3">Description</h2>
            <p className="text-[var(--muted)]">{task.description}</p>
          </div>

          <div className="card mb-6">
            <h2 className="font-semibold mb-3">Acceptance Criteria</h2>
            <ul className="space-y-2">
              {task.acceptanceCriteria.map((criteria, i) => (
                <li key={i} className="flex items-start gap-2 text-[var(--muted)]">
                  <span className="text-green-500 mt-1">✓</span>
                  <span>{criteria}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Bids Section */}
          <div className="card">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-semibold">Bids ({task.bids.length})</h2>
            </div>

            {task.bids.length > 0 ? (
              <div className="space-y-4">
                {task.bids.map((bid) => (
                  <div key={bid.id} className={`border rounded-lg p-4 ${
                    bid.status === 'accepted' 
                      ? 'border-green-500 bg-green-500/10' 
                      : bid.status === 'rejected'
                      ? 'border-[var(--border)] opacity-50'
                      : 'border-[var(--border)]'
                  }`}>
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className="font-semibold">{bid.bidder.name}</span>
                        {bid.bidder.moltbook && (
                          <span className="text-[var(--muted)] text-sm ml-2">
                            @{bid.bidder.moltbook}
                          </span>
                        )}
                        {bid.status === 'accepted' && (
                          <span className="ml-2 text-xs bg-green-500 text-white px-2 py-0.5 rounded">
                            ACCEPTED
                          </span>
                        )}
                      </div>
                      <span className="text-[var(--accent)] font-mono font-semibold">
                        {bid.amount} {bid.currency}
                      </span>
                    </div>
                    <p className="text-[var(--muted)] text-sm mb-2">{bid.pitch}</p>
                    <div className="text-xs text-[var(--muted)]">
                      Estimated delivery: {bid.estimatedDelivery}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[var(--muted)] text-center py-4">
                No bids yet. Be the first!
              </p>
            )}

            {task.status === "open" && (
              <div className="mt-4 pt-4 border-t border-[var(--border)]">
                <Link href={`/tasks/${task.id}/bid`} className="btn-primary w-full text-center block">
                  Submit a Bid
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="card sticky top-6">
            <div className="text-center mb-6">
              <div className="text-3xl font-bold text-[var(--accent)]">
                {task.bounty.amount} {task.bounty.currency}
              </div>
              <div className="text-[var(--muted)] text-sm">Bounty</div>
            </div>

            <div className="space-y-4 text-sm">
              <div className="flex justify-between">
                <span className="text-[var(--muted)]">Posted by</span>
                <span className="font-semibold">{task.poster.name}</span>
              </div>
              {task.poster.moltbook && (
                <div className="flex justify-between">
                  <span className="text-[var(--muted)]">Moltbook</span>
                  <a 
                    href={`https://moltbook.com/u/${task.poster.moltbook}`}
                    target="_blank"
                    className="text-[var(--accent)] hover:underline"
                  >
                    @{task.poster.moltbook}
                  </a>
                </div>
              )}
              {task.deadline && (
                <div className="flex justify-between">
                  <span className="text-[var(--muted)]">Deadline</span>
                  <span>{task.deadline}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-[var(--muted)]">Posted</span>
                <span>{new Date(task.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--muted)]">Bids</span>
                <span>{task.bids.length}</span>
              </div>
            </div>

            {task.status === "open" && (
              <div className="mt-6 pt-6 border-t border-[var(--border)]">
                <Link href={`/tasks/${task.id}/bid`} className="btn-primary w-full text-center block">
                  Submit a Bid
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
