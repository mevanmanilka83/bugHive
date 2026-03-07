"use client"

import * as React from "react"
import type { BugDialogErrors } from "@/lib/schemas/types"
import { ArrowLeftIcon } from "@/components/ui/arrow-left"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

type Props = {
  expectedBehavior: string
  actualBehavior: string
  errors: BugDialogErrors
  canNext?: boolean
  onChangeExpected: (value: string) => void
  onChangeActual: (value: string) => void
  onNext: () => void
  onBack: () => void
  onCancel: () => void
}

export function BugReportStep3Behavior({
  expectedBehavior,
  actualBehavior,
  errors,
  canNext = true,
  onChangeExpected,
  onChangeActual,
  onNext,
  onBack,
  onCancel,
}: Props) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="bug-expected">
          Expected Behavior <span className="text-red-500">*</span>
        </Label>
        <Textarea
          id="bug-expected"
          placeholder="What should happen?"
          value={expectedBehavior}
          onChange={(e) => onChangeExpected(e.target.value)}
          autoComplete="on"
          autoCorrect="on"
          spellCheck
          rows={3}
          className={errors.expected_behavior ? "border-red-500" : ""}
        />
        {errors.expected_behavior && <p className="text-sm text-red-500">{errors.expected_behavior}</p>}
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="bug-actual">
          Actual Behavior <span className="text-red-500">*</span>
        </Label>
        <Textarea
          id="bug-actual"
          placeholder="What actually happens?"
          value={actualBehavior}
          onChange={(e) => onChangeActual(e.target.value)}
          autoComplete="on"
          autoCorrect="on"
          spellCheck
          rows={3}
          className={errors.actual_behavior ? "border-red-500" : ""}
        />
        {errors.actual_behavior && <p className="text-sm text-red-500">{errors.actual_behavior}</p>}
      </div>
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
        <Button onClick={onBack} className="w-full px-4 sm:w-auto"><ArrowLeftIcon size={16} className="size-4 mr-2" />Back</Button>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:gap-2">
          <Button  onClick={onCancel} className="w-full px-4 sm:w-auto">Cancel</Button>
          <Button onClick={onNext} disabled={!canNext} className="w-full px-4 sm:w-auto">Next</Button>
        </div>
      </div>
    </div>
  )
}

export default BugReportStep3Behavior



