"use client"

import * as React from "react"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { type SolutionDialogErrors } from "@/lib"

interface SolutionStep2TypeProps {
  solutionType: string
  priority: string
  status: string
  errors: SolutionDialogErrors
  onChangeSolutionType: (value: string) => void
  onChangePriority: (value: string) => void
  onChangeStatus: (value: string) => void
  canNext: boolean
  onNext: () => void
  onBack: () => void
  onCancel: () => void
}

export default function SolutionStep2Type({
  solutionType,
  priority,
  status,
  errors,
  onChangeSolutionType,
  onChangePriority,
  onChangeStatus,
  canNext,
  onNext,
  onBack,
  onCancel,
}: SolutionStep2TypeProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="solution-type">Solution Type <span className="text-red-500">*</span></Label>
        <Select value={solutionType} onValueChange={onChangeSolutionType}>
          <SelectTrigger className={errors.solution_type ? "border-red-500" : ""}>
            <SelectValue placeholder="Select solution type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="bug_fix">Bug Fix</SelectItem>
            <SelectItem value="feature_request">Feature Request</SelectItem>
            <SelectItem value="improvement">Improvement</SelectItem>
            <SelectItem value="documentation">Documentation</SelectItem>
            <SelectItem value="refactoring">Refactoring</SelectItem>
            <SelectItem value="performance">Performance Optimization</SelectItem>
          </SelectContent>
        </Select>
        {errors.solution_type && <p className="text-sm text-red-500">{errors.solution_type}</p>}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="priority">Priority</Label>
          <Select value={priority} onValueChange={onChangePriority}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="status">Status</Label>
          <Select value={status} onValueChange={onChangeStatus}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="ready_for_review">Ready for Review</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="testing">Testing</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
        <Button variant="outline" onClick={onBack} className="w-full rounded-full sm:w-auto">Back</Button>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:gap-2">
          <Button variant="outline" onClick={onCancel} className="w-full rounded-full sm:w-auto">Cancel</Button>
          <Button onClick={onNext} disabled={!canNext} className="w-full rounded-full sm:w-auto">Next</Button>
        </div>
      </div>
    </div>
  )
}
