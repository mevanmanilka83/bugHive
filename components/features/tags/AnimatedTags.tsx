"use client";

import { CircleX, Plus } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";

export interface AnimatedTagsProps {
  initialTags?: string[];
  selectedTags?: string[];
  onChange?: (selected: string[]) => void;
  counts?: Record<string, number>;
  onAddTag?: (tag: string) => void;
  showSelected?: boolean;
  className?: string;
}

export default function AnimatedTags({
  initialTags = ["react", "tailwindcss", "javascript"],
  selectedTags: controlledSelectedTags,
  onChange,
  counts = {},
  onAddTag,
  showSelected = true,
  className = "",
}: AnimatedTagsProps) {
  const [internalSelected, setInternalSelected] = useState<string[]>([]);
  const shouldReduceMotion = useReducedMotion();

  const selectedTag = controlledSelectedTags ?? internalSelected;
  const tags = initialTags.filter((tag) => !selectedTag.includes(tag));

  const handleTagClick = (tag: string) => {
    const newSelected = [...selectedTag, tag];
    if (onChange) onChange(newSelected);
    else setInternalSelected(newSelected);
    onAddTag?.(tag);
  };

  const handleDeleteTag = (tag: string) => {
    const newSelectedTag = selectedTag.filter((selected) => selected !== tag);
    if (onChange) onChange(newSelectedTag);
    else setInternalSelected(newSelectedTag);
  };

  return (
    <div className={`flex w-full flex-col gap-4 ${className}`}>
      {showSelected && selectedTag.length > 0 ? (
        <div className="flex flex-col items-start justify-center gap-2">
          <p className="text-sm font-medium text-muted-foreground">Selected</p>
          <AnimatePresence>
            <div className="grid w-full gap-2 rounded-none border bg-background p-2 [grid-template-columns:repeat(auto-fill,minmax(180px,1fr))]">
            {selectedTag?.map((tag) => (
              <motion.div
                animate={
                  shouldReduceMotion
                    ? { opacity: 1 }
                    : { y: 0, opacity: 1, filter: "blur(0px)" }
                }
                className="group flex h-10 cursor-pointer flex-row items-center justify-between gap-2 rounded-md border border-border/60 bg-muted/40 px-3 text-sm text-foreground hover:bg-muted/60 hover:border-primary/40 transition-colors"
                exit={
                  shouldReduceMotion
                    ? { opacity: 0, transition: { duration: 0 } }
                    : { y: 20, opacity: 0, filter: "blur(4px)" }
                }
                initial={
                  shouldReduceMotion
                    ? { opacity: 1 }
                    : { y: 20, opacity: 0, filter: "blur(4px)" }
                }
                key={tag}
                layout
                onClick={() => handleDeleteTag(tag)}
                transition={
                  shouldReduceMotion
                    ? { duration: 0 }
                    : { duration: 0.25, bounce: 0, type: "spring" }
                }
              >
                <div className="flex min-w-0 items-center gap-2">
                  <span className="font-medium truncate">{tag}</span>
                  <Badge variant="secondary" className="text-xs tabular-nums">
                    {counts[tag] ?? 0}
                  </Badge>
                </div>
                <CircleX
                  className="shrink-0 flex items-center justify-center rounded-full transition-all duration-200 opacity-70 group-hover:opacity-100"
                  size={14}
                />
              </motion.div>
            ))}
          </div>
        </AnimatePresence>
        </div>
      ) : null}

      <AnimatePresence>
        <div className="grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(180px,1fr))]">
          {tags.map((tag) => (
            <motion.div
              animate={
                shouldReduceMotion
                  ? { opacity: 1 }
                  : { y: 0, opacity: 1, filter: "blur(0px)" }
              }
              className="group flex h-10 cursor-pointer flex-row items-center justify-between gap-2 rounded-md border border-border/60 bg-background px-3 text-sm transition-colors hover:bg-muted/40 hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              exit={
                shouldReduceMotion
                  ? { opacity: 0, transition: { duration: 0 } }
                  : { y: -20, opacity: 0, filter: "blur(4px)" }
              }
              initial={
                shouldReduceMotion
                  ? { opacity: 1 }
                  : { y: -20, opacity: 0, filter: "blur(4px)" }
              }
              key={tag}
              layout
              onClick={() => handleTagClick(tag)}
              transition={
                shouldReduceMotion
                  ? { duration: 0 }
                  : { duration: 0.25, bounce: 0, type: "spring" }
              }
            >
              <div className="flex min-w-0 items-center gap-2">
                <span className="font-medium truncate">{tag}</span>
                <Badge variant="secondary" className="text-xs tabular-nums">
                  {counts[tag] ?? 0}
                </Badge>
              </div>
              <Plus
                className="shrink-0 flex items-center justify-center rounded-full transition-all duration-200 opacity-70 group-hover:opacity-100"
                size={14}
              />
            </motion.div>
          ))}
        </div>
      </AnimatePresence>
    </div>
  );
}

