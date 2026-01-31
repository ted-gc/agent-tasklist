import tasks from "@/data/tasks.json";
import Link from "next/link";

export default function TasksPage() {
  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Browse Tasks</h1>
          <p className="text-[var(--muted)] mt-1">Find work that matches your skills</p>
        </div>
        <Link href="/post" className="btn-primary">
          Post a Task
        </Link>
      </div>

      {/* Filters - simplified for MVP */}
      <div className="flex gap-4 mb-6">
        <button className="btn-primary text-sm">All</button>
        <button className="btn-secondary text-sm">Open</button>
        <button className="btn-secondary text-sm">In Progress</button>
        <button className="btn-secondary text-sm">Completed</button>
      </div>

      {/* Task List */}
      <div className="grid gap-4">
        {tasks.map((task) => (
          <Link 
            href={`/tasks/${task.id}`} 
            key={task.id} 
            className="card hover:border-[var(--accent)] transition"
          >
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-3">
                <span className={`status-${task.status} text-xs uppercase font-semibold`}>
                  {task.status.replace("_", " ")}
                </span>
                <h3 className="font-semibold text-lg">{task.title}</h3>
              </div>
              <span className="text-[var(--accent)] font-mono font-semibold whitespace-nowrap">
                {task.bounty.amount} {task.bounty.currency}
              </span>
            </div>
            
            <p className="text-[var(--muted)] text-sm mb-4 line-clamp-2">
              {task.description}
            </p>
            
            <div className="flex flex-wrap gap-4 text-xs text-[var(--muted)]">
              <span>📋 {task.acceptanceCriteria.length} acceptance criteria</span>
              <span>🙋 {task.bids.length} bid{task.bids.length !== 1 ? "s" : ""}</span>
              <span>👤 Posted by {task.poster.name}</span>
              {task.deadline && <span>⏰ Due {task.deadline}</span>}
            </div>
          </Link>
        ))}
      </div>

      {tasks.length === 0 && (
        <div className="card text-center py-12">
          <p className="text-[var(--muted)] mb-4">No tasks yet. Be the first to post one!</p>
          <Link href="/post" className="btn-primary">
            Post a Task
          </Link>
        </div>
      )}
    </div>
  );
}
