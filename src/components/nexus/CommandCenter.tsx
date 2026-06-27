import { useEffect, useRef, useState } from "react";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles, Send, Wand2, User, Bot, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { chatCompletion, noteToTasks } from "@/lib/ai.functions";

export function CommandCenter() {
  const chat = useStore((s) => s.chat);
  const addChat = useStore((s) => s.addChat);
  const clearChat = useStore((s) => s.clearChat);
  const addTokens = useStore((s) => s.addTokens);
  const notes = useStore((s) => s.notes);
  const addTask = useStore((s) => s.addTask);
  const logActivity = useStore((s) => s.logActivity);

  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [converting, setConverting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const chatFn = useServerFn(chatCompletion);
  const tasksFn = useServerFn(noteToTasks);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [chat.length, sending]);

  async function send() {
    const text = input.trim();
    if (!text || sending) return;
    setInput("");
    addChat({ role: "user", content: text });
    setSending(true);
    try {
      const history = [...useStore.getState().chat].map((m) => ({
        role: m.role,
        content: m.content,
      }));
      const res = await chatFn({ data: { messages: history } });
      addChat({ role: "assistant", content: res.content });
      addTokens(res.tokens);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed";
      addChat({ role: "assistant", content: `⚠️ ${msg}` });
      toast.error(msg);
    } finally {
      setSending(false);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }

  async function convertNoteToTasks() {
    const lastNote = notes[0];
    if (!lastNote || !lastNote.content.trim()) {
      toast.error("No note available to convert");
      return;
    }
    setConverting(true);
    try {
      const res = await tasksFn({
        data: { title: lastNote.title, content: lastNote.content },
      });
      res.tasks.forEach((t) =>
        addTask({ title: t.title, description: t.description, priority: t.priority }),
      );
      addTokens(res.tokens);
      logActivity(`Converted note "${lastNote.title}" into ${res.tasks.length} tasks`);
      toast.success(`Injected ${res.tasks.length} tasks into To Do`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Conversion failed");
    } finally {
      setConverting(false);
    }
  }

  return (
    <div className="flex h-[calc(100vh-3rem)] flex-col gap-4">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AI Command Center</h1>
          <p className="text-sm text-muted-foreground">
            Your productivity copilot. Powered by Lovable AI.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={convertNoteToTasks}
            disabled={converting}
            className="border-primary/40 bg-primary/10 hover:bg-primary/20"
          >
            <Wand2 className={cn("mr-2 h-4 w-4 text-primary", converting && "animate-pulse")} />
            Convert Last Note to Tasks
          </Button>
          {chat.length > 0 && (
            <Button variant="ghost" size="icon" onClick={clearChat} title="Clear chat">
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <div className="glass flex flex-1 flex-col overflow-hidden rounded-2xl">
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6">
          {chat.length === 0 ? (
            <EmptyChat />
          ) : (
            <div className="flex flex-col gap-4">
              {chat.map((m) => (
                <Bubble key={m.id} role={m.role} content={m.content} />
              ))}
              {sending && <TypingBubble />}
            </div>
          )}
        </div>
        <div className="border-t border-border/60 bg-background/40 p-3">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
            className="flex items-center gap-2"
          >
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything..."
              disabled={sending}
              className="flex-1 bg-background/60"
            />
            <Button
              type="submit"
              disabled={!input.trim() || sending}
              className="brand-gradient text-white"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

function Bubble({ role, content }: { role: "user" | "assistant"; content: string }) {
  const isUser = role === "user";
  return (
    <div className={cn("flex gap-3", isUser && "flex-row-reverse")}>
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
          isUser ? "bg-secondary" : "brand-gradient",
        )}
      >
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4 text-white" />}
      </div>
      <div
        className={cn(
          "max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap",
          isUser
            ? "brand-gradient text-white rounded-tr-sm"
            : "bg-secondary/70 rounded-tl-sm",
        )}
      >
        {content}
      </div>
    </div>
  );
}

function TypingBubble() {
  return (
    <div className="flex gap-3">
      <div className="brand-gradient flex h-8 w-8 shrink-0 items-center justify-center rounded-lg">
        <Bot className="h-4 w-4 text-white" />
      </div>
      <div className="rounded-2xl rounded-tl-sm bg-secondary/70 px-4 py-3">
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="h-2 w-2 animate-bounce rounded-full bg-primary"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function EmptyChat() {
  return (
    <div className="flex h-full flex-col items-center justify-center text-center">
      <div className="brand-gradient mb-4 flex h-16 w-16 items-center justify-center rounded-2xl shadow-[var(--shadow-glow)]">
        <Sparkles className="h-8 w-8 text-white" />
      </div>
      <h3 className="text-xl font-semibold">How can I help you ship?</h3>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">
        Ask for a plan, brainstorm ideas, or convert your latest note into tasks
        with one click.
      </p>
    </div>
  );
}