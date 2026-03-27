"use client"

import * as React from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib"

interface ConfirmationDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onConfirm: () => void
    title?: string
    description?: string
    confirmText?: string
    cancelText?: string
    variant?: "default" | "destructive"
    loading?: boolean
}

export function ConfirmationDialog({
    open,
    onOpenChange,
    onConfirm,
    title = "Are you sure?",
    description = "This action cannot be undone.",
    confirmText = "Confirm",
    cancelText = "Cancel",
    variant = "destructive",
    loading = false,
}: ConfirmationDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-sm sm:max-w-md md:max-w-lg">
                <DialogHeader>
                    <DialogTitle className="text-base sm:text-lg font-semibold">
                        {title}
                    </DialogTitle>
                    <DialogDescription className="text-sm text-muted-foreground leading-relaxed">
                        {description}
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="mt-6 flex flex-row justify-end gap-2 sm:gap-3">
                    {/* secondary: one clear frame (outline + extra border classes stacked visually) */}
                    <Button
                        variant="secondary"
                        size="lg"
                        animation="colors"
                        className="min-w-[5.5rem] bg-background"
                        onClick={() => onOpenChange(false)}
                        disabled={loading}
                    >
                        {cancelText}
                    </Button>
                    {/* Avoid shared `variant="destructive"` here: it stacks borders + ring-inset and reads as a broken “double box”. */}
                    <Button
                        variant={variant === "destructive" ? "ghost" : variant}
                        size="lg"
                        animation="colors"
                        className={cn(
                            "min-w-[5.5rem] font-semibold",
                            variant === "destructive" &&
                                "border border-red-900/40 bg-destructive text-primary-foreground shadow-sm hover:bg-destructive/90 hover:text-primary-foreground focus-visible:ring-2 focus-visible:ring-destructive/35 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                        )}
                        onClick={() => {
                            onConfirm()
                            // We don't close automatically if loading is possible,
                            // but the caller can close it on success.
                        }}
                        disabled={loading}
                    >
                        {loading ? "Processing..." : confirmText}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
