"use client"

import * as React from "react"
import { Check } from "lucide-react"
import { toast } from "sonner"
import { z } from "zod"
import { getBugReportSchema } from "@/lib/schemas/zod"
import { type BugPayload, type BugDialogErrors } from "@/lib/schemas/types"
import { createBugReport } from "@/app/actions/bug/BugReport"
import { Button } from "@/components/ui/button"
import { GitForkIcon } from "@/components/ui/git-fork"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import BugReportStep1Basic from "@/components/features/bugs/reports/BugReportStep1Basic"
import BugReportStep2Priority from "@/components/features/bugs/reports/BugReportStep2Priority"
import BugReportStep3Behavior from "@/components/features/bugs/reports/BugReportStep3Behavior"
import BugReportStep4Details from "@/components/features/bugs/reports/BugReportStep4Details"
import BugReportStep5Review from "@/components/features/bugs/reports/BugReportStep5Review"

// Using shared schema and type from schema module
const bugReportSchema = getBugReportSchema()

type AttachmentFile = {
  file: File
  id: string
  preview?: string
}

export function BugReportDialog({ clusterId }: { clusterId?: string }) {
  const [mounted, setMounted] = React.useState(false)
  const [open, setOpen] = React.useState(false)
  const [step, setStep] = React.useState<1 | 2 | 3 | 4 | 5>(1)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [errors, setErrors] = React.useState<BugDialogErrors>({})

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const [title, setTitle] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [priority, setPriority] = React.useState("medium")
  const [visibility, setVisibility] = React.useState("public")
  const [environmentBrowser, setEnvironmentBrowser] = React.useState("")
  const [environmentOs, setEnvironmentOs] = React.useState<string[]>([])
  const [environmentDevice, setEnvironmentDevice] = React.useState("")
  const [environmentVersion, setEnvironmentVersion] = React.useState("")
  const [expectedBehavior, setExpectedBehavior] = React.useState("")
  const [actualBehavior, setActualBehavior] = React.useState("")
  const [stepsToReproduce, setStepsToReproduce] = React.useState("")
  const [tagsInput, setTagsInput] = React.useState("")
  const [sourcesInput, setSourcesInput] = React.useState("")
  const [attachments, setAttachments] = React.useState<AttachmentFile[]>([])
  const [aiTagValidity, setAiTagValidity] = React.useState<Record<string, { valid: boolean; reason?: string }>>({})
  const aiTagAbortRef = React.useRef<AbortController | null>(null)

  function resetForm() {
    setStep(1)
    setTitle("")
    setDescription("")
    setPriority("medium")
    setVisibility("public")
    setEnvironmentBrowser("")
    setEnvironmentOs([])
    setEnvironmentDevice("")
    setEnvironmentVersion("")
    setExpectedBehavior("")
    setActualBehavior("")
    setStepsToReproduce("")
    setTagsInput("")
    setSourcesInput("")
    setAttachments([])
    setAiTagValidity({})
    setErrors({})
  }

  function getPayload(): BugPayload {
    const tags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean)
    const sources = sourcesInput
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)

    // Combine environment fields into a formatted string
    const environmentParts: string[] = []
    if (environmentBrowser) environmentParts.push(`Browser: ${environmentBrowser}`)
    if (environmentOs.length > 0) environmentParts.push(`OS: ${environmentOs.join(", ")}`)
    if (environmentDevice) environmentParts.push(`Device: ${environmentDevice}`)
    if (environmentVersion) environmentParts.push(`Version: ${environmentVersion}`)
    const environment = environmentParts.length > 0 ? environmentParts.join(", ") : undefined

    return {
      title,
      description,
      priority: priority as "low" | "medium" | "high" | "critical",
      visibility: clusterId ? undefined : (visibility as "private" | "public"),
      environment: environment || undefined,
      expected_behavior: expectedBehavior,
      actual_behavior: actualBehavior,
      steps_to_reproduce: stepsToReproduce || undefined,
      tags: tags.length ? tags : undefined,
      sources: sources.length ? sources : undefined,
      attachments: attachments.map(att => att.file),
      cluster_id: clusterId || undefined,
    }
  }

  // Step field definitions for validation
  const stepFields: Record<number, (keyof BugPayload)[]> = {
    1: ['title', 'description'], // Required fields
    2: clusterId ? ['priority'] : ['priority', 'visibility'], // Required fields (exclude visibility for cluster bugs)
    3: ['expected_behavior', 'actual_behavior'], // Behavior step: require both
    4: ['steps_to_reproduce'], // Details step: require steps to reproduce
    5: [] // Review step
  }

  // AI-based tag validation (Gemini) – debounce while typing
  React.useEffect(() => {
    const trimmedTitle = title.trim()
    const plainDescription = description.trim()
    const tags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean)

    if (!trimmedTitle || !plainDescription || tags.length === 0) {
      setAiTagValidity({})
      return
    }

    const timeout = setTimeout(async () => {
      try {
        aiTagAbortRef.current?.abort()
        const controller = new AbortController()
        aiTagAbortRef.current = controller

        const res = await fetch("/api/bugs/validate-tags", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: trimmedTitle,
            description: plainDescription,
            tags,
          }),
          signal: controller.signal,
        })
        if (!res.ok) {
          return
        }
        const data = await res.json().catch(() => null)
        const list: Array<{ tag: string; valid: boolean; reason?: string }> =
          Array.isArray(data?.tags) ? data.tags : []
        const next: Record<string, { valid: boolean; reason?: string }> = {}
        list.forEach((entry) => {
          const key = String(entry.tag || "").trim()
          if (!key) return
          next[key] = { valid: !!entry.valid, reason: entry.reason }
        })
        setAiTagValidity(next)
      } catch {
        // ignore errors / aborts
      }
    }, 600)

    return () => {
      clearTimeout(timeout)
      aiTagAbortRef.current?.abort()
    }
  }, [title, description, tagsInput])

  function validateStep(stepNumber: number): boolean {
    const payload = getPayload()
    const fieldsToValidate = stepFields[stepNumber] || []

    if (fieldsToValidate.length === 0) return true

    try {
      const stepPayload = Object.fromEntries(
        fieldsToValidate.map(field => [field, payload[field]])
      )
      const partialSchema = bugReportSchema.pick(
        Object.fromEntries(fieldsToValidate.map(field => [field, true])) as any
      )
      partialSchema.parse(stepPayload)
      return true
    } catch (error) {
      return false
    }
  }

  function validateStepWithErrors(stepNumber: number): boolean {
    const payload = getPayload()
    const fieldsToValidate = stepFields[stepNumber] || []

    if (fieldsToValidate.length === 0) return true

    try {
      const stepPayload = Object.fromEntries(
        fieldsToValidate.map(field => [field, payload[field]])
      )
      const partialSchema = bugReportSchema.pick(
        Object.fromEntries(fieldsToValidate.map(field => [field, true])) as any
      )
      partialSchema.parse(stepPayload)

      // Clear errors for validated fields
      setErrors(prev => {
        const newErrors = { ...prev }
        fieldsToValidate.forEach(field => {
          delete newErrors[field as string]
        })
        return newErrors
      })
      return true
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {}
        error.issues.forEach((err) => {
          if (err.path && err.path.length > 0) {
            const fieldPath = err.path[0] as string
            newErrors[fieldPath] = err.message
          }
        })
        setErrors(prev => ({ ...prev, ...newErrors }))
      }
      return false
    }
  }

  function validateAll(): boolean {
    const payload = getPayload()

    try {
      bugReportSchema.parse(payload)
      setErrors({})
      return true
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {}
        error.issues.forEach((err) => {
          if (err.path && err.path.length > 0) {
            const fieldPath = err.path[0] as string
            newErrors[fieldPath] = err.message
          }
        })
        setErrors(newErrors)
      }
      return false
    }
  }

  function validateAttachments(files: File[]): { valid: File[]; errors: string[] } {
    const validFiles: File[] = []
    const errors: string[] = []

    files.forEach((file) => {
      // Create a test payload with this file to validate against schema
      const testPayload = {
        title: "test", // minimal valid title
        description: "test", // minimal valid description
        priority: "medium" as const,
        visibility: "public" as const,
        attachments: [...attachments.map(att => att.file), file]
      }

      try {
        bugReportSchema.parse(testPayload)
        validFiles.push(file)
      } catch (error) {
        if (error instanceof z.ZodError) {
          const attachmentErrors = error.issues
            .filter(issue => issue.path.includes('attachments'))
            .map(issue => issue.message)

          if (attachmentErrors.length > 0) {
            errors.push(...attachmentErrors)
          } else {
            // If no specific attachment error, the file is valid
            validFiles.push(file)
          }
        }
      }
    })

    return { valid: validFiles, errors }
  }

  function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const files = event.target.files
    if (!files) return

    const fileArray = Array.from(files)
    const { valid, errors } = validateAttachments(fileArray)

    // Show errors if any
    errors.forEach(error => toast.error(error))

    if (valid.length === 0) return

    const newAttachments: AttachmentFile[] = valid.map((file) => {
      const id = Math.random().toString(36).substr(2, 9)
      let preview: string | undefined

      // Create preview for images
      if (file.type.startsWith('image/')) {
        preview = URL.createObjectURL(file)
      }

      return {
        file,
        id,
        preview
      }
    })

    setAttachments(prev => [...prev, ...newAttachments])
    event.target.value = '' // Reset input
  }

  function removeAttachment(id: string) {
    setAttachments(prev => {
      const attachment = prev.find(att => att.id === id)
      if (attachment?.preview) {
        URL.revokeObjectURL(attachment.preview)
      }
      return prev.filter(att => att.id !== id)
    })
  }

  function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  async function handleSubmit() {
    // Validate all fields before submission
    if (!validateAll()) {
      const errorMessages = Object.values(errors).filter(Boolean)
      if (errorMessages.length > 0) {
        toast.error(`Please fix these errors: ${errorMessages.join(', ')}`)
      } else {
        toast.error("Please fill in all required fields")
      }
      return
    }

    const payload = getPayload()

    try {
      setIsSubmitting(true)

      // Create FormData for file uploads
      const formData = new FormData()
      formData.append('title', payload.title)
      formData.append('description', payload.description)
      if (payload.steps_to_reproduce) formData.append('steps_to_reproduce', payload.steps_to_reproduce)
      if (payload.tags?.length) formData.append('tags', JSON.stringify(payload.tags))
      if (payload.sources?.length) formData.append('sources', JSON.stringify(payload.sources))
      if (payload.priority) formData.append('priority', payload.priority)
      if (payload.visibility && !clusterId) formData.append('visibility', payload.visibility)
      if (payload.environment) formData.append('environment', payload.environment)
      if (payload.expected_behavior) formData.append('expected_behavior', payload.expected_behavior)
      if (payload.actual_behavior) formData.append('actual_behavior', payload.actual_behavior)
      if (payload.cluster_id) formData.append('cluster_id', payload.cluster_id)

      // Add attachments
      payload.attachments?.forEach((file, index) => {
        formData.append(`attachment_${index}`, file)
      })

      // Use server action instead of fetch
      const result = await createBugReport(formData)

      if (!result.success) {
        throw new Error(result.error || "Failed to create bug report")
      }

      // Broadcast an app-wide event for dashboards/widgets
      if (typeof window !== 'undefined' && result.bug) {
        window.dispatchEvent(new CustomEvent('bug:created', { detail: result.bug }))
      }

      toast("Bug report created successfully")
      setOpen(false)
      resetForm()
    } catch (err: any) {
      toast.error(err?.message || "Something went wrong")
    } finally {
      setIsSubmitting(false)
    }
  }

  const canNextFromStep1 = React.useMemo(() => validateStep(1), [title, description, errors])
  const canNextFromStep2 = React.useMemo(() => validateStep(2), [priority, visibility, errors])
  const canNextFromStep3 = React.useMemo(() => validateStep(3), [expectedBehavior, actualBehavior, errors])
  const canNextFromStep4 = React.useMemo(() => validateStep(4), [stepsToReproduce, errors])

  if (!mounted) {
    return (
      <Button
        disabled
        className="px-4"
      >
        <GitForkIcon size={16} className="size-4 mr-2" />
        Report Bug
      </Button>
    )
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm() }}>
      <DialogTrigger asChild>
        <Button className="px-4">
          <GitForkIcon size={16} className="size-4 mr-2" />
          Report Bug
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[calc(100vw-1rem)] max-h-[90dvh] overflow-x-hidden overflow-y-auto p-4 sm:max-w-4xl sm:max-h-[90vh] sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-base sm:text-lg">Report a bug</DialogTitle>
        </DialogHeader>

        {/* Multi-step progress indicator – numbers only on mobile to avoid overflow */}
        <div className="w-full min-w-0 py-3 sm:py-5">
          <div className="flex items-start w-full gap-0 min-w-0">
            {[
              { num: 1, label: "Basic Info" },
              { num: 2, label: "Priority" },
              { num: 3, label: "Behavior" },
              { num: 4, label: "Details" },
              { num: 5, label: "Review" },
            ].map(({ num, label }, index) => {
              const isCompleted = step > num
              const isCurrent = step === num
              const isFuture = step < num
              const showConnector = index < 4
              return (
                <React.Fragment key={num}>
                  <div className="flex flex-col items-center shrink-0">
                    {/* Fixed-height row so connector line aligns with circle center */}
                    <div className="flex h-7 items-center justify-center sm:h-9">
                      <div
                        className={`
                          relative flex items-center justify-center size-7  border-2 transition-all duration-300 ease-out sm:size-9
                          ${isCompleted
                            ? "bg-primary border-primary text-primary-foreground shadow-sm"
                            : ""
                          }
                          ${isCurrent
                            ? "bg-primary/10 border-primary text-primary font-semibold scale-110 ring-2 ring-primary/30 ring-offset-2 ring-offset-background"
                            : ""
                          }
                          ${isFuture
                            ? "border-muted-foreground/25 bg-muted/40 text-muted-foreground"
                            : ""
                          }
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
                        className="w-full overflow-hidden "
                        style={{
                          height: 2,
                          backgroundColor: "rgb(163 163 163)",
                        }}
                      >
                        <div
                          className="h-full  bg-primary transition-all duration-500 ease-out"
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

        {/* Mobile: show current step name when stepper labels are hidden */}
        <p className="sm:hidden text-sm font-medium text-muted-foreground mt-1 mb-2 min-w-0" aria-live="polite">
          Step {step}: {["Basic Info", "Priority", "Behavior", "Details", "Review"][step - 1]}
        </p>

        {step === 1 && (
          <div key="step-1" className="animate-in fade-in-50 slide-in-from-right-4 duration-300">
            <BugReportStep1Basic
              title={title}
              description={description}
              errors={errors}
              onChangeTitle={(v) => { setTitle(v); if (errors.title) setErrors(prev => ({ ...prev, title: '' })) }}
              onChangeDescription={(v) => { setDescription(v); if (errors.description) setErrors(prev => ({ ...prev, description: '' })) }}
              canNext={canNextFromStep1}
              onNext={() => { if (validateStepWithErrors(1)) setStep(2) }}
              onCancel={() => setOpen(false)}
            />
          </div>
        )}

        {step === 2 && (
          <div key="step-2" className="animate-in fade-in-50 slide-in-from-right-4 duration-300">
            <BugReportStep2Priority
              priority={priority}
              visibility={visibility}
              errors={errors}
              onChangePriority={(v) => { setPriority(v); if (errors.priority) setErrors(prev => ({ ...prev, priority: '' })) }}
              onChangeVisibility={(v) => { setVisibility(v); if (errors.visibility) setErrors(prev => ({ ...prev, visibility: '' })) }}
              canNext={canNextFromStep2}
              onNext={() => { if (validateStepWithErrors(2)) setStep(3) }}
              onBack={() => setStep(1)}
              onCancel={() => setOpen(false)}
              hideVisibility={!!clusterId}
            />
          </div>
        )}

        {step === 3 && (
          <div key="step-3" className="animate-in fade-in-50 slide-in-from-right-4 duration-300">
            <BugReportStep3Behavior
              expectedBehavior={expectedBehavior}
              actualBehavior={actualBehavior}
              errors={errors}
              canNext={canNextFromStep3}
              onChangeExpected={(v) => { setExpectedBehavior(v); if (errors.expected_behavior) setErrors(prev => ({ ...prev, expected_behavior: '' })) }}
              onChangeActual={(v) => { setActualBehavior(v); if (errors.actual_behavior) setErrors(prev => ({ ...prev, actual_behavior: '' })) }}
              onNext={() => { if (validateStepWithErrors(3)) setStep(4) }}
              onBack={() => setStep(2)}
              onCancel={() => setOpen(false)}
            />
          </div>
        )}

        {step === 4 && (
          <div key="step-4" className="animate-in fade-in-50 slide-in-from-right-4 duration-300">
            <BugReportStep4Details
              stepsToReproduce={stepsToReproduce}
              tagsInput={tagsInput}
              sourcesInput={sourcesInput}
              attachments={attachments}
              environmentBrowser={environmentBrowser}
              environmentOs={environmentOs}
              environmentDevice={environmentDevice}
              environmentVersion={environmentVersion}
              errors={errors}
              onChangeSteps={(v) => { setStepsToReproduce(v); if (errors.steps_to_reproduce) setErrors(prev => ({ ...prev, steps_to_reproduce: '' })) }}
              onChangeTags={(v) => setTagsInput(v)}
              onChangeSources={(v) => setSourcesInput(v)}
              onChangeEnvironmentBrowser={(v) => setEnvironmentBrowser(v)}
              onChangeEnvironmentOs={(v) => setEnvironmentOs(v)}
              onChangeEnvironmentDevice={(v) => setEnvironmentDevice(v)}
              onChangeEnvironmentVersion={(v) => setEnvironmentVersion(v)}
              onUpload={handleFileUpload}
              onRemove={(id) => removeAttachment(id)}
              formatFileSize={formatFileSize}
              canNext={canNextFromStep4}
              onReview={() => { if (validateStepWithErrors(4)) setStep(5) }}
              onBack={() => setStep(3)}
              onCancel={() => setOpen(false)}
              aiTagValidity={aiTagValidity}
            />
          </div>
        )}

        {step === 5 && (
          <div key="step-5" className="animate-in fade-in-50 slide-in-from-right-4 duration-300">
            <BugReportStep5Review
              title={title}
              description={description}
              priority={priority}
              visibility={visibility}
              environmentBrowser={environmentBrowser}
              environmentOs={environmentOs}
              environmentDevice={environmentDevice}
              environmentVersion={environmentVersion}
              expectedBehavior={expectedBehavior}
              actualBehavior={actualBehavior}
              stepsToReproduce={stepsToReproduce}
              tagsInput={tagsInput}
              sourcesInput={sourcesInput}
              attachmentsCount={attachments.length}
              isSubmitting={isSubmitting}
              onBack={() => setStep(4)}
              onCancel={() => setOpen(false)}
              onSubmit={handleSubmit}
              hideVisibility={!!clusterId}
              aiTagValidity={aiTagValidity}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default BugReportDialog


