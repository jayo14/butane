"use client"

import katex from "katex"

interface LatexRendererProps {
  text: string
  inline?: boolean
  className?: string
}

const DISPLAY_MATH_RE = /\$\$([\s\S]+?)\$\$/g
const INLINE_MATH_RE = /\$(.+?)\$/g

function renderLatex(content: string, displayMode: boolean): string {
  try {
    return katex.renderToString(content, {
      throwOnError: false,
      displayMode,
      output: "html",
    })
  } catch {
    return content
  }
}

function splitAndRender(text: string): (string | { html: string; display: boolean })[] {
  const parts: (string | { html: string; display: boolean })[] = []

  let lastIndex = 0
  let match: RegExpExecArray | null

  const regex = DISPLAY_MATH_RE
  regex.lastIndex = 0

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index))
    }
    parts.push({ html: renderLatex(match[1], true), display: true })
    lastIndex = regex.lastIndex
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex))
  }

  const finalParts: (string | { html: string; display: boolean })[] = []

  for (const part of parts) {
    if (typeof part === "string") {
      let inlineLastIndex = 0
      let inlineMatch: RegExpExecArray | null
      const inlineRegex = INLINE_MATH_RE
      inlineRegex.lastIndex = 0

      while ((inlineMatch = inlineRegex.exec(part)) !== null) {
        if (inlineMatch.index > inlineLastIndex) {
          finalParts.push(part.slice(inlineLastIndex, inlineMatch.index))
        }
        finalParts.push({ html: renderLatex(inlineMatch[1], false), display: false })
        inlineLastIndex = inlineRegex.lastIndex
      }

      if (inlineLastIndex < part.length) {
        finalParts.push(part.slice(inlineLastIndex))
      }
    } else {
      finalParts.push(part)
    }
  }

  return finalParts
}

export function LatexRenderer({ text, className = "" }: LatexRendererProps) {
  const parts = splitAndRender(text)

  if (parts.length === 1 && typeof parts[0] === "string") {
    return <span className={className}>{parts[0]}</span>
  }

  return (
    <span className={className}>
      {parts.map((part, i) => {
        if (typeof part === "string") {
          return <span key={i}>{part}</span>
        }
        if (part.display) {
          return (
            <span
              key={i}
              className="block my-3 overflow-x-auto"
              dangerouslySetInnerHTML={{ __html: part.html }}
            />
          )
        }
        return (
          <span
            key={i}
            className="inline-block align-middle"
            dangerouslySetInnerHTML={{ __html: part.html }}
          />
        )
      })}
    </span>
  )
}
