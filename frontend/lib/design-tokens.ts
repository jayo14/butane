export const focusRing = [
  "focus-visible:outline-2",
  "focus-visible:outline-primary",
  "focus-visible:outline-offset-2",
].join(" ")

export const hoverInput = "hover:border-content-muted"

export const inputBase = [
  "block w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-content-primary",
  "placeholder:text-content-secondary",
  "transition-colors duration-150",
  hoverInput,
  "focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20",
  "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-surface-secondary",
].join(" ")

export const closeButtonBase = [
  "shrink-0 rounded-lg p-1 transition-colors hover:bg-black/5",
  "focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2",
].join(" ")
