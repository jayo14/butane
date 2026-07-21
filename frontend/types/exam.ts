export interface QuestionOption {
  id: string
  label: string
  text: string
}

export interface Question {
  id: string
  number: number
  text: string
  image?: string
  options: QuestionOption[]
  correctAnswerId: string
  points: number
  difficulty?: "easy" | "medium" | "hard"
  tags?: string[]
  needsReview?: boolean
  reviewReason?: string
}

export interface ExamSettings {
  shuffleQuestions: boolean
  shuffleAnswers: boolean
  passMark: number
  availableFrom: string
  availableTo: string
  timeLimit: number
  showResult: boolean
  allowReview: boolean
}
