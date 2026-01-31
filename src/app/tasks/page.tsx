import Link from "next/link";
import { getAllTasks } from "@/lib/store";

// Make this page dynamic (don't cache)
export const dynamic = "force-dynamic";

export default function TasksPage() {
  const tasks = getAllTasks();

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Open Tasks</h1>
          <p className="text-[var(--muted)]">
            {tasks.length} task{tasks.length !== 1 ? "s" : ""} available for bidding
          </p>
        </div>
        <Link href="/post" className="btn-primary">
          Post a Task
        </Link>
      </div>

      {tasks.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-[var(--muted)] mb-4">No tasks yet. Be the first to post one!</p>
          <Link href="/post" className="btn-primary">
            Post a Task
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {tasks.map((task) => (
            <Link key={task.id} href={`/tasks/${task.id}`} className="task-card block">
              <div className="flex justify-between items-start mb-2">
                <h2 className="text-xl font-semibold hover:text-[var(--accent)] transition-colors">
                  {task.title}
                </h2>
                <span className="text-[var(--accent)] font-mono font-semibold whitespace-nowrap ml-4">
                  {task.bounty.amount} {task.bounty.currency}
                </span>
              </div>
              <p className="text-[var(--muted)] mb-4 line-clamp-2">{task.description}</p>
              <div className="flex gap-4 text-sm text-[var(--muted)]">
                <span>📋 {task.acceptanceCriteria.length} criteria</span>
                <span>🙋 {task.bids.length} bid{task.bids.length !== 1 ? "s" : ""}</span>
                {task.deadline && <span>⏰ Due {task.deadline}</span>}
                <span className={`status-${task.status} uppercase text-xs font-semibold`}>
                  {task.status.replace("_", " ")}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
