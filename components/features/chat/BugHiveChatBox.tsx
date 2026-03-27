"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { X, User } from "lucide-react"
import { BotMessageSquareIcon } from "@/components/ui/bot-message-square"
import { SendIcon } from "@/components/ui/send"
import { toast } from "sonner"
import { cn } from "@/lib"

interface Message {
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

const suggestionMessages = [
  "How do I report a bug?",
  "What are related bugs?",
  "How do clusters work?",
  "Where do GitHub issues show?",
  "How do I add a solution?",
  "What is the Related Bugs panel?",
]

export function BugHiveChatBox() {
  const [isOpen, setIsOpen] = React.useState(false)
  const [messages, setMessages] = React.useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hi! I'm your BugHive assistant. Ask me about reporting bugs, clusters, related bugs (GitHub, Stack Overflow), or solutions.",
      timestamp: new Date(),
    },
  ])
  const [inputValue, setInputValue] = React.useState("")
  const [isLoading, setIsLoading] = React.useState(false)
  const messagesEndRef = React.useRef<HTMLDivElement>(null)

  const scrollToBottom = React.useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [])

  React.useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  const sendToApi = React.useCallback(
    async (newUserContent: string, currentMessages: Message[]) => {
      const messagesToSend = [
        ...currentMessages.map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
        { role: "user" as const, content: newUserContent },
      ]

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: messagesToSend }),
      })

      const contentType = res.headers.get("content-type") || ""

      if (!res.ok) {
        if (contentType.includes("application/json")) {
          const err = await res.json().catch(() => ({}))
          throw new Error(err?.error || res.statusText)
        }

        const text = await res.text().catch(() => "")
        const hint =
          text.includes("<!DOCTYPE html>") || contentType.includes("text/html")
            ? "The server returned an HTML error page. Check server logs (and auth middleware redirects)."
            : "The server returned a non-JSON error response."
        throw new Error(`${res.statusText}. ${hint}`)
      }

      if (!contentType.includes("application/json")) {
        const text = await res.text().catch(() => "")
        const hint =
          text.includes("<!DOCTYPE html>") || contentType.includes("text/html")
            ? "The server returned HTML instead of JSON. This can happen if middleware redirects."
            : "The server returned a non-JSON success response."
        throw new Error(hint)
      }

      const data = await res.json()
      if (!data.response) throw new Error("No response from assistant")
      return data.response
    },
    []
  )

  const handleSuggestionClick = React.useCallback(
    async (suggestion: string) => {
      const userMessage: Message = {
        role: "user",
        content: suggestion,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, userMessage])
      setIsLoading(true)

      try {
        const responseText = await sendToApi(suggestion, messages)
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: responseText,
            timestamp: new Date(),
          },
        ])
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Failed to send message"
        )
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "Sorry, something went wrong. Please try again.",
            timestamp: new Date(),
          },
        ])
      } finally {
        setIsLoading(false)
      }
    },
    [messages, sendToApi]
  )

  const handleSendMessage = React.useCallback(async () => {
    const trimmed = inputValue.trim()
    if (!trimmed || isLoading) return

    const userMessage: Message = {
      role: "user",
      content: trimmed,
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, userMessage])
    setInputValue("")
    setIsLoading(true)

    try {
      const responseText = await sendToApi(trimmed, messages)
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: responseText,
          timestamp: new Date(),
        },
      ])
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to send message"
      )
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, something went wrong. Please try again.",
          timestamp: new Date(),
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }, [inputValue, isLoading, messages, sendToApi])

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault()
        handleSendMessage()
      }
    },
    [handleSendMessage]
  )

  const formatTime = (date: Date) =>
    date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })

  return (
    <>
      <Button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "fixed bottom-6 right-6 z-[9999] h-14 w-14 rounded-full border border-chatbot-bg/70 bg-chatbot-bg text-primary-foreground shadow-lg transition-all duration-150",
          "inline-flex items-center justify-center cursor-pointer select-none active:scale-[0.97]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          "hover:shadow-xl hover:bg-chatbot-bg/90 [&_svg]:pointer-events-none [&_svg]:shrink-0",
          isOpen && "scale-95"
        )}
        aria-label={isOpen ? "Close chat" : "Open chat"}
      >
        {isOpen ? (
          <X className="h-6 w-6 text-primary-foreground" stroke="currentColor" />
        ) : (
          <BotMessageSquareIcon size={24} className="h-6 w-6 text-primary-foreground" aria-hidden />
        )}
      </Button>

      {isOpen && (
        <Card
          className={cn(
            "fixed bottom-24 right-6 w-[min(96vw,24rem)] z-[9998] flex flex-col",
            "rounded-xl border border-border/60 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/85 shadow-2xl",
            "max-h-[min(500px,80vh)]"
          )}
        >
          <CardHeader className="shrink-0 flex flex-row items-center justify-between gap-2 border-b border-border/60 bg-muted/10 pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <BotMessageSquareIcon size={20} className="h-5 w-5 text-primary" />
              BugHive Assistant
            </CardTitle>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="h-8 w-8 shrink-0 text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Close chat"
            >
              <X className="h-5 w-5" />
            </Button>
          </CardHeader>

          <CardContent className="flex-1 flex flex-col p-0 min-h-0">
            <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
              {messages.map((message, index) => (
                <div
                  key={index}
                  ref={index === messages.length - 1 ? messagesEndRef : undefined}
                  className={cn(
                    "flex gap-3",
                    message.role === "user" ? "flex-row-reverse" : "flex-row"
                  )}
                >
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarFallback
                      className={cn(
                        "text-sm",
                        message.role === "user"
                          ? "bg-primary/10 text-primary"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {message.role === "user" ? (
                        <User className="h-4 w-4" />
                      ) : (
                        <BotMessageSquareIcon size={16} className="h-4 w-4" />
                      )}
                    </AvatarFallback>
                  </Avatar>
                  <div
                    className={cn(
                      "max-w-[80%] min-w-0",
                      message.role === "user" ? "text-right" : "text-left"
                    )}
                  >
                    <div
                      className={cn(
                        "inline-block rounded-xl p-3 text-sm whitespace-pre-wrap",
                        message.role === "user"
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "bg-muted/80 text-foreground"
                      )}
                    >
                      {message.content}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatTime(message.timestamp)}
                    </p>
                  </div>
                </div>
              ))}

              {messages.length > 0 &&
                messages[messages.length - 1].role === "assistant" &&
                !isLoading && (
                  <div className="mt-4 rounded-lg border border-border/50 bg-muted/40 p-3">
                    <p className="w-full text-xs text-muted-foreground mb-2 font-medium">
                      Quick questions:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {suggestionMessages.map((suggestion, index) => (
                        <Button
                          key={index}
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleSuggestionClick(suggestion)}
                          className="h-auto rounded-md px-3 py-1.5 text-xs text-foreground hover:bg-muted"
                        >
                          {suggestion}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

              {isLoading && (
                <div className="flex gap-3">
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarFallback className="bg-muted">
                      <BotMessageSquareIcon size={16} className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="rounded-xl bg-muted p-3">
                    <div className="flex gap-1">
                      {[0, 1, 2].map((i) => (
                        <div
                          key={i}
                          className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce"
                          style={{ animationDelay: `${i * 0.1}s` }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="shrink-0 border-t border-border/60 bg-background/80 p-4">
              <div className="flex gap-2">
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask about BugHive..."
                  disabled={isLoading}
                  className="flex-1"
                />
                <Button
                  type="button"
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || isLoading}
                  size="icon"
                  className="shrink-0"
                  aria-label="Send"
                >
                  <SendIcon size={16} className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  )
}
