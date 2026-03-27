"use client"

import * as React from "react"
import { $createTextNode, $getSelection, $isRangeSelection, $setSelection, type RangeSelection } from "lexical"
import { $createLinkNode, TOGGLE_LINK_COMMAND } from "@lexical/link"
import {
  createEditorSystem,
  boldExtension,
  italicExtension,
  underlineExtension,
  strikethroughExtension,
  codeFormatExtension,
  linkExtension,
  blockFormatExtension,
  listExtension,
  historyExtension,
  htmlExtension,
  RichText,
} from "@lexkit/editor"

// Do NOT include richTextExtension: it would add a second editable + "Start writing...". We use <RichText /> only.
const extensions = [
  boldExtension,
  italicExtension,
  underlineExtension,
  strikethroughExtension,
  codeFormatExtension,
  linkExtension,
  blockFormatExtension,
  listExtension,
  historyExtension,
  htmlExtension,
] as const

const { Provider, useEditor } = createEditorSystem<typeof extensions>()

function stripEmptyParagraphs(html: string): string {
  const trimmed = html.trim()
  if (trimmed === "" || trimmed === "<p></p>" || trimmed === "<p><br></p>") return ""
  return html
}

function ensureBlockHtml(html: string): string {
  const trimmed = html.trim()
  if (trimmed === "") return ""
  const hasBlockTag = /<(p|div|h1|h2|h3|h4|h5|h6|ul|ol|li|blockquote|pre|table|section|article)[\s>]/i.test(trimmed)
  if (hasBlockTag) return html
  return `<p>${trimmed}</p>`
}

function EditorContent({
  value,
  onChange,
}: {
  value: string
  onChange: (html: string) => void
}) {
  const { commands, listeners } = useEditor()
  const lastEmittedRef = React.useRef<string>(value)
  const initialSync = React.useRef(false)
  const hasHydratedRef = React.useRef(false)

  // Sync initial value into editor (and when parent resets the form)
  React.useEffect(() => {
    const normalized = ensureBlockHtml(stripEmptyParagraphs(value))
    if (!hasHydratedRef.current) {
      if (normalized === "") {
        lastEmittedRef.current = ""
        hasHydratedRef.current = true
        return
      }
      if (commands.importFromHTML) {
        initialSync.current = true
        commands.importFromHTML(normalized || "<p></p>", { preventFocus: true }).then(() => {
          lastEmittedRef.current = normalized
          initialSync.current = false
          hasHydratedRef.current = true
        })
      }
      return
    }
    if (normalized === "" && lastEmittedRef.current === "") return
    if (normalized === lastEmittedRef.current) return
    initialSync.current = true
    // Use htmlExtension commands if available
    if (commands.importFromHTML) {
      commands.importFromHTML(normalized || "<p></p>", { preventFocus: true }).then(() => {
        lastEmittedRef.current = normalized
        initialSync.current = false
      })
    } else {
      initialSync.current = false
    }
  }, [value, commands])

  // On editor update, export HTML and notify parent
  React.useEffect(() => {
    const unregister = listeners?.registerUpdate?.(() => {
      if (initialSync.current) return
      // Prefer htmlExtension export command if available
      if (commands.exportToHTML) {
        const html = commands.exportToHTML()
        const out = stripEmptyParagraphs(html ?? "")
        lastEmittedRef.current = out
        onChange(out)
      }
    })
    return () => unregister?.()
  }, [listeners, commands, onChange])

  return null
}

const BLOCK_OPTIONS: { value: "p" | "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "quote"; label: string }[] = [
  { value: "p", label: "Paragraph" },
  { value: "h1", label: "Heading 1" },
  { value: "h2", label: "Heading 2" },
  { value: "h3", label: "Heading 3" },
  { value: "h4", label: "Heading 4" },
  { value: "h5", label: "Heading 5" },
  { value: "h6", label: "Heading 6" },
  { value: "quote", label: "Quote" },
]

function Toolbar({ hasError }: { hasError?: boolean }) {
  const { commands, activeStates, editor } = useEditor()
  const [blockOpen, setBlockOpen] = React.useState(false)
  const [linkOpen, setLinkOpen] = React.useState(false)
  const [linkUrl, setLinkUrl] = React.useState("https://ui.shadcn.com/docs")
  const linkSelectionRef = React.useRef<RangeSelection | null>(null)

  const currentBlock =
    activeStates?.isQuote ? "quote" :
      activeStates?.isH1 ? "h1" : activeStates?.isH2 ? "h2" : activeStates?.isH3 ? "h3" :
        activeStates?.isH4 ? "h4" : activeStates?.isH5 ? "h5" : activeStates?.isH6 ? "h6" : "p"

  const applyBlock = (value: (typeof BLOCK_OPTIONS)[number]["value"]) => {
    if (!editor) return

    setBlockOpen(false)

    // Focus the editor root element to ensure commands work
    const rootElement = editor.getRootElement()
    if (rootElement) {
      rootElement.focus()
    } else {
      editor.focus()
    }

    // Small delay to ensure focus is set before applying format
    setTimeout(() => {
      // Apply the block format command
      // Try toggleBlockFormat first (more direct), fallback to specific commands
      if (commands.toggleBlockFormat) {
        commands.toggleBlockFormat(value as "p" | "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "quote")
      } else {
        // Fallback to specific commands if toggleBlockFormat isn't available
        if (value === "p") {
          commands.toggleParagraph?.()
        } else if (value === "quote") {
          commands.toggleQuote?.()
        } else if (value.startsWith("h")) {
          const headingTag = value as "h1" | "h2" | "h3" | "h4" | "h5" | "h6"
          commands.toggleHeading?.(headingTag)
        }
      }
    }, 10)
  }

  const openLinkCard = () => {
    if (editor) {
      editor.getEditorState().read(() => {
        const selection = $getSelection()
        linkSelectionRef.current = $isRangeSelection(selection) ? selection.clone() : null
      })
    }
    setLinkUrl("https://ui.shadcn.com/docs")
    setLinkOpen(true)
  }

  const insertLink = () => {
    if (!editor) return
    const url = linkUrl.trim()
    if (!url) return

    setLinkOpen(false)

    const rootElement = editor.getRootElement()
    if (rootElement) {
      rootElement.focus()
    } else {
      editor.focus()
    }

    setTimeout(() => {
      editor.update(() => {
        if (linkSelectionRef.current) {
          $setSelection(linkSelectionRef.current)
          linkSelectionRef.current = null
        }
        const selection = $getSelection()
        if (!$isRangeSelection(selection)) return

        if (!selection.isCollapsed()) {
          editor.dispatchCommand(TOGGLE_LINK_COMMAND, url)
          return
        }

        const linkNode = $createLinkNode(url)
        linkNode.append($createTextNode(url))
        const spaceNode = $createTextNode(" ")
        selection.insertNodes([linkNode, spaceNode])
        const offset = spaceNode.getTextContentSize()
        selection.setTextNodeRange(spaceNode, offset, spaceNode, offset)
      })
    }, 10)
  }

  const clearFormatting = () => {
    ; (["bold", "italic", "underline", "strikethrough", "code"] as const).forEach((fmt) => {
      commands.formatText?.(fmt, false)
    })
    commands.removeLink?.()
  }

  return (
    <div
      className={`flex flex-wrap items-center gap-0.5 border-b bg-muted/40 px-2 py-1.5 ${hasError ? "border-red-500" : "border-border"}`}
      role="toolbar"
    >
      {/* Block type */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setBlockOpen((o) => !o)}
          className="rounded-none border border-input bg-background px-2.5 py-1 text-sm hover:bg-muted"
          title="Text type"
          aria-expanded={blockOpen}
        >
          {BLOCK_OPTIONS.find((o) => o.value === currentBlock)?.label ?? "Paragraph"}
        </button>
        {blockOpen && (
          <>
            <div className="fixed inset-0 z-10" aria-hidden onClick={() => setBlockOpen(false)} />
            <div className="absolute left-0 top-full z-20 mt-0.5 min-w-[140px] rounded-none border border-input bg-popover py-1 shadow-md">
              {BLOCK_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => applyBlock(opt.value)}
                  className={`w-full px-3 py-1.5 text-left text-sm hover:bg-muted ${currentBlock === opt.value ? "bg-muted font-medium" : ""}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
      <span className="mx-1 h-4 w-px bg-border" aria-hidden />
      {/* Bold, Italic, Underline, Strikethrough, Code */}
      <button
        type="button"
        onClick={() => commands.toggleBold?.()}
        className={`rounded-none p-1.5 hover:bg-muted ${activeStates?.bold ? "bg-muted font-bold" : ""}`}
        title="Bold"
        aria-pressed={!!activeStates?.bold}
      >
        <span className="text-sm font-bold">B</span>
      </button>
      <button
        type="button"
        onClick={() => commands.toggleItalic?.()}
        className={`rounded-none p-1.5 hover:bg-muted italic ${activeStates?.italic ? "bg-muted" : ""}`}
        title="Italic"
        aria-pressed={!!activeStates?.italic}
      >
        <span className="text-sm italic">I</span>
      </button>
      <button
        type="button"
        onClick={() => commands.toggleUnderline?.()}
        className={`rounded-none p-1.5 hover:bg-muted ${activeStates?.underline ? "bg-muted underline" : ""}`}
        title="Underline"
        aria-pressed={!!activeStates?.underline}
      >
        <span className="text-sm underline">U</span>
      </button>
      <button
        type="button"
        onClick={() => commands.toggleStrikethrough?.()}
        className={`rounded-none p-1.5 hover:bg-muted ${activeStates?.strikethrough ? "bg-muted line-through" : ""}`}
        title="Strikethrough"
        aria-pressed={!!activeStates?.strikethrough}
      >
        <span className="text-sm line-through">S</span>
      </button>
      <button
        type="button"
        onClick={() => commands.toggleCode?.()}
        className={`rounded-none p-1.5 font-mono text-sm hover:bg-muted ${activeStates?.code ? "bg-muted" : ""}`}
        title="Inline code"
        aria-pressed={!!activeStates?.code}
      >
        &lt; &gt;
      </button>
      <span className="mx-1 h-4 w-px bg-border" aria-hidden />
      {/* Link */}
      <button
        type="button"
        onClick={() => (linkOpen ? setLinkOpen(false) : openLinkCard())}
        className={`rounded-none p-1.5 hover:bg-muted ${activeStates?.isLink ? "bg-muted" : ""}`}
        title="Link"
        aria-pressed={!!activeStates?.isLink}
        aria-expanded={linkOpen}
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
      </button>
      {linkOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/40" aria-hidden onClick={() => setLinkOpen(false)} />
          <div className="fixed left-1/2 top-1/2 z-50 w-[320px] -translate-x-1/2 -translate-y-1/2 rounded-none border border-input bg-popover p-4 shadow-lg">
            <div className="space-y-2">
              <label className="block text-xs font-medium text-muted-foreground" htmlFor="rte-link-url">
                URL
              </label>
              <input
                id="rte-link-url"
                type="url"
                value={linkUrl}
                onChange={(event) => setLinkUrl(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") insertLink()
                  if (event.key === "Escape") setLinkOpen(false)
                }}
                className="h-9 w-full rounded-none border border-input bg-background px-2 text-sm"
                autoFocus
              />
            </div>
            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setLinkOpen(false)}
                className="rounded-none border border-input px-2.5 py-1 text-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={insertLink}
                className="rounded-none bg-primary px-2.5 py-1 text-sm text-primary-foreground"
              >
                Insert
              </button>
            </div>
          </div>
        </>
      )}
      <span className="mx-1 h-4 w-px bg-border" aria-hidden />
      {/* Lists */}
      <button
        type="button"
        onClick={() => commands.toggleUnorderedList?.()}
        className={`rounded-none p-1.5 hover:bg-muted ${activeStates?.unorderedList ? "bg-muted" : ""}`}
        title="Bullet list"
        aria-pressed={!!activeStates?.unorderedList}
      >
        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
          <circle cx="5" cy="6" r="1.5" />
          <circle cx="5" cy="12" r="1.5" />
          <circle cx="5" cy="18" r="1.5" />
          <path d="M10 6h10M10 12h10M10 18h10" stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
        </svg>
      </button>
      <button
        type="button"
        onClick={() => commands.toggleOrderedList?.()}
        className={`rounded-none p-1.5 hover:bg-muted ${activeStates?.orderedList ? "bg-muted" : ""}`}
        title="Numbered list"
        aria-pressed={!!activeStates?.orderedList}
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path d="M10 6h10M10 12h10M10 18h10" strokeLinecap="round" />
          <path d="M4 6h1v1M4 12v-1h2v2M4 18v-1h2v1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <span className="mx-1 h-4 w-px bg-border" aria-hidden />
      {/* Undo, Redo */}
      <button
        type="button"
        onClick={() => commands.undo?.()}
        className="rounded-none p-1.5 hover:bg-muted"
        title="Undo"
        aria-label="Undo"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6-6m-6 6l6 6" />
        </svg>
      </button>
      <button
        type="button"
        onClick={() => commands.redo?.()}
        className="rounded-none p-1.5 hover:bg-muted"
        title="Redo"
        aria-label="Redo"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6-6m6 6l-6 6" />
        </svg>
      </button>
      <span className="mx-1 h-4 w-px bg-border" aria-hidden />
      {/* Clear formatting */}
      <button
        type="button"
        onClick={clearFormatting}
        className="rounded-none px-2 py-1.5 text-sm hover:bg-muted"
        title="Clear formatting"
      >
        Clear formatting
      </button>
    </div>
  )
}

export type RichTextEditorProps = {
  value: string
  onChange: (html: string) => void
  placeholder?: string
  className?: string
  hasError?: boolean
  minHeight?: string
  maxHeight?: string
  /**
   * Toolbar complexity:
   * - "full": formatting + block/list/link/history controls (default)
   * - "minimal": compact controls intended for short comments (bold/italic/link + clear)
   * - "none": no toolbar
   */
  toolbar?: "full" | "minimal" | "none"
}

function MinimalToolbar({ hasError }: { hasError?: boolean }) {
  const { commands, activeStates } = useEditor()

  const clearFormatting = () => {
    ;(["bold", "italic", "underline", "strikethrough", "code"] as const).forEach((fmt) => {
      commands.formatText?.(fmt, false)
    })
    commands.removeLink?.()
  }

  return (
    <div
      className={`flex flex-wrap items-center gap-0.5 border-b bg-muted/40 px-2 py-1.5 ${hasError ? "border-red-500" : "border-border"}`}
      role="toolbar"
    >
      <button
        type="button"
        onClick={() => commands.toggleBold?.()}
        className={`rounded-none p-1.5 hover:bg-muted ${activeStates?.bold ? "bg-muted font-bold" : ""}`}
        title="Bold"
        aria-pressed={!!activeStates?.bold}
      >
        <span className="text-sm font-bold">B</span>
      </button>
      <button
        type="button"
        onClick={() => commands.toggleItalic?.()}
        className={`rounded-none p-1.5 hover:bg-muted italic ${activeStates?.italic ? "bg-muted" : ""}`}
        title="Italic"
        aria-pressed={!!activeStates?.italic}
      >
        <span className="text-sm italic">I</span>
      </button>
      <span className="mx-1 h-4 w-px bg-border" aria-hidden />
      <button
        type="button"
        onClick={() => commands.removeLink?.()}
        className="rounded-none px-2 py-1.5 text-sm hover:bg-muted"
        title="Remove link"
      >
        Unlink
      </button>
      <span className="mx-1 h-4 w-px bg-border" aria-hidden />
      <button
        type="button"
        onClick={clearFormatting}
        className="rounded-none px-2 py-1.5 text-sm hover:bg-muted"
        title="Clear formatting"
      >
        Clear
      </button>
    </div>
  )
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Write here…",
  className = "",
  hasError,
  minHeight = "120px",
  maxHeight = "240px",
  toolbar = "full",
}: RichTextEditorProps) {
  return (
    <Provider extensions={extensions}>
      <div
        className={`rounded-none border bg-background ${hasError ? "border-red-500" : "border-input"} ${className}`}
      >
        {toolbar === "full" ? <Toolbar hasError={hasError} /> : null}
        {toolbar === "minimal" ? <MinimalToolbar hasError={hasError} /> : null}
        <div style={{ minHeight, maxHeight }} className="px-3 py-2 overflow-y-auto">
          <RichText
            placeholder={placeholder}
            classNames={{
              container: "min-h-full text-sm",
              contentEditable: "outline-none min-h-full text-sm prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-headings:font-semibold",
              placeholder: "text-muted-foreground text-sm",
            }}
          />
        </div>
      </div>
      <EditorContent value={value} onChange={onChange} />
    </Provider>
  )
}
