import * as React from "react"

type Node =
  | { kind: "h"; level: 1 | 2 | 3; text: string }
  | { kind: "p"; text: string }
  | { kind: "li"; text: string }
  | { kind: "code"; text: string }

function parseMarkdown(md: string): Node[] {
  const lines = md.replace(/\r\n/g, "\n").split("\n")

  const nodes: Node[] = []
  let inCode = false
  let codeBuf: string[] = []

  function flushCode() {
    if (codeBuf.length === 0) return
    nodes.push({ kind: "code", text: codeBuf.join("\n") })
    codeBuf = []
  }

  for (const rawLine of lines) {
    const line = rawLine.replace(/\s+$/g, "")

    if (line.trim().startsWith("```") ) {
      if (inCode) {
        inCode = false
        flushCode()
      } else {
        inCode = true
      }
      continue
    }

    if (inCode) {
      codeBuf.push(rawLine)
      continue
    }

    if (!line.trim()) {
      // paragraph break
      continue
    }

    const h = line.match(/^(#{1,3})\s+(.*)$/)
    if (h) {
      const level = Math.min(3, h[1].length) as 1 | 2 | 3
      nodes.push({ kind: "h", level, text: h[2] })
      continue
    }

    const li = line.match(/^[-*]\s+(.*)$/)
    if (li) {
      nodes.push({ kind: "li", text: li[1] })
      continue
    }

    nodes.push({ kind: "p", text: line })
  }

  // If file ends while in code block, flush anyway.
  if (inCode) flushCode()

  return nodes
}

function inlineFormat(text: string): React.ReactNode {
  // Minimal inline formatting (safe): **bold**, `code`
  const parts: React.ReactNode[] = []
  let i = 0

  while (i < text.length) {
    // inline code
    if (text[i] === "`") {
      const j = text.indexOf("`", i + 1)
      if (j !== -1) {
        const code = text.slice(i + 1, j)
        parts.push(
          <code
            key={`c-${i}`}
            className="rounded-md border border-[color:var(--neon-hairline)] bg-[color:var(--neon-bg1)]/50 px-1.5 py-0.5 font-mono text-[13px] text-[color:var(--neon-text0)]"
          >
            {code}
          </code>,
        )
        i = j + 1
        continue
      }
    }

    // bold
    if (text[i] === "*" && text[i + 1] === "*") {
      const j = text.indexOf("**", i + 2)
      if (j !== -1) {
        const bold = text.slice(i + 2, j)
        parts.push(
          <strong key={`b-${i}`} className="font-semibold text-[color:var(--neon-text0)]">
            {bold}
          </strong>,
        )
        i = j + 2
        continue
      }
    }

    // plain text chunk
    const nextSpecial = (() => {
      const nextCode = text.indexOf("`", i)
      const nextBold = text.indexOf("**", i)
      const candidates = [nextCode, nextBold].filter((n) => n !== -1)
      return candidates.length ? Math.min(...candidates) : -1
    })()

    const end = nextSpecial === -1 ? text.length : nextSpecial
    parts.push(<React.Fragment key={`t-${i}`}>{text.slice(i, end)}</React.Fragment>)
    i = end
  }

  return parts
}

export function MarkdownContent({ md }: { md: string }) {
  const nodes = React.useMemo(() => parseMarkdown(md), [md])

  const listItems: React.ReactNode[] = []
  const out: React.ReactNode[] = []

  function flushList() {
    if (listItems.length === 0) return
    out.push(
      <ul key={`ul-${out.length}`} className="mt-3 list-disc space-y-1.5 pl-5 text-[15px] leading-relaxed text-[color:var(--neon-text1)]">
        {listItems.splice(0).map((li, idx) => (
          <li key={idx}>{li}</li>
        ))}
      </ul>,
    )
  }

  nodes.forEach((n, idx) => {
    if (n.kind !== "li") flushList()

    if (n.kind === "h") {
      out.push(
        <h2
          key={`h-${idx}`}
          className={
            n.level === 1
              ? "mt-6 font-serif text-2xl font-bold text-[color:var(--neon-text0)]"
              : n.level === 2
                ? "mt-6 font-serif text-xl font-bold text-[color:var(--neon-text0)]"
                : "mt-5 text-lg font-semibold text-[color:var(--neon-text0)]"
          }
        >
          {n.text}
        </h2>,
      )
      return
    }

    if (n.kind === "p") {
      out.push(
        <p key={`p-${idx}`} className="mt-3 text-[15px] leading-relaxed text-[color:var(--neon-text1)]">
          {inlineFormat(n.text)}
        </p>,
      )
      return
    }

    if (n.kind === "li") {
      listItems.push(inlineFormat(n.text))
      return
    }

    if (n.kind === "code") {
      out.push(
        <pre
          key={`pre-${idx}`}
          className="mt-4 overflow-x-auto rounded-xl border border-[color:var(--neon-hairline)] bg-[color:var(--neon-bg1)]/55 p-4 text-[13px] leading-relaxed text-[color:var(--neon-text1)]"
        >
          <code className="font-mono">{n.text}</code>
        </pre>,
      )
      return
    }
  })

  flushList()

  return <div>{out}</div>
}
