"use client";

import { Message } from "ai";
import { cn } from "@/lib/utils";
import { User, Bot, Loader2, Sparkles } from "lucide-react";
import { MarkdownRenderer } from "./MarkdownRenderer";
import { ToolInvocation } from "./ToolInvocation";

interface MessageListProps {
  messages: Message[];
  isLoading?: boolean;
}

/** Typing indicator — three animated dots */
function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5 px-1 py-0.5">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="block w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce"
          style={{ animationDelay: `${i * 0.15}s`, animationDuration: "0.9s" }}
        />
      ))}
    </div>
  );
}

export function MessageList({ messages, isLoading }: MessageListProps) {
  /* ── Empty state ───────────────────────────────────────────── */
  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-6 text-center">
        {/* Icon orb */}
        <div className="relative mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent border border-primary/20 shadow-lg flex items-center justify-center backdrop-blur-sm">
            <Bot className="h-7 w-7 text-primary" />
          </div>
          {/* Subtle glow ring */}
          <div className="absolute -inset-1 rounded-3xl bg-primary/10 blur-md -z-10" />
        </div>

        <p className="text-foreground font-semibold text-lg mb-2 tracking-tight">
          Generate React components with AI
        </p>
        <p className="text-muted-foreground text-sm max-w-xs leading-relaxed">
          Describe what you want — buttons, forms, cards, layouts — and I'll
          build it instantly.
        </p>

        {/* Dummy image */}
        <div className="mt-6 mb-4 overflow-hidden rounded-xl border border-border/50 shadow-sm max-w-[240px]">
          <img 
            src="https://picsum.photos/seed/chat/400/200" 
            alt="Dummy placeholder" 
            className="w-full h-auto object-cover opacity-80 hover:opacity-100 transition-opacity"
          />
        </div>

        {/* Hint chips */}
        <div className="flex flex-wrap justify-center gap-2 mt-4 max-w-xs">
          {["A login form", "A pricing card", "A nav bar"].map((hint) => (
            <span
              key={hint}
              className="text-xs px-3 py-1.5 rounded-full bg-secondary text-secondary-foreground border border-border/60 font-medium"
            >
              {hint}
            </span>
          ))}
        </div>
      </div>
    );
  }

  /* ── Message list ──────────────────────────────────────────── */
  return (
    <div className="flex flex-col h-full overflow-y-auto px-4 py-5 scroll-smooth">
      <div className="flex flex-col gap-5 max-w-3xl mx-auto w-full">
        {messages.map((message, msgIndex) => {
          const isUser = message.role === "user";
          const isLastAssistant =
            !isUser && msgIndex === messages.length - 1;

          return (
            <div
              key={message.id || message.content}
              className={cn(
                "flex gap-3 items-end",
                isUser ? "justify-end" : "justify-start"
              )}
            >
              {/* ── Assistant avatar ── */}
              {!isUser && (
                <div className="flex-shrink-0 mb-0.5">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 shadow-sm flex items-center justify-center">
                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                  </div>
                </div>
              )}

              {/* ── Bubble ── */}
              <div
                className={cn(
                  "flex flex-col gap-1.5 max-w-[80%]",
                  isUser ? "items-end" : "items-start"
                )}
              >
                <div
                  className={cn(
                    "rounded-2xl px-4 py-3 text-sm shadow-sm",
                    isUser
                      ? /* user */ [
                          "bg-primary text-primary-foreground",
                          "rounded-br-sm",
                          "shadow-primary/20 shadow-md",
                        ]
                      : /* assistant */ [
                          "glass",
                          "text-foreground",
                          "rounded-bl-sm",
                          "dark:shadow-none",
                        ]
                  )}
                >
                  {/* Text/Content Part */}
                  {message.parts ? (
                    message.parts.map((part, partIndex) => {
                      if (part.type === "text") {
                        return isUser ? (
                          <span key={partIndex} className="whitespace-pre-wrap">
                            {part.text}
                          </span>
                        ) : (
                          <MarkdownRenderer
                            key={partIndex}
                            content={part.text}
                            className="prose-sm"
                          />
                        );
                      }
                      if (part.type === "reasoning") {
                        return (
                          <div
                            key={partIndex}
                            className="mt-3 px-3 py-2.5 rounded-xl bg-muted/60 border border-border/60 backdrop-blur-sm"
                          >
                            <span className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground block mb-1.5">
                              Reasoning
                            </span>
                            <span className="text-sm text-muted-foreground leading-relaxed">
                              {part.reasoning}
                            </span>
                          </div>
                        );
                      }
                      return null;
                    })
                  ) : message.content ? (
                    isUser ? (
                      <span className="whitespace-pre-wrap">
                        {message.content}
                      </span>
                    ) : (
                      <MarkdownRenderer
                        content={message.content}
                        className="prose-sm"
                      />
                    )
                  ) : null}

                  {/* Typing indicator while streaming */}
                  {isLoading && isLastAssistant && <TypingIndicator />}
                </div>

                {/* Tool Invocations (Outside the bubble) */}
                {message.parts?.map((part, partIndex) => 
                  part.type === "tool-invocation" ? (
                    <ToolInvocation
                      key={partIndex}
                      tool={part.toolInvocation}
                    />
                  ) : null
                )}

                {/* Timestamp-style spacer role label (subtle) */}
                {isUser && (
                  <span className="text-[10px] text-muted-foreground/50 px-1 select-none">
                    You
                  </span>
                )}
              </div>

              {/* ── User avatar ── */}
              {isUser && (
                <div className="flex-shrink-0 mb-0.5">
                  <div className="w-8 h-8 rounded-xl bg-primary shadow-md shadow-primary/30 flex items-center justify-center">
                    <User className="h-3.5 w-3.5 text-primary-foreground" />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}