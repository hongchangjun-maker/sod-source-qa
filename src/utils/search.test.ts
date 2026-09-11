import fs from 'node:fs'
import { describe, expect, it } from 'vitest'
import type { QAData } from '../types'
import { FALLBACK_MESSAGE, isAmbiguous, searchQA, suggestions } from './search'

const qa = JSON.parse(fs.readFileSync('public/data/qa.json', 'utf8')) as QAData

describe('closed source-only search', () => {
  it('keeps the immutable data contract', () => {
    expect(qa.metadata.answerPolicy).toBe('source-only')
    expect(qa.metadata.originalItemCount).toBe(77)
    expect(qa.metadata.totalItems).toBe(qa.items.length)
    expect(qa.items.length).toBeGreaterThanOrEqual(77)
    expect(qa.items.filter((item) => item.part === '1부').length).toBeGreaterThanOrEqual(45)
    expect(qa.items.filter((item) => item.part === '2부').length).toBeGreaterThanOrEqual(32)
    expect(new Set(qa.items.map((item) => item.id)).size).toBe(qa.items.length)
    expect(qa.items.every((item) => item.question.length > 0 && item.answer.length > 0)).toBe(true)
  })

  const expectedSearches: Array<[string, RegExp]> = [
    ['가려움', /case-00[1-3]/], ['발진', /case-00[1-5]/], ['두드러기', /case-003/],
    ['머리가 아파요', /case-016/], ['두통', /case-016/], ['어지러워요', /case-018/],
    ['속이 메스꺼워', /case-010/], ['속쓰림', /case-011/], ['배가 아파', /case-0(11|15)/],
    ['변비', /case-013/], ['설사', /case-014/], ['잠이 와', /case-021/], ['졸려요', /case-021/],
    ['잠을 못자요', /case-022/], ['피곤해요', /case-0(23|24)/], ['어깨가 아파', /case-0(25|29)/],
    ['허리가 아파', /case-0(25|27)/], ['기침', /case-030/], ['가래', /case-030/],
    ['열이 나요', /case-0(31|32|34)/], ['오한', /case-0(24|31)/], ['혈당 상승', /case-0(35|38)/],
    ['혈압', /case-035/], ['심장이 두근거려', /case-037/], ['가슴이 답답해', /case-037/],
    ['소변', /case-039/], ['전립선', /case-039/], ['다리가 부었어요', /case-040/],
    ['발등 부종', /case-041/], ['눈이 침침해', /case-019/], ['검은 변', /case-015/], ['염증수치', /case-036/],
  ]

  it.each(expectedSearches)('routes “%s” to appropriate registered Q&A', (query, expectedId) => {
    const results = searchQA(qa.items, query)
    expect(results.length).toBeGreaterThan(0)
    expect(results.slice(0, 3).map((result) => result.item.id).join(',')).toMatch(expectedId)
    expect(results.every((result) => qa.items.some((item) => item.answer === result.item.answer))).toBe(true)
  })

  it.each(['서울 날씨 알려줘', '주식 추천해줘', '감기약 추천', '오늘 저녁 뭐 먹지'])('returns no answer for unrelated query: %s', (query) => {
    expect(searchQA(qa.items, query)).toEqual([])
  })

  it('uses the exact required fallback and ambiguity gate', () => {
    expect(FALLBACK_MESSAGE).toBe('현재 등록된 명현반응(호전반응) 자료에서 해당 질문과 관련된 답변을 찾지 못했습니다. 다른 증상이나 키워드로 다시 검색해 주세요.')
    expect(isAmbiguous('몸이 이상해요')).toBe(true)
  })

  it('builds autocomplete only from JSON keywords', () => {
    const keywordSet = new Set(qa.items.flatMap((item) => item.keywords))
    const values = suggestions(qa.items, '가')
    expect(values.length).toBeGreaterThan(0)
    expect(values.every((value) => keywordSet.has(value))).toBe(true)
  })
})
