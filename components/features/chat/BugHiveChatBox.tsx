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
import { cn } from "@/lib/utils-client"

interface Message {
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

const suggestionMessages = [
  "How do I report a bug?",
  "What are related bugs?",
  "How do clusters work?",
  "Where do GitHub/Jira issues show?",
  "How do I add a solution?",
  "What is the Related Bugs panel?",
]

export function BugHiveChatBox() {
  const [isOpen, setIsOpen] = React.useState(false)
  const [messages, setMessages] = React.useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hi! I'm your BugHive assistant. Ask me about reporting bugs, clusters, related bugs (GitHub, Jira, Stack Overflow, Bugzilla), or solutions.",
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
          "focus-visible:border-ring focus-visible:ring-ring/30 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:aria-invalid:border-destructive/50 bg-clip-padding text-xs/relaxed font-medium focus-visible:ring-[2px] aria-invalid:ring-[2px] inline-flex items-center justify-center whitespace-nowrap disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none shrink-0 [&_svg]:shrink-0 outline-none group/button select-none gap-2! aria-expanded:ring-[2px] aria-expanded:ring-ring/30 cursor-pointer bg-linear-to-t hover:to-muted to-sidebar from-muted dark:from-muted/50 dark:border-border shadow-zinc-950/10 size-7 active:scale-[0.97] transition-all duration-150 fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-[9999] bg-chatbot-bg text-primary-foreground border border-chatbot-bg/70 hover:bg-chatbot-bg/90 hover:text-primary-foreground [&_svg]:text-icon-orange",
          isOpen && "scale-95"
        )}
        aria-label={isOpen ? "Close chat" : "Open chat"}
      >
        {isOpen ? (
          <X className="h-6 w-6 text-icon-orange" stroke="currentColor" />
        ) : (
          <BotMessageSquareIcon size={24} className="h-6 w-6 text-icon-orange" aria-hidden />
        )}
      </Button>

      {isOpen && (
        <Card
          className={cn(
            "fixed bottom-24 right-6 w-[min(96vw,24rem)] shadow-xl z-[9998] flex flex-col",
            "max-h-[min(500px,80vh)]"
          )}
        >
          <CardHeader className="pb-3 border-b shrink-0 flex flex-row items-center justify-between gap-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <BotMessageSquareIcon size={20} className="h-5 w-5 text-primary" />
              BugHive Assistant
            </CardTitle>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="h-8 w-8 shrink-0 text-black hover:bg-muted dark:text-black"
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
                        "inline-block p-3 rounded-none text-sm whitespace-pre-wrap",
                        message.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
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
                  <div className="flex flex-wrap gap-2 mt-4 p-3 rounded-none bg-muted/50">
                    <p className="w-full text-xs text-muted-foreground mb-2 font-medium">
                      Quick questions:
                    </p>
                    {suggestionMessages.map((suggestion, index) => (
                      <Button
                        key={index}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="text-xs px-3 py-1.5 h-auto rounded-none text-foreground hover:bg-muted"
                      >
                        {suggestion}
                      </Button>
                    ))}
                  </div>
                )}

              {isLoading && (
                <div className="flex gap-3">
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarFallback className="bg-muted">
                      <BotMessageSquareIcon size={16} className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="bg-muted p-3 rounded-lg">
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

            <div className="p-4 border-t shrink-0">
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
