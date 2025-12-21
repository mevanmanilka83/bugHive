"use client"

import { type BugDialogErrors } from "@/lib/schemas/types/bugReport"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

type Props = {
  expectedBehavior: string
  actualBehavior: string
  errors: BugDialogErrors
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
  onChangeExpected,
  onChangeActual,
  onNext,
  onBack,
  onCancel,
}: Props) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="bug-expected">Expected Behavior</Label>
        <Textarea
          id="bug-expected"
          placeholder="What should happen?"
          value={expectedBehavior}
          onChange={(e) => onChangeExpected(e.target.value)}
          rows={3}
          className={errors.expected_behavior ? "border-red-500" : ""}
        />
        {errors.expected_behavior && <p className="text-sm text-red-500">{errors.expected_behavior}</p>}
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="bug-actual">Actual Behavior</Label>
        <Textarea
          id="bug-actual"
          placeholder="What actually happens?"
          value={actualBehavior}
          onChange={(e) => onChangeActual(e.target.value)}
          rows={3}
          className={errors.actual_behavior ? "border-red-500" : ""}
        />
        {errors.actual_behavior && <p className="text-sm text-red-500">{errors.actual_behavior}</p>}
      </div>
      <div className="flex justify-between">
        <Button variant="ghost" onClick={onBack}>Back</Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button onClick={onNext}>Next</Button>
        </div>
      </div>
    </div>
  )
}

export default BugReportStep3Behavior



