"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { IconSend } from "@tabler/icons-react"
import { RichTextEditor } from "@/components/ui/RichTextEditor"
import { fetchWithRetry } from "@/lib"

interface BugCommentFormProps {
    bugId: string
    userId?: string
    onCommentAdded: () => void
}

export function BugCommentForm({ bugId, userId, onCommentAdded }: BugCommentFormProps) {
    const [content, setContent] = React.useState("")
    const [isSubmitting, setIsSubmitting] = React.useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!content.trim() || isSubmitting) return

        setIsSubmitting(true)
        try {
            const res = await fetchWithRetry(`/api/bugs/${bugId}/comments`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content: content.trim() }),
            }, { attempts: 2 })

            if (!res.ok) {
                const data = await res.json().catch(() => ({}))
                throw new Error(data.error || "Failed to add comment")
            }

            setContent("")
            toast.success("Comment added")
            onCommentAdded()
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed to add comment")
        } finally {
            setIsSubmitting(false)
        }
    }

    if (!userId) {
        return (
            <div className="p-4 bg-muted/50 rounded-lg text-center text-sm text-muted-foreground border border-dashed">
                Please sign in to join the conversation.
            </div>
        )
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-3">
            <RichTextEditor
                value={content}
                onChange={setContent}
                placeholder="Add a comment or ask for more details..."
                minHeight="100px"
                maxHeight="220px"
                toolbar="minimal"
            />
            <div className="flex justify-end">
                <Button
                    type="submit"
                    disabled={!content.trim() || isSubmitting}
                    size="sm"
                    className="gap-2"
                >
                    {isSubmitting ? "Posting..." : "Post Comment"}
                    <IconSend className="size-4" />
                </Button>
            </div>
        </form>
    )
}
