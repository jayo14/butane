export interface TakeQuestion {
  id: string
  examId?: string
  number: number
  text: string
  options: { id: string; label: string; text: string }[]
  correctAnswerId: string
}

export const mockQuestions: TakeQuestion[] = [
  {
    id: "q1",
    examId: "EXM-001",
    number: 1,
    text: "What is the value of x in the equation 2x + 5 = 15?",
    options: [
      { id: "q1a", label: "A", text: "x = 5" },
      { id: "q1b", label: "B", text: "x = 7" },
      { id: "q1c", label: "C", text: "x = 10" },
      { id: "q1d", label: "D", text: "x = 3" },
    ],
    correctAnswerId: "q1a",
  },
  {
    id: "q2",
    examId: "EXM-001",
    number: 2,
    text: "Which of the following is a prime number?",
    options: [
      { id: "q2a", label: "A", text: "15" },
      { id: "q2b", label: "B", text: "21" },
      { id: "q2c", label: "C", text: "17" },
      { id: "q2d", label: "D", text: "27" },
    ],
    correctAnswerId: "q2c",
  },
  {
    id: "q3",
    examId: "EXM-001",
    number: 3,
    text: "What is the area of a rectangle with length 8 cm and width 5 cm?",
    options: [
      { id: "q3a", label: "A", text: "13 cm²" },
      { id: "q3b", label: "B", text: "26 cm²" },
      { id: "q3c", label: "C", text: "40 cm²" },
      { id: "q3d", label: "D", text: "45 cm²" },
    ],
    correctAnswerId: "q3c",
  },
  {
    id: "q4",
    examId: "EXM-001",
    number: 4,
    text: "Solve: 3(2x - 4) = 18. What is the value of x?",
    options: [
      { id: "q4a", label: "A", text: "x = 3" },
      { id: "q4b", label: "B", text: "x = 5" },
      { id: "q4c", label: "C", text: "x = 6" },
      { id: "q4d", label: "D", text: "x = 7" },
    ],
    correctAnswerId: "q4b",
  },
  {
    id: "q5",
    examId: "EXM-002",
    number: 1,
    text: "What is the square root of 144?",
    options: [
      { id: "q5a", label: "A", text: "11" },
      { id: "q5b", label: "B", text: "12" },
      { id: "q5c", label: "C", text: "13" },
      { id: "q5d", label: "D", text: "14" },
    ],
    correctAnswerId: "q5b",
  },
  {
    id: "q6",
    examId: "EXM-002",
    number: 2,
    text: "Which of these fractions is equivalent to 0.75?",
    options: [
      { id: "q6a", label: "A", text: "1/4" },
      { id: "q6b", label: "B", text: "2/3" },
      { id: "q6c", label: "C", text: "3/4" },
      { id: "q6d", label: "D", text: "4/5" },
    ],
    correctAnswerId: "q6c",
  },
  {
    id: "q7",
    examId: "EXM-003",
    number: 1,
    text: "What is the perimeter of a square with side length 6 cm?",
    options: [
      { id: "q7a", label: "A", text: "12 cm" },
      { id: "q7b", label: "B", text: "24 cm" },
      { id: "q7c", label: "C", text: "36 cm" },
      { id: "q7d", label: "D", text: "48 cm" },
    ],
    correctAnswerId: "q7b",
  },
  {
    id: "q8",
    examId: "EXM-003",
    number: 2,
    text: "If a car travels 240 km in 3 hours, what is its average speed?",
    options: [
      { id: "q8a", label: "A", text: "60 km/h" },
      { id: "q8b", label: "B", text: "70 km/h" },
      { id: "q8c", label: "C", text: "80 km/h" },
      { id: "q8d", label: "D", text: "90 km/h" },
    ],
    correctAnswerId: "q8c",
  },
  {
    id: "q9",
    examId: "EXM-004",
    number: 1,
    text: "What is the value of 2³ + 3²?",
    options: [
      { id: "q9a", label: "A", text: "13" },
      { id: "q9b", label: "B", text: "15" },
      { id: "q9c", label: "C", text: "17" },
      { id: "q9d", label: "D", text: "19" },
    ],
    correctAnswerId: "q9c",
  },
  {
    id: "q10",
    examId: "EXM-004",
    number: 2,
    text: "Which of the following is the correct factorization of x² - 9?",
    options: [
      { id: "q10a", label: "A", text: "(x - 3)(x - 3)" },
      { id: "q10b", label: "B", text: "(x + 3)(x + 3)" },
      { id: "q10c", label: "C", text: "(x + 3)(x - 3)" },
      { id: "q10d", label: "D", text: "(x - 9)(x + 1)" },
    ],
    correctAnswerId: "q10c",
  },
]
