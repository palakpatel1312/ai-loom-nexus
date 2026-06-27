import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Sidebar, type View } from "@/components/nexus/Sidebar";
import { Dashboard } from "@/components/nexus/Dashboard";
import { Kanban } from "@/components/nexus/Kanban";
import { Notes } from "@/components/nexus/Notes";
import { CommandCenter } from "@/components/nexus/CommandCenter";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "NexusOS — AI Productivity Hub" },
      { name: "description", content: "Tasks, notes, and an AI copilot in one ultra-modern dashboard." },
      { property: "og:title", content: "NexusOS — AI Productivity Hub" },
      { property: "og:description", content: "Tasks, notes, and an AI copilot in one ultra-modern dashboard." },
    ],
  }),
  component: Index,
});

function Index() {
  const [view, setView] = useState<View>("dashboard");
  return (
    <div className="flex min-h-screen gap-4 p-4">
      <Sidebar view={view} onChange={setView} />
      <main className="flex-1 min-w-0">
        {view === "dashboard" && <Dashboard />}
        {view === "kanban" && <Kanban />}
        {view === "notes" && <Notes />}
        {view === "ai" && <CommandCenter />}
      </main>
    </div>
  );
}
