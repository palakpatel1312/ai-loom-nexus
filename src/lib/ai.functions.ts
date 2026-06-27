import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-3-flash-preview";

type Msg = { role: "system" | "user" | "assistant"; content: string };

async function callAI(messages: Msg[]) {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("Missing LOVABLE_API_KEY");
  const res = await fetch(GATEWAY, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": key,
    },
    body: JSON.stringify({ model: MODEL, messages }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`AI gateway ${res.status}: ${text.slice(0, 200)}`);
  }
  const data = await res.json();
  const content: string = data?.choices?.[0]?.message?.content ?? "";
  const tokens: number = data?.usage?.total_tokens ?? 0;
  return { content, tokens };
}

export const summarizeNote = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z.object({ title: z.string(), content: z.string().min(1) }).parse(data),
  )
  .handler(async ({ data }) => {
    const { content, tokens } = await callAI([
      {
        role: "system",
        content:
          "Summarize the user's note in exactly 3 concise bullet points. Respond with only the bullets, one per line, each starting with '- '. No preamble.",
      },
      { role: "user", content: `Title: ${data.title}\n\n${data.content}` },
    ]);
    const bullets = content
      .split("\n")
      .map((l) => l.replace(/^[-*•]\s*/, "").trim())
      .filter(Boolean)
      .slice(0, 3);
    return { bullets, tokens };
  });

export const chatCompletion = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z
      .object({
        messages: z.array(
          z.object({
            role: z.enum(["user", "assistant"]),
            content: z.string(),
          }),
        ),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const { content, tokens } = await callAI([
      {
        role: "system",
        content:
          "You are NexusOS Assistant, a sharp, concise AI productivity copilot. Help users plan tasks, refine notes, and think clearly. Use markdown sparingly.",
      },
      ...data.messages,
    ]);
    return { content, tokens };
  });

export const noteToTasks = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z.object({ title: z.string(), content: z.string().min(1) }).parse(data),
  )
  .handler(async ({ data }) => {
    const { content, tokens } = await callAI([
      {
        role: "system",
        content:
          "Extract exactly 3 actionable tasks from the note. Respond as JSON: {\"tasks\":[{\"title\":\"...\",\"description\":\"...\",\"priority\":\"Low|Medium|High\"}]}. No markdown, just JSON.",
      },
      { role: "user", content: `Title: ${data.title}\n\n${data.content}` },
    ]);
    let tasks: Array<{ title: string; description: string; priority: "Low" | "Medium" | "High" }> = [];
    try {
      const cleaned = content.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(cleaned);
      tasks = (parsed.tasks ?? []).slice(0, 3).map((t: { title?: unknown; description?: unknown; priority?: unknown }) => ({
        title: String(t.title ?? "Untitled task"),
        description: String(t.description ?? ""),
        priority:
          t.priority === "High" || t.priority === "Low" ? t.priority : "Medium",
      }));
    } catch {
      tasks = [
        { title: "Review the latest note", description: "Re-read and capture key insights.", priority: "Medium" },
        { title: "Identify next action", description: "Pick the single most useful next step.", priority: "High" },
        { title: "Schedule follow-up", description: "Block time on the calendar to act on it.", priority: "Low" },
      ];
    }
    return { tasks, tokens };
  });