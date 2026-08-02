import { render, screen, fireEvent, within } from "@testing-library/react"
import { RosterReviewTable } from "@/components/roster/roster-review-table"
import type { RosterRow } from "@/types"

const mockNewRows: RosterRow[] = [
  { index: 0, full_name: "Alice Smith", guardian_phone: "08012345678", guardian_email: "alice@example.com" },
  { index: 1, full_name: "Bob Jones", guardian_phone: "08098765432", guardian_email: "" },
]

const mockDuplicateRows: RosterRow[] = [
  { index: 2, full_name: "Charlie Brown", guardian_phone: "08011112222", guardian_email: "charlie@example.com", existing_id: "existing-123" },
]

describe("RosterReviewTable", () => {
  const defaultProps = {
    newRows: mockNewRows,
    duplicateRows: mockDuplicateRows,
    onAccept: jest.fn(),
    onSkip: jest.fn(),
    onAcceptAll: jest.fn(),
    acceptedCount: 0,
    skippedCount: 0,
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("renders all rows with correct status badges", () => {
    render(<RosterReviewTable {...defaultProps} />)

    expect(screen.getByText("Alice Smith")).toBeInTheDocument()
    expect(screen.getByText("Bob Jones")).toBeInTheDocument()
    expect(screen.getByText("Charlie Brown")).toBeInTheDocument()

    expect(screen.getByText("New")).toBeInTheDocument()
    expect(screen.getByText("Duplicate")).toBeInTheDocument()
  })

  it("calls onAccept when accept button is clicked", () => {
    render(<RosterReviewTable {...defaultProps} />)

    const acceptButtons = screen.getAllByText("Accept")
    fireEvent.click(acceptButtons[0])

    expect(defaultProps.onAccept).toHaveBeenCalledWith(mockNewRows[0])
  })

  it("calls onSkip when skip button is clicked", () => {
    render(<RosterReviewTable {...defaultProps} />)

    const skipButtons = screen.getAllByText("Skip")
    fireEvent.click(skipButtons[0])

    expect(defaultProps.onSkip).toHaveBeenCalledWith(mockNewRows[0])
  })

  it("calls onAcceptAll when Accept All button is clicked", () => {
    render(<RosterReviewTable {...defaultProps} />)

    const acceptAllButton = screen.getByText(/Accept All/)
    fireEvent.click(acceptAllButton)

    expect(defaultProps.onAcceptAll).toHaveBeenCalled()
  })

  it("displays accepted status after accepting a row", () => {
    render(<RosterReviewTable {...defaultProps} />)

    const acceptButtons = screen.getAllByText("Accept")
    fireEvent.click(acceptButtons[0])

    expect(screen.getByText("Accepted")).toBeInTheDocument()
  })

  it("displays skipped status after skipping a row", () => {
    render(<RosterReviewTable {...defaultProps} />)

    const skipButtons = screen.getAllByText("Skip")
    fireEvent.click(skipButtons[0])

    expect(screen.getByText("Skipped")).toBeInTheDocument()
  })

  it("shows keyboard navigation hint", () => {
    render(<RosterReviewTable {...defaultProps} />)

    expect(screen.getByText(/Keyboard/)).toBeInTheDocument()
    expect(screen.getByText(/navigate/)).toBeInTheDocument()
    expect(screen.getByText(/accept/)).toBeInTheDocument()
    expect(screen.getByText(/skip/)).toBeInTheDocument()
  })

  it("displays pending count correctly", () => {
    render(<RosterReviewTable {...defaultProps} />)

    expect(screen.getByText("3 of 3 pending")).toBeInTheDocument()
  })

  it("displays accepted and skipped counts", () => {
    render(
      <RosterReviewTable
        {...defaultProps}
        acceptedCount={1}
        skippedCount={1}
      />,
    )

    expect(screen.getByText("1 accepted · 1 skipped")).toBeInTheDocument()
  })

  it("shows empty state when no rows", () => {
    render(
      <RosterReviewTable
        {...defaultProps}
        newRows={[]}
        duplicateRows={[]}
      />,
    )

    expect(screen.getByText("0 of 0 pending")).toBeInTheDocument()
  })
})
