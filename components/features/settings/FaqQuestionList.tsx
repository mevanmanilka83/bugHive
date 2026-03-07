"use client"

import * as React from "react"
import { cn } from "@/lib"

export type FaqItem = { id: string; q: string; a: string }

export function FaqQuestionList({ items }: { items: FaqItem[] }) {
  const [openId, setOpenId] = React.useState<string | null>(items[0]?.id ?? null)

  return (
    <ul className="space-y-2">
      {items.map((item) => {
        const isOpen = openId === item.id
        return (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => setOpenId(isOpen ? null : item.id)}
              className={cn(
                "flex w-full cursor-pointer list-none items-start gap-2 rounded-lg border px-4 py-3 text-left transition-colors",
                "hover:bg-muted/50",
                isOpen && "border-primary/30 bg-muted/30"
              )}
            >
              <span className="shrink-0 mt-0.5 text-muted-foreground font-medium">Q.</span>
              <span className="font-medium text-foreground">{item.q}</span>
            </button>
            {isOpen && (
              <div className="mt-2 pl-6 pr-4 pb-4 text-sm text-muted-foreground border-l-2 border-muted ml-2">
                {item.a}
              </div>
            )}
          </li>
        )
      })}
    </ul>
  )
}
