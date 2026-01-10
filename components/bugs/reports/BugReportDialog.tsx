"use client"

import * as React from "react"
import { IconReport } from "@tabler/icons-react"
import { toast } from "sonner"
import { z } from "zod"
import { getBugReportSchema } from "@/lib"
import { type BugPayload, type BugDialogErrors, type BugFormData } from "@/lib"
import { createBugReport } from "@/app/actions/bug/bugReport"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import BugReportStep1Basic from "@/components/bugs/reports/BugReportStep1Basic"
import BugReportStep2Priority from "@/components/bugs/reports/BugReportStep2Priority"
import BugReportStep3Behavior from "@/components/bugs/reports/BugReportStep3Behavior"
import BugReportStep4Details from "@/components/bugs/reports/BugReportStep4Details"
import BugReportStep5Review from "@/components/bugs/reports/BugReportStep5Review"

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
  const [environmentOs, setEnvironmentOs] = React.useState("")
  const [environmentDevice, setEnvironmentDevice] = React.useState("")
  const [environmentVersion, setEnvironmentVersion] = React.useState("")
  const [expectedBehavior, setExpectedBehavior] = React.useState("")
  const [actualBehavior, setActualBehavior] = React.useState("")
  const [stepsToReproduce, setStepsToReproduce] = React.useState("")
  const [tagsInput, setTagsInput] = React.useState("")
  const [sourcesInput, setSourcesInput] = React.useState("")
  const [attachments, setAttachments] = React.useState<AttachmentFile[]>([])

  function resetForm() {
    setStep(1)
    setTitle("")
    setDescription("")
    setPriority("medium")
    setVisibility("public")
    setEnvironmentBrowser("")
    setEnvironmentOs("")
    setEnvironmentDevice("")
    setEnvironmentVersion("")
    setExpectedBehavior("")
    setActualBehavior("")
    setStepsToReproduce("")
    setTagsInput("")
    setSourcesInput("")
    setAttachments([])
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
    if (environmentOs) environmentParts.push(`OS: ${environmentOs}`)
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
      3: [], // Optional fields - no validation needed
      4: [], // Optional fields - no validation needed
      5: [] // Review step
    }

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

      toast.success("Bug report created successfully")
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

  if (!mounted) {
    return (
      <Button disabled>
        <IconReport className="size-4 mr-2" />
        Report Bug
      </Button>
    )
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm() }}>
      <DialogTrigger asChild>
        <Button>
          <IconReport className="size-4 mr-2" />
          Report Bug
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Report a bug</DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <div className={`font-medium ${step === 1 ? "text-foreground" : ""}`}>1. Basic Info</div>
          <Separator orientation="vertical" className="h-3" />
          <div className={`font-medium ${step === 2 ? "text-foreground" : ""}`}>2. Priority</div>
          <Separator orientation="vertical" className="h-3" />
          <div className={`font-medium ${step === 3 ? "text-foreground" : ""}`}>3. Behavior</div>
          <Separator orientation="vertical" className="h-3" />
          <div className={`font-medium ${step === 4 ? "text-foreground" : ""}`}>4. Details</div>
          <Separator orientation="vertical" className="h-3" />
          <div className={`font-medium ${step === 5 ? "text-foreground" : ""}`}>5. Review</div>
        </div>

        {step === 1 && (
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
        )}

        {step === 2 && (
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
        )}

        {step === 3 && (
          <BugReportStep3Behavior
            expectedBehavior={expectedBehavior}
            actualBehavior={actualBehavior}
            errors={errors}
            onChangeExpected={(v) => { setExpectedBehavior(v); if (errors.expected_behavior) setErrors(prev => ({ ...prev, expected_behavior: '' })) }}
            onChangeActual={(v) => { setActualBehavior(v); if (errors.actual_behavior) setErrors(prev => ({ ...prev, actual_behavior: '' })) }}
            onNext={() => setStep(4)}
            onBack={() => setStep(2)}
            onCancel={() => setOpen(false)}
          />
        )}

        {step === 4 && (
          <BugReportStep4Details
            stepsToReproduce={stepsToReproduce}
            tagsInput={tagsInput}
            sourcesInput={sourcesInput}
            attachments={attachments}
            environmentBrowser={environmentBrowser}
            environmentOs={environmentOs}
            environmentDevice={environmentDevice}
            environmentVersion={environmentVersion}
            onChangeSteps={(v) => setStepsToReproduce(v)}
            onChangeTags={(v) => setTagsInput(v)}
            onChangeSources={(v) => setSourcesInput(v)}
            onChangeEnvironmentBrowser={(v) => setEnvironmentBrowser(v)}
            onChangeEnvironmentOs={(v) => setEnvironmentOs(v)}
            onChangeEnvironmentDevice={(v) => setEnvironmentDevice(v)}
            onChangeEnvironmentVersion={(v) => setEnvironmentVersion(v)}
            onUpload={handleFileUpload}
            onRemove={(id) => removeAttachment(id)}
            formatFileSize={formatFileSize}
            onReview={() => setStep(5)}
            onBack={() => setStep(3)}
            onCancel={() => setOpen(false)}
          />
        )}

        {step === 5 && (
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
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

export default BugReportDialog


