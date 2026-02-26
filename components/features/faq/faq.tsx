"use client"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { cn } from "@/lib/utils-client"

export type FaqItem = {
  question: string
  answer: string
}

type FAQProps = {
  faqItems: FaqItem[]
  className?: string
}

function FAQComponent({ faqItems, className }: FAQProps) {
  return (
    <Accordion type="single" collapsible className={cn("w-full", className)}>
      {faqItems.map((item, index) => (
        <AccordionItem key={index} value={`faq-${index}`}>
          <AccordionTrigger className="text-left">
            {item.question}
          </AccordionTrigger>
          <AccordionContent className="text-muted-foreground">
            {item.answer}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  )
}

export { FAQComponent as FAQ }
export default FAQComponent
