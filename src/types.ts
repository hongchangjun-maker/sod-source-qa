export interface QAItem {
  id: string
  part: '1부' | '2부'
  category: string
  question: string
  answer: string
  keywords: string[]
  searchText: string
}

export interface QAData {
  metadata: {
    title: string
    version: string
    totalItems: number
    originalItemCount: number
    source: string
    answerPolicy: 'source-only'
    sourceNotice: string
  }
  items: QAItem[]
}

export interface SymptomIndexItem {
  symptom: string
  originalInterpretation: string
  classification: string
}

export interface SearchResult { item: QAItem; score: number; matchedTerms: string[] }

export type ConversationKind = 'symptom-question' | 'reaction' | 'answer' | 'context'

export interface ConversationItem {
  id: string
  date: string
  time: string
  speaker: string
  text: string
  kind: ConversationKind
  keywords: string[]
  searchText: string
}

export interface ConversationData {
  metadata: {
    title: string
    source: string
    sourceSha256: string
    exportedAt: string
    textPolicy: 'verbatim'
    totalMessages: number
    counts: Record<ConversationKind, number>
  }
  items: ConversationItem[]
}

export interface ConversationSearchResult { item: ConversationItem; score: number; matchedTerms: string[] }
