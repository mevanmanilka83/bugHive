"use client"

import * as React from "react"
import { z } from "zod"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { createBugSolution } from "@/app/actions/bug/BugSolution"
import { toast } from "sonner"
import { IconBulb } from "@tabler/icons-react"
import { getBugSolutionSchema } from "@/lib"
import { type SolutionPayload, type SolutionDialogErrors, type SolutionFormData } from "@/lib"
import SolutionStep1Basic from "./SolutionStep1Basic"
import SolutionStep2Type from "./SolutionStep2Type"
import SolutionStep3Details from "./SolutionStep3Details"
import SolutionStep4Review from "./SolutionStep4Review"

type AttachmentFile = {
  file: File
  id: string
  preview?: string
}

// Using shared schema and type from schema module
const solutionSchema = getBugSolutionSchema()

export function SolutionDialog({
  open,
  onOpenChange,
  solutions,
  solutionsLoading,
  onSubmit,
  isSubmitting = false,
  errors = {},
  bugData,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  solutions: Array<{ id: string; title?: string | null; content: string; links?: string[] | null; created_at: string }>
  solutionsLoading: boolean
  onSubmit?: (data: SolutionFormData) => void
  isSubmitting?: boolean
  errors?: SolutionDialogErrors
  bugData?: {
    id: string
    title: string
    description?: string
    priority?: string
    status?: string
  }
}) {
  const [step, setStep] = React.useState<1 | 2 | 3 | 4>(1)
  const [formData, setFormData] = React.useState<SolutionFormData>({
    title: "",
    description: "",
    solution_type: "",
    priority: "medium",
    status: "draft",
    assignee: "",
    estimated_hours: "",
    links: "",
    attachments: [],
  })
  const [attachments, setAttachments] = React.useState<AttachmentFile[]>([])
  const [submitting, setSubmitting] = React.useState(false)

  function getPayload(): SolutionPayload {
    const linksArray = formData.links ? formData.links.split(',').map(s => s.trim()).filter(Boolean) : undefined

    return {
      title: formData.title,
      description: formData.description,
      solution_type: formData.solution_type as "bug_fix" | "feature_request" | "improvement" | "documentation" | "refactoring" | "performance",
      priority: formData.priority as "low" | "medium" | "high" | "critical",
      status: formData.status as "draft" | "ready_for_review" | "in_progress" | "testing" | "completed",
      assignee: formData.assignee || undefined,
      estimated_hours: formData.estimated_hours || undefined,
      links: formData.links || undefined,
      attachments: attachments.map(att => att.file),
    }
  }

  // Step field definitions for validation
    const stepFields: Record<number, (keyof SolutionPayload)[]> = {
      1: ['title', 'description'], // Required fields
      2: ['solution_type', 'priority', 'status'], // Required fields
      3: [], // Optional fields - no validation needed
      4: [] // Review step
    }

  function validateStep(stepNumber: number): boolean {
    const payload = getPayload()
    const fieldsToValidate = stepFields[stepNumber] || []
    
    if (fieldsToValidate.length === 0) return true
    
    try {
      const stepPayload = Object.fromEntries(
        fieldsToValidate.map(field => [field, payload[field]])
      )
      const partialSchema = solutionSchema.pick(
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
      const partialSchema = solutionSchema.pick(
        Object.fromEntries(fieldsToValidate.map(field => [field, true])) as any
      )
      partialSchema.parse(stepPayload)
      return true
    } catch (error) {
      return false
    }
  }

  function validateAll(): boolean {
    const payload = getPayload()
    
    try {
      solutionSchema.parse(payload)
      return true
    } catch (error) {
      return false
    }
  }

  // Reset form when dialog opens/closes
  React.useEffect(() => {
    if (open) {
      setStep(1)
      setFormData({
        title: "",
        description: "",
        solution_type: "",
        priority: "medium",
        status: "draft",
        assignee: "",
        estimated_hours: "",
        links: "",
        attachments: [],
      })
      setAttachments([])
    }
  }, [open])

  const handleSubmitWrapper = async () => {
    if (!bugData?.id) {
      toast.error("Missing bug id")
      return
    }

    // Check if bug is closed or resolved
    if (isBugClosedOrResolved) {
      toast.error("Cannot submit solutions to closed or resolved bugs")
      return
    }

    // Validate form data before submission
    if (!formData.title.trim()) {
      toast.error("Title is required")
      return
    }
    if (!formData.description.trim()) {
      toast.error("Description is required")
      return
    }
    if (!formData.solution_type) {
      toast.error("Solution type is required")
      return
    }

    // Check if a solution with the same title already exists
    const existingSolution = solutions.find(
      (sol) => sol.title?.toLowerCase().trim() === formData.title.toLowerCase().trim()
    )
    if (existingSolution) {
      toast.error("A solution with this title already exists. Please use a different title.")
      return
    }

    try {
      setSubmitting(true)

      const fd = new FormData()
      fd.set("title", formData.title)
      fd.set("description", formData.description)
      fd.set("solution_type", formData.solution_type)
      fd.set("priority", formData.priority)
      fd.set("status", formData.status)
      if (formData.assignee) fd.set("assignee", formData.assignee)
      if (formData.estimated_hours) fd.set("estimated_hours", formData.estimated_hours)
      // Send links as comma-separated string for validation (validation expects string, not JSON array)
      if (formData.links?.trim()) fd.set("links", formData.links.trim())
      attachments.forEach((att, idx) => {
        fd.append(`attachment_${idx}`, att.file)
      })

      // Use server action instead of fetch
      const result = await createBugSolution(fd, bugData.id)

      if (!result.success) {
        throw new Error(result.error || "Failed to save solution")
      }

      // Dispatch event to notify other components (like charts) to refresh
      if (typeof window !== 'undefined' && result.solution) {
        window.dispatchEvent(new CustomEvent('solution:created', { detail: { solution: result.solution, bugId: bugData.id } }))
      }

      toast.success("Solution submitted")
      onOpenChange(false)
    } catch (err: any) {
      toast.error(err?.message || "Something went wrong")
    } finally {
      setSubmitting(false)
    }
  }

  const handleInputChange = (field: keyof SolutionFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const files = event.target.files
    if (!files) return

    const newAttachments: AttachmentFile[] = []
    
    Array.from(files).forEach((file) => {
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`File ${file.name} is too large. Maximum size is 10MB.`)
        return
      }

      // Validate file type
      const allowedTypes = [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp',
        'text/plain', 'text/csv', 'application/json',
        'application/pdf', 'application/zip'
      ]
      
      if (!allowedTypes.includes(file.type)) {
        toast.error(`File type ${file.type} is not supported.`)
        return
      }

      // Check total attachment count
      if (attachments.length + newAttachments.length >= 5) {
        toast.error("Maximum 5 attachments allowed")
        return
      }

      const id = Math.random().toString(36).substr(2, 9)
      let preview: string | undefined

      // Create preview for images
      if (file.type.startsWith('image/')) {
        preview = URL.createObjectURL(file)
      }

      newAttachments.push({
        file,
        id,
        preview
      })
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

  const canNextFromStep1 = React.useMemo(() => validateStep(1), [formData.title, formData.description, errors])
  const canNextFromStep2 = React.useMemo(() => validateStep(2), [formData.solution_type, formData.priority, formData.status, errors])

  // Check if bug is closed or resolved
  const isBugClosedOrResolved = React.useMemo(() => {
    const status = bugData?.status?.toLowerCase()
    return status === 'closed' || status === 'resolved'
  }, [bugData?.status])

  // Prevent dialog from opening if bug is closed or resolved
  React.useEffect(() => {
    if (open && isBugClosedOrResolved) {
      toast.error("Cannot add solutions to closed or resolved bugs")
      onOpenChange(false)
    }
  }, [open, isBugClosedOrResolved, onOpenChange])

  return (
    <Dialog open={open && !isBugClosedOrResolved} onOpenChange={(newOpen) => {
      if (isBugClosedOrResolved && newOpen) {
        toast.error("Cannot add solutions to closed or resolved bugs")
        return
      }
      onOpenChange(newOpen)
    }}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <IconBulb className="size-5" />
            Submit Solution
          </DialogTitle>
          <DialogDescription>
            Provide solution details and optional attachments, then review and submit.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-6">
          {/* Bug Information Card */}
          {bugData && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Related Bug</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{bugData.title}</span>
                  <Badge variant="outline" className="text-xs">
                    {bugData.priority || "medium"}
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    {bugData.status || "open"}
                  </Badge>
                </div>
                {bugData.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {bugData.description}
                  </p>
                )}
                {isBugClosedOrResolved && (
                  <div className="mt-2 p-2 bg-destructive/10 border border-destructive/20 rounded-md">
                    <p className="text-sm text-destructive font-medium">
                      This bug is {bugData.status}. Solutions cannot be added to closed or resolved bugs.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Step Progress */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className={`font-medium ${step === 1 ? "text-foreground" : ""}`}>1. Basic Info</div>
            <Separator orientation="vertical" className="h-3" />
            <div className={`font-medium ${step === 2 ? "text-foreground" : ""}`}>2. Solution Type</div>
            <Separator orientation="vertical" className="h-3" />
            <div className={`font-medium ${step === 3 ? "text-foreground" : ""}`}>3. Details</div>
            <Separator orientation="vertical" className="h-3" />
            <div className={`font-medium ${step === 4 ? "text-foreground" : ""}`}>4. Review</div>
          </div>

          {/* Step 1: Basic Information */}
          {step === 1 && (
            <SolutionStep1Basic
              title={formData.title}
              description={formData.description}
              errors={errors}
              onChangeTitle={(value) => !isBugClosedOrResolved && handleInputChange("title", value)}
              onChangeDescription={(value) => !isBugClosedOrResolved && handleInputChange("description", value)}
              canNext={canNextFromStep1 && !isBugClosedOrResolved}
              onNext={() => { if (!isBugClosedOrResolved && validateStepWithErrors(1)) setStep(2) }}
              onCancel={() => onOpenChange(false)}
            />
          )}

          {/* Step 2: Solution Type & Priority */}
          {step === 2 && (
            <SolutionStep2Type
              solutionType={formData.solution_type}
              priority={formData.priority}
              status={formData.status}
              errors={errors}
              onChangeSolutionType={(value) => !isBugClosedOrResolved && handleInputChange("solution_type", value)}
              onChangePriority={(value) => !isBugClosedOrResolved && handleInputChange("priority", value)}
              onChangeStatus={(value) => !isBugClosedOrResolved && handleInputChange("status", value)}
              canNext={canNextFromStep2 && !isBugClosedOrResolved}
              onNext={() => { if (!isBugClosedOrResolved && validateStepWithErrors(2)) setStep(3) }}
              onBack={() => setStep(1)}
              onCancel={() => onOpenChange(false)}
            />
          )}

          {/* Step 3: Additional Details & Attachments */}
          {step === 3 && (
            <SolutionStep3Details
              assignee={formData.assignee}
              estimatedHours={formData.estimated_hours}
              links={formData.links}
              attachments={attachments}
              errors={errors}
              onChangeAssignee={(value) => !isBugClosedOrResolved && handleInputChange("assignee", value)}
              onChangeEstimatedHours={(value) => !isBugClosedOrResolved && handleInputChange("estimated_hours", value)}
              onChangeLinks={(value) => !isBugClosedOrResolved && handleInputChange("links", value)}
              onUpload={isBugClosedOrResolved ? () => {} : handleFileUpload}
              onRemoveAttachment={isBugClosedOrResolved ? () => {} : removeAttachment}
              formatFileSize={formatFileSize}
              onNext={() => !isBugClosedOrResolved && setStep(4)}
              onBack={() => setStep(2)}
              onCancel={() => onOpenChange(false)}
            />
          )}

          {/* Step 4: Review & Submit */}
          {step === 4 && (
            <SolutionStep4Review
              title={formData.title}
              description={formData.description}
              solutionType={formData.solution_type}
              priority={formData.priority}
              status={formData.status}
              assignee={formData.assignee}
              estimatedHours={formData.estimated_hours}
              links={formData.links}
              attachmentsCount={attachments.length}
              isSubmitting={isSubmitting || submitting || isBugClosedOrResolved}
              onSubmit={isBugClosedOrResolved ? () => {} : handleSubmitWrapper}
              onBack={() => setStep(3)}
              onCancel={() => onOpenChange(false)}
            />
          )}

          <Separator />

          {/* Existing Solutions */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground">Existing Solutions</h3>
            {solutionsLoading ? (
              <div className="text-muted-foreground text-sm">Loading solutions...</div>
            ) : (
              <>
                {solutions.length === 0 ? (
                  <div className="text-muted-foreground text-sm">No solutions submitted yet.</div>
                ) : (
                  <div className="space-y-3">
                    {solutions.map((solution) => (
                      <Card key={solution.id} className="border-l-4 border-l-blue-500">
                        <CardContent className="pt-4">
                          <div className="space-y-2">
                            <div className="flex items-start justify-between">
                              <h4 className="font-medium text-sm">{solution.title || "Untitled Solution"}</h4>
                              <span className="text-xs text-muted-foreground">
                                {new Date(solution.created_at).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap line-clamp-3">
                              {solution.content}
                            </p>
                            {Array.isArray(solution.links) && solution.links.length > 0 && (
                              <div className="flex flex-wrap gap-2">
                                {solution.links.map((link, i) => (
                                  <a
                                    key={i}
                                    href={link}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-xs text-blue-600 hover:underline break-all"
                                  >
                                    {link}
                                  </a>
                                ))}
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default SolutionDialog


