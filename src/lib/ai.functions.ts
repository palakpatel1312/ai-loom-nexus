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
    headers: { "Content-Type": "application/json", "Lovable-API-Key": key },
    body: JSON.stringify({ model: MODEL, messages }),
  });
  if (!res.ok) throw new Error(`AI gateway ${res.status}`);
  const data = await res.json();
  return (data?.choices?.[0]?.message?.content ?? "") as string;
}

const DISHES = [
  "Grilled Chicken Salad Bowl",
  "Avocado Toast with Poached Egg",
  "Salmon Teriyaki with Brown Rice",
  "Mediterranean Quinoa Bowl",
  "Vegetable Stir-Fry with Tofu",
  "Greek Yogurt Parfait with Berries",
  "Beef & Sweet Potato Hash",
  "Chickpea Curry with Basmati Rice",
];

export const analyzeFood = createServerFn({ method: "POST" })
  .inputValidator(() => ({}))
  .handler(async () => {
    const dish = DISHES[Math.floor(Math.random() * DISHES.length)];
    const raw = await callAI([
      {
        role: "system",
        content:
          'You are a nutrition AI. Given a dish name, output ONLY JSON: {"calories":int,"protein":int,"carbs":int,"fat":int,"tip":"one short healthy tip"}. No prose.',
      },
      { role: "user", content: dish },
    ]).catch(() => "");
    let parsed: { calories: number; protein: number; carbs: number; fat: number; tip: string };
    try {
      const cleaned = raw.replace(/```json|```/g, "").trim();
      const j = JSON.parse(cleaned);
      parsed = {
        calories: Number(j.calories) || 480,
        protein: Number(j.protein) || 28,
        carbs: Number(j.carbs) || 42,
        fat: Number(j.fat) || 18,
        tip: String(j.tip || "Pair with extra vegetables for added fiber."),
      };
    } catch {
      parsed = { calories: 480, protein: 28, carbs: 42, fat: 18, tip: "Drink water before meals to aid digestion." };
    }
    return { dish, ...parsed };
  });

export const coachChat = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z
      .object({
        messages: z.array(
          z.object({ role: z.enum(["user", "assistant"]), content: z.string() }),
        ),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const content = await callAI([
      {
        role: "system",
        content:
          "You are SnapCalorie Coach, a warm, evidence-based AI dietitian. Give concise, practical, encouraging answers in 2-4 short paragraphs. Use bullets only when listing meals or foods.",
      },
      ...data.messages,
    ]);
    return { content };
  });