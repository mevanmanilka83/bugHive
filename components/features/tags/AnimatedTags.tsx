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
            <div className="flex min-h-12 w-full flex-wrap items-center gap-2 rounded-none border bg-background p-2">
            {selectedTag?.map((tag) => (
              <motion.div
                animate={
                  shouldReduceMotion
                    ? { opacity: 1 }
                    : { y: 0, opacity: 1, filter: "blur(0px)" }
                }
                className="group flex cursor-pointer flex-row items-center justify-center gap-2 !rounded-none border px-3 py-1.5 text-sm bg-muted text-foreground hover:bg-muted/70 hover:border-primary/50 transition-colors"
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
                <span className="font-medium">{tag}</span>
                <Badge variant="secondary" className="text-xs">
                  {counts[tag] ?? 0}
                </Badge>
                <CircleX
                  className="flex items-center justify-center rounded-full transition-all duration-200 opacity-70 group-hover:opacity-100"
                  size={14}
                />
              </motion.div>
            ))}
          </div>
        </AnimatePresence>
        </div>
      ) : null}

      <AnimatePresence>
        <div className="flex flex-wrap gap-3">
          {tags.map((tag) => (
            <motion.div
              animate={
                shouldReduceMotion
                  ? { opacity: 1 }
                  : { y: 0, opacity: 1, filter: "blur(0px)" }
              }
              className="group flex cursor-pointer flex-row items-center gap-2 !rounded-none border px-3 py-1.5 text-sm transition-colors hover:bg-muted hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
              <span className="font-medium">{tag}</span>
              <Badge variant="secondary" className="text-xs">
                {counts[tag] ?? 0}
              </Badge>
              <Plus
                className="flex items-center justify-center rounded-full transition-all duration-200 opacity-70 group-hover:opacity-100"
                size={14}
              />
            </motion.div>
          ))}
        </div>
      </AnimatePresence>
    </div>
  );
}

