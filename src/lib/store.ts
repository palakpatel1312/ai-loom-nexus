import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Priority = "Low" | "Medium" | "High";
export type Status = "todo" | "inprogress" | "done";

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  status: Status;
  createdAt: number;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  summary?: string[];
  createdAt: number;
  updatedAt: number;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: number;
}

export interface Activity {
  id: string;
  text: string;
  createdAt: number;
}

interface NexusState {
  tasks: Task[];
  notes: Note[];
  chat: ChatMessage[];
  activity: Activity[];
  tokensUsed: number;

  addTask: (t: Omit<Task, "id" | "createdAt" | "status"> & { status?: Status }) => void;
  moveTask: (id: string, status: Status) => void;
  deleteTask: (id: string) => void;

  addNote: () => string;
  updateNote: (id: string, patch: Partial<Note>) => void;
  deleteNote: (id: string) => void;
  setNoteSummary: (id: string, summary: string[]) => void;

  addChat: (m: Omit<ChatMessage, "id" | "createdAt">) => void;
  clearChat: () => void;

  addTokens: (n: number) => void;
  logActivity: (text: string) => void;
}

const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

export const useStore = create<NexusState>()(
  persist(
    (set) => ({
      tasks: [],
      notes: [],
      chat: [],
      activity: [],
      tokensUsed: 0,

      addTask: (t) =>
        set((s) => {
          const task: Task = {
            id: uid(),
            title: t.title,
            description: t.description,
            priority: t.priority,
            status: t.status ?? "todo",
            createdAt: Date.now(),
          };
          return {
            tasks: [task, ...s.tasks],
            activity: [
              { id: uid(), text: `Task "${task.title}" created`, createdAt: Date.now() },
              ...s.activity,
            ].slice(0, 30),
          };
        }),
      moveTask: (id, status) =>
        set((s) => ({
          tasks: s.tasks.map((t) => (t.id === id ? { ...t, status } : t)),
          activity: [
            {
              id: uid(),
              text: `Task moved to ${status === "inprogress" ? "In Progress" : status === "done" ? "Done" : "To Do"}`,
              createdAt: Date.now(),
            },
            ...s.activity,
          ].slice(0, 30),
        })),
      deleteTask: (id) =>
        set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) })),

      addNote: () => {
        const id = uid();
        set((s) => ({
          notes: [
            {
              id,
              title: "Untitled Note",
              content: "",
              createdAt: Date.now(),
              updatedAt: Date.now(),
            },
            ...s.notes,
          ],
        }));
        return id;
      },
      updateNote: (id, patch) =>
        set((s) => ({
          notes: s.notes.map((n) =>
            n.id === id ? { ...n, ...patch, updatedAt: Date.now() } : n,
          ),
          activity:
            patch.content !== undefined || patch.title !== undefined
              ? [
                  {
                    id: uid(),
                    text: `Note "${patch.title ?? s.notes.find((n) => n.id === id)?.title ?? "Untitled"}" updated`,
                    createdAt: Date.now(),
                  },
                  ...s.activity,
                ].slice(0, 30)
              : s.activity,
        })),
      deleteNote: (id) =>
        set((s) => ({ notes: s.notes.filter((n) => n.id !== id) })),
      setNoteSummary: (id, summary) =>
        set((s) => ({
          notes: s.notes.map((n) => (n.id === id ? { ...n, summary } : n)),
        })),

      addChat: (m) =>
        set((s) => ({
          chat: [
            ...s.chat,
            { ...m, id: uid(), createdAt: Date.now() },
          ],
        })),
      clearChat: () => set({ chat: [] }),

      addTokens: (n) => set((s) => ({ tokensUsed: s.tokensUsed + n })),
      logActivity: (text) =>
        set((s) => ({
          activity: [{ id: uid(), text, createdAt: Date.now() }, ...s.activity].slice(0, 30),
        })),
    }),
    { name: "nexusos-state" },
  ),
);

export function formatRelative(ts: number) {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m} min${m === 1 ? "" : "s"} ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hour${h === 1 ? "" : "s"} ago`;
  const d = Math.floor(h / 24);
  return `${d} day${d === 1 ? "" : "s"} ago`;
}