"use client"

import * as React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig } from "@/components/ui/chart"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"

export function GraphDialog({
  open,
  onOpenChange,
  chartData,
  chartConfig,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  chartData: Array<{ date: string; count: number }>
  chartConfig: ChartConfig
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Bug submissions over time</DialogTitle>
        </DialogHeader>
        <ChartContainer config={chartConfig} className="aspect-auto h-[260px] w-full">
          <AreaChart data={chartData}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} minTickGap={24} />
            <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
            <Area dataKey="count" type="monotone" stroke="var(--color-count)" fill="var(--color-count)" fillOpacity={0.2} />
          </AreaChart>
        </ChartContainer>
      </DialogContent>
    </Dialog>
  )
}

export default GraphDialog


