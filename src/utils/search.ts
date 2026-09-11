import type { QAItem, SearchResult } from '../types'
import { normalizeText, tokenize } from './normalizeKorean'

export const FALLBACK_MESSAGE = '현재 등록된 명현반응(호전반응) 자료에서 해당 질문과 관련된 답변을 찾지 못했습니다. 다른 증상이나 키워드로 다시 검색해 주세요.'
export const AMBIGUOUS_MESSAGE = '어떤 증상이 가장 불편한가요?'

const vagueQueries = new Set(['몸이상해요', '몸이이상해요', '이상해요', '궁금해요', '왜그런가요', '도와주세요'])
const allowedDomainTerms = ['sod', '명현', '호전', '반응', '섭취', '제품', '증상', '통증', '질환', '약', '몸']
const queryAliases: Record<string, string[]> = {
  전립선: ['소변', '비뇨'],
  흑변: ['검은변'],
  구역감: ['메스꺼움', '울렁거림'],
}

export function isAmbiguous(query: string) {
  return vagueQueries.has(normalizeText(query)) || /^(몸이?\s*)?이상(해요|합니다)?$/.test(query.trim())
}

function fuzzyIncludes(a: string, b: string) {
  if (a.includes(b) || b.includes(a)) return true
  if (b.length < 3 || a.length < 3) return false
  const bigrams = (s: string) => new Set(Array.from({ length: s.length - 1 }, (_, i) => s.slice(i, i + 2)))
  const aa = bigrams(a); const bb = bigrams(b)
  const overlap = [...aa].filter((v) => bb.has(v)).length
  return overlap / Math.min(aa.size, bb.size) >= 0.66
}

export function searchQA(items: QAItem[], query: string, limit = 5): SearchResult[] {
  const normalizedQuery = normalizeText(query)
  const baseTerms = tokenize(query).filter((term) => term.length >= 2)
  const terms = [...new Set(baseTerms.flatMap((term) => [term, ...(queryAliases[term] ?? [])]))]
  if (!normalizedQuery || isAmbiguous(query) || /(날씨|주식|추천|뭐먹|저녁메뉴|식사메뉴)/.test(normalizedQuery)) return []

  const results = items.map((item) => {
    const question = normalizeText(item.question)
    const category = normalizeText(item.category)
    const keywords = item.keywords.map(normalizeText)
    const searchText = normalizeText(item.searchText)
    let score = 0
    const matchedTerms = new Set<string>()

    if (question === normalizedQuery) score += 120
    if (question.includes(normalizedQuery) || normalizedQuery.includes(question)) score += 55

    for (const term of terms) {
      let termScore = 0
      if (question === term) termScore += 48
      else if (question.includes(term)) termScore += 30
      if (keywords.some((keyword) => keyword === term)) termScore += 24
      else if (keywords.some((keyword) => keyword.includes(term) || term.includes(keyword))) termScore += 18
      else if (category.includes(term)) termScore += 12
      else if (keywords.some((keyword) => fuzzyIncludes(keyword, term))) termScore = 12
      else if (searchText.includes(term)) termScore = 7
      if (termScore) { score += termScore; matchedTerms.add(term) }
    }

    if (matchedTerms.size > 1) score += matchedTerms.size * 9
    return { item, score, matchedTerms: [...matchedTerms] }
  }).filter((result) => result.score >= 12)

  const hasSpecificMatch = results.some((result) => result.score >= 20)
  const onlyGeneric = terms.every((term) => allowedDomainTerms.some((allowed) => term.includes(allowed)))
  if (!hasSpecificMatch || onlyGeneric) return []
  return results.sort((a, b) => b.score - a.score || a.item.id.localeCompare(b.item.id)).slice(0, limit)
}

export function relevanceLabel(score: number) {
  if (score >= 45) return '매우 관련 있음'
  if (score >= 25) return '관련 있음'
  return '참고할 내용'
}

export function suggestions(items: QAItem[], input: string, limit = 6) {
  const query = normalizeText(input)
  if (!query) return []
  const candidates = new Set<string>()
  items.forEach((item) => item.keywords.forEach((keyword) => candidates.add(keyword)))
  return [...candidates]
    .filter((candidate) => normalizeText(candidate).includes(query) || fuzzyIncludes(normalizeText(candidate), query))
    .sort((a, b) => a.length - b.length || a.localeCompare(b, 'ko'))
    .slice(0, limit)
}
