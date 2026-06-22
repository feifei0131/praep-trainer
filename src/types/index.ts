export type Level = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'
export type CaseName = 'Akk.' | 'Dat.' | 'Gen.' | 'Nom.'
export type InterfaceLang = 'zh' | 'en'
export type PracticeType = 'flashcard' | 'fill_blank' | 'contrast' | 'dialogue'
export type PracticeResult = 'correct' | 'incorrect' | 'skipped'
export type RequestStatus = 'pending' | 'approved' | 'rejected'

export interface VerbPreposition {
  id: string
  verb: string
  preposition: string
  case_name: CaseName
  level: Level
  meaning_zh: string
  meaning_en: string
  example_de: string
  example_zh: string
  example_en: string
  common_error_zh: string | null
  common_error_en: string | null
  tags: string[]
  is_published: boolean
  created_at: string
}

export interface UserProfile {
  id: string
  display_name: string | null
  interface_lang: InterfaceLang
  created_at: string
}

export interface UserFlashcard {
  id: string
  user_id: string
  entry_id: string
  next_review: string
  interval_days: number
  ease_factor: number
  review_count: number
  added_at: string
  verb_prepositions?: VerbPreposition
}

export interface UserPracticeLog {
  id: string
  user_id: string
  entry_id: string
  result: PracticeResult
  practice_type: PracticeType
  practiced_at: string
}

export interface WordRequest {
  id: string
  verb: string
  preposition: string | null
  ai_draft: Record<string, unknown> | null
  request_count: number
  status: RequestStatus
  requested_by: string | null
  created_at: string
  updated_at: string
}
