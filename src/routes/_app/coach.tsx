import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Send, Loader2, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { coachChat } from "@/lib/ai.functions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/coach")({ component: Coach });

type Msg = { role: "user" | "assistant"; content: string };

const QUICK = [
  "Suggest a high-protein lunch",
  "Give me a healthy snack option",
  "How much water should I drink?",
  "Best post-workout meal?",
];

function Coach() {
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: "Hey! I'm your AI dietitian. Ask me anything about nutrition, meals, or your goals." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    const next: Msg[] = [...messages, { role: "user", content: trimmed }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const r = await coachChat({ data: { messages: next } });
      setMessages([...next, { role: "assistant", content: r.content || "..." }]);
    } catch {
      setMessages([...next, { role: "assistant", content: "Sorry, I couldn't reach the AI service." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-screen max-h-screen">
      <header className="px-5 pt-10 pb-4 border-b border-border/60">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl brand-gradient grid place-items-center">
            <Bot className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-black text-lg leading-tight">AI Coach</h1>
            <p className="text-xs text-muted-foreground">Online · Powered by Gemini</p>
          </div>
        </div>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.map((m, i) => (
          <div key={i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
            <div
              className={cn(
                "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap leading-relaxed animate-in fade-in slide-in-from-bottom-1",
                m.role === "user"
                  ? "brand-gradient text-primary-foreground rounded-br-sm"
                  : "glass rounded-bl-sm",
              )}
            >
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="glass rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1">
              <Dot delay={0} /><Dot delay={150} /><Dot delay={300} />
            </div>
          </div>
        )}
      </div>

      <div className="px-4 pb-28 pt-2 border-t border-border/60 bg-background/80 backdrop-blur">
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 no-scrollbar">
          {QUICK.map((q) => (
            <button
              key={q}
              onClick={() => send(q)}
              className="shrink-0 text-xs px-3 py-1.5 rounded-full border border-primary/40 text-primary bg-primary/10 hover:bg-primary/20"
            >
              {q}
            </button>
          ))}
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="flex gap-2"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask your dietitian…"
            className="h-12 rounded-xl flex-1"
            disabled={loading}
          />
          <Button type="submit" disabled={loading || !input.trim()} className="h-12 w-12 rounded-xl brand-gradient text-primary-foreground border-0 hover:opacity-90">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </form>
      </div>
    </div>
  );
}

function Dot({ delay }: { delay: number }) {
  return <span className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: `${delay}ms` }} />;
}