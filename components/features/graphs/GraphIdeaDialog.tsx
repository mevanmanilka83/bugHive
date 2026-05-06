"use client"

import * as React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { toast } from "sonner"
import { Check, Lightbulb, Wrench, Sparkles } from "lucide-react"
import { GraphIdeaStep1Basics, type GraphIdeaKind } from "./GraphIdeaStep1Basics"
import { GraphIdeaStep2Context } from "./GraphIdeaStep2Context"
import { GraphIdeaStep3Details } from "./GraphIdeaStep3Details"
import { GraphIdeaStep4Review } from "./GraphIdeaStep4Review"

export type GraphIdeaDialogProps = {
  workspaceId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  initialKind?: GraphIdeaKind
  initialTitle?: string
  initialContent?: string | null
  onCreated?: (idea: { id: string; kind: GraphIdeaKind; title: string; content: string | null }) => void
}

function parseIdeaContent(raw: string | null | undefined): {
  description: string
  summary: string
  details: string
} {
  const text = (raw ?? "").trim()
  if (!text) return { description: "", summary: "", details: "" }

  const sections: Record<string, string> = {}
  let current: string | null = null

  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (/^Description:/i.test(trimmed)) {
      current = "description"
      sections[current] = trimmed.replace(/^Description:/i, "").trim()
      continue
    }
    if (/^Context:/i.test(trimmed)) {
      current = "summary"
      sections[current] = trimmed.replace(/^Context:/i, "").trim()
      continue
    }
    if (/^Details:/i.test(trimmed)) {
      current = "details"
      sections[current] = trimmed.replace(/^Details:/i, "").trim()
      continue
    }
    if (current) {
      sections[current] = (sections[current] ? sections[current] + "\n" : "") + line
    }
  }

  if (!sections.description && !sections.summary && !sections.details) {
    return { description: text, summary: "", details: "" }
  }

  return {
    description: sections.description ?? "",
    summary: sections.summary ?? "",
    details: sections.details ?? "",
  }
}

export function GraphIdeaDialog({
  workspaceId,
  open,
  onOpenChange,
  initialKind = "idea",
  initialTitle = "",
  initialContent = "",
  onCreated,
}: GraphIdeaDialogProps) {
  const [step, setStep] = React.useState<1 | 2 | 3 | 4>(1)
  const [kind, setKind] = React.useState<GraphIdeaKind>(initialKind)
  const [title, setTitle] = React.useState(initialTitle)
  const [description, setDescription] = React.useState("")
  const [summary, setSummary] = React.useState("")
  const [details, setDetails] = React.useState("")
  const [submitting, setSubmitting] = React.useState(false)

  React.useEffect(() => {
    if (open) {
      setStep(1)
      setKind(initialKind)
      setTitle(initialTitle)
      const parsed = parseIdeaContent(initialContent)
      setDescription(parsed.description)
      setSummary(parsed.summary)
      setDetails(parsed.details)
    }
  }, [open, initialKind, initialTitle, initialContent])

  const KindIcon = kind === "solution" ? Wrench : kind === "fix" ? Sparkles : Lightbulb

  async function handleSave() {
    const trimmedTitle = title.trim()
    if (!trimmedTitle || submitting) return

    const blocks: string[] = []
    if (description.trim()) {
      blocks.push(`Description:\n${description.trim()}`)
    }
    if (summary.trim()) {
      blocks.push(`Context:\n${summary.trim()}`)
    }
    if (details.trim()) {
      blocks.push(`Details:\n${details.trim()}`)
    }
    const content = blocks.join("\n\n") || ""

    try {
      setSubmitting(true)
      const res = await fetch(`/api/workspaces/${workspaceId}/ideas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind,
          title: trimmedTitle,
          content: content.trim() || null,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => null)
        throw new Error(err?.error || "Failed to save idea")
      }
      toast.success("Idea saved to this graph")
      const data = await res.json().catch(() => null)
      const idea = data?.idea as { id: string; kind: GraphIdeaKind; title: string; content: string | null } | undefined
      onOpenChange(false)
      if (idea) {
        onCreated?.(idea)
      } else {
        onCreated?.({
          id: "",
          kind,
          title: trimmedTitle,
          content: content.trim() || null,
        })
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to save idea")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100vw-1rem)] max-h-[90dvh] overflow-x-hidden overflow-y-auto p-4 sm:max-w-4xl sm:max-h-[90vh] sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-base sm:text-lg">Add idea / solution</DialogTitle>
        </DialogHeader>

        <div className="w-full min-w-0 py-3 sm:py-5">
          <div className="flex items-start w-full gap-0 min-w-0">
            {[
              { num: 1, label: "Basic Info" },
              { num: 2, label: "Priority" },
              { num: 3, label: "Behavior" },
              { num: 4, label: "Details" },
            ].map(({ num, label }, index) => {
              const isCompleted = step > num
              const isCurrent = step === num
              const isFuture = step < num
              const showConnector = index < 3
              return (
                <React.Fragment key={num}>
                  <div className="flex flex-col items-center shrink-0">
                    <div className="flex h-7 items-center justify-center sm:h-9">
                      <div
                        className={`
                          relative flex items-center justify-center size-7 rounded-full border-2 transition-all duration-300 ease-out sm:size-9
                          ${isCompleted ? "bg-primary border-primary text-primary-foreground shadow-sm" : ""}
                          ${isCurrent ? "bg-primary/10 border-primary text-primary font-semibold scale-110 ring-2 ring-primary/30 ring-offset-2 ring-offset-background" : ""}
                          ${isFuture ? "border-muted-foreground/25 bg-muted/40 text-muted-foreground" : ""}
                      `}
                      >
                        {isCompleted ? (
                          <Check className="size-3.5 shrink-0 sm:size-5" strokeWidth={2.5} />
                        ) : (
                          <span className="text-[10px] font-semibold sm:text-sm">{num}</span>
                        )}
                      </div>
                    </div>
                    <span
                      className={`
                        mt-1.5 hidden text-[10px] font-medium transition-colors duration-200 text-center whitespace-nowrap sm:mt-2 sm:block sm:text-xs
                        ${isCompleted ? "text-primary" : ""}
                        ${isCurrent ? "text-foreground font-semibold" : ""}
                        ${isFuture ? "text-muted-foreground" : ""}
                      `}
                      aria-hidden
                    >
                      {label}
                    </span>
                  </div>
                  {showConnector && (
                    <div
                      className="flex h-7 min-w-1 flex-1 max-w-[32px] shrink-0 items-center px-0.5 sm:h-9 sm:max-w-none sm:flex-none sm:w-[120px]"
                      aria-hidden
                    >
                      <div
                        className="w-full overflow-hidden rounded-full"
                        style={{
                          height: 2,
                          backgroundColor: "rgb(163 163 163)",
                        }}
                      >
                        <div
                          className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
                          style={{ width: step > num ? "100%" : "0%" }}
                        />
                      </div>
                    </div>
                  )}
                </React.Fragment>
              )
            })}
          </div>
        </div>

        <p className="sm:hidden text-sm font-medium text-muted-foreground mt-1 mb-2 min-w-0" aria-live="polite">
          Step {step}: {["Basic Info", "Priority", "Behavior", "Details"][step - 1]}
        </p>

        <div className="px-2 pb-2">
          {step === 1 && (
            <GraphIdeaStep1Basics
              kind={kind}
              title={title}
              description={description}
              onChangeKind={setKind}
              onChangeTitle={setTitle}
              onChangeDescription={setDescription}
              canNext={!!title.trim() && !!description.trim()}
              onNext={() => setStep(2)}
              onCancel={() => onOpenChange(false)}
            />
          )}
          {step === 2 && (
            <GraphIdeaStep2Context
              summary={summary}
              onSummaryChange={setSummary}
              onNext={() => setStep(3)}
              onBack={() => setStep(1)}
            />
          )}
          {step === 3 && (
            <GraphIdeaStep3Details
              details={details}
              onDetailsChange={setDetails}
              onNext={() => setStep(4)}
              onBack={() => setStep(2)}
            />
          )}
          {step === 4 && (
            <GraphIdeaStep4Review
              kind={kind}
              title={title}
              description={description}
              summary={summary}
              details={details}
              onBack={() => setStep(3)}
              onSave={handleSave}
              submitting={submitting}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

