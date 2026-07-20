export interface ParsedQuestion {
  text: string
  options: { label: string; text: string }[]
  correctAnswerLabel: string | null
  needsReview: boolean
  reviewReason?: string
}

const OPTION_PATTERNS: [RegExp, (m: RegExpMatchArray) => { label: string; text: string }][] = [
  [/^\[([a-dA-D])\]\s*(.*)/, (m) => ({ label: m[1]!, text: m[2]!.trim() })],
  [/^\(([a-dA-D])\)\s*(.*)/, (m) => ({ label: m[1]!, text: m[2]!.trim() })],
  [/^([a-dA-D])\.\s+(.*)/, (m) => ({ label: m[1]!, text: m[2]!.trim() })],
  [/^([a-dA-D])\)\s*(.*)/, (m) => ({ label: m[1]!, text: m[2]!.trim() })],
]

function matchOptionLine(line: string): { label: string; text: string } | null {
  for (const [regex, extractor] of OPTION_PATTERNS) {
    const m = line.match(regex)
    if (m) return extractor(m)
  }
  return null
}

const ANSWER_PATTERN = /^(?:Answer|Correct Answer|ANS|Correct)\s*[:]\s*(?:Option\s*)?([a-dA-D])\b/
const QUESTION_NUM_PREFIX = /^(?:\d+[.)]\s*|Q\d+[.)]\s*|Question\s+\d+[.)]?\s*)/i

function tryParseBlock(lines: string[]): ParsedQuestion | null {
  const options: { label: string; text: string }[] = []
  let answerLabel: string | null = null
  const questionTextParts: string[] = []

  let firstOptionIndex = -1
  for (let i = 0; i < lines.length; i++) {
    if (matchOptionLine(lines[i])) {
      firstOptionIndex = i
      break
    }
  }

  if (firstOptionIndex >= 0) {
    for (let i = 0; i < firstOptionIndex; i++) {
      const text = lines[i].replace(QUESTION_NUM_PREFIX, "").trim()
      if (text) questionTextParts.push(text)
    }
    for (let i = firstOptionIndex; i < lines.length; i++) {
      const opt = matchOptionLine(lines[i])
      if (opt) {
        options.push({ label: opt.label.toUpperCase(), text: opt.text })
        continue
      }
      const ans = lines[i].match(ANSWER_PATTERN)
      if (ans) {
        answerLabel = ans[1]!.toUpperCase()
        continue
      }
    }
  } else {
    for (const raw of lines) {
      const ans = raw.match(ANSWER_PATTERN)
      if (ans) {
        answerLabel = ans[1]!.toUpperCase()
        continue
      }
      const text = raw.replace(QUESTION_NUM_PREFIX, "").trim()
      if (text) questionTextParts.push(text)
    }
  }

  if (questionTextParts.length === 0 && options.length === 0) return null

  const questionText = questionTextParts.join(" ").trim()
  const needsReview = options.length !== 4 || !answerLabel

  const reasons: string[] = []
  if (options.length !== 4) reasons.push(`Found ${options.length} option(s) instead of 4`)
  if (!answerLabel) reasons.push("No correct answer specified")

  return {
    text: questionText,
    options: options.slice(0, 4),
    correctAnswerLabel: answerLabel,
    needsReview,
    reviewReason: reasons.length > 0 ? reasons.join("; ") : undefined,
  }
}

export function parseBulkInput(input: string): ParsedQuestion[] {
  const lines = input.split("\n").map((l) => l.trim()).filter((l) => l.length > 0)
  const blocks: string[][] = []
  let currentBlock: string[] = []
  const ansLineTest = /^(?:Answer|Correct Answer|ANS|Correct)\s*[:]/i

  for (const line of lines) {
    const ansMatch = ansLineTest.test(line)
    if (ansMatch) {
      currentBlock.push(line)
      blocks.push(currentBlock)
      currentBlock = []
      continue
    }

    const isQStart = /^(?:\d+[.)]\s*|Q\d+[.)]\s*|Question\s+\d+[.)]?\s*)/i.test(line)
    const hasAnswerInBlock = currentBlock.some((l) => ansLineTest.test(l))

    if (isQStart && hasAnswerInBlock) {
      blocks.push(currentBlock)
      currentBlock = [line]
    } else {
      currentBlock.push(line)
    }
  }

  if (currentBlock.length > 0) blocks.push(currentBlock)

  return blocks
    .map((block) => tryParseBlock(block))
    .filter((q): q is ParsedQuestion => q !== null && q.text.length > 0)
}
