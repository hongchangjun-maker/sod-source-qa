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
