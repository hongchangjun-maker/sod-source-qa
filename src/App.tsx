import { useEffect, useMemo, useRef, useState } from 'react'
import { BookOpenText, ChevronLeft, CircleAlert, HeartHandshake, Home, ListTree, MessageSquareText, Search, Trash2 } from 'lucide-react'
import { AnswerCard } from './components/AnswerCard'
import { ConversationCard } from './components/ConversationCard'
import { CategoryBrowser } from './components/CategoryBrowser'
import { SearchBox } from './components/SearchBox'
import { SymptomIndex } from './components/SymptomIndex'
import type { ConversationData, ConversationItem, ConversationSearchResult, QAData, QAItem, SearchResult, SymptomIndexItem } from './types'
import { AMBIGUOUS_MESSAGE, FALLBACK_MESSAGE, isAmbiguous, searchConversations, searchQA, suggestions } from './utils/search'

type View = 'search' | 'categories' | 'all' | 'index' | 'conversations' | 'consult'
const quickSymptoms = ['피부·가려움', '발진·두드러기', '두통', '어지럼', '울렁거림', '속쓰림', '변비', '설사', '졸림', '불면', '피로·무기력', '근육통', '관절통', '허리·어깨 통증', '기침·가래', '열·오한', '혈당', '혈압', '가슴 두근거림', '부종', '소변', '눈 침침함']
const broadChoices = ['피부', '소화', '두통·어지럼', '수면·피로', '근육·관절', '기침·가래', '혈당·혈압', '부종·소변']
const consultItems = ['연령·성별', '현재 가장 불편한 증상 또는 질환', '과거 질환', '수술 이력', '현재 복용 중인 약', '함께 나타나는 여러 증상', 'SOD 제품 종류와 하루 섭취량', '섭취 기간과 최근 증량·감량 여부']
const RECENTS_KEY = 'sod-qa-recents-v1'
const SAVED_KEY = 'sod-qa-saved-v1'

function readStorage(key: string): string[] {
  try { const value = JSON.parse(localStorage.getItem(key) ?? '[]'); return Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : [] } catch { return [] }
}

export default function App() {
  const [data, setData] = useState<QAData | null>(null)
  const [symptomIndex, setSymptomIndex] = useState<SymptomIndexItem[]>([])
  const [conversations, setConversations] = useState<ConversationData | null>(null)
  const [loadError, setLoadError] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[] | null>(null)
  const [conversationResults, setConversationResults] = useState<ConversationSearchResult[]>([])
  const [conversationFilter, setConversationFilter] = useState<ConversationItem['kind'] | 'all'>('all')
  const [ambiguous, setAmbiguous] = useState(false)
  const [view, setView] = useState<View>('search')
  const [recents, setRecents] = useState<string[]>(() => readStorage(RECENTS_KEY))
  const [saved, setSaved] = useState<string[]>(() => readStorage(SAVED_KEY))
  const [fontScale, setFontScale] = useState(1)
  const resultsRef = useRef<HTMLElement>(null)

  useEffect(() => {
    Promise.all([
      fetch(`${import.meta.env.BASE_URL}data/qa.json`).then((response) => { if (!response.ok) throw new Error('qa'); return response.json() as Promise<QAData> }),
      fetch(`${import.meta.env.BASE_URL}data/symptom-index.json`).then((response) => { if (!response.ok) throw new Error('index'); return response.json() as Promise<SymptomIndexItem[]> }),
      fetch(`${import.meta.env.BASE_URL}data/conversations.json`).then((response) => { if (!response.ok) throw new Error('conversations'); return response.json() as Promise<ConversationData> }),
    ]).then(([qa, index, conversationData]) => {
      if (qa.metadata.answerPolicy !== 'source-only' || qa.metadata.originalItemCount !== 77 || qa.items.length !== qa.metadata.totalItems || qa.items.length < qa.metadata.originalItemCount) throw new Error('invalid')
      if (conversationData.metadata.textPolicy !== 'verbatim' || conversationData.items.length !== conversationData.metadata.totalMessages) throw new Error('invalid-conversations')
      setData(qa); setSymptomIndex(index); setConversations(conversationData)
    }).catch(() => setLoadError(true))
  }, [])

  useEffect(() => { document.documentElement.style.setProperty('--font-scale', String(fontScale)) }, [fontScale])
  const autoSuggestions = useMemo(() => data ? suggestions(data.items, query) : [], [data, query])

  function runSearch(value: string) {
    const clean = value.trim()
    if (!clean || !data) return
    setQuery(clean); setView('search')
    const isVague = isAmbiguous(clean)
    setAmbiguous(isVague)
    setResults(isVague ? [] : searchQA(data.items, clean))
    setConversationResults(isVague || !conversations ? [] : searchConversations(conversations.items, clean))
    const next = [clean, ...recents.filter((item) => item !== clean)].slice(0, 5)
    setRecents(next); localStorage.setItem(RECENTS_KEY, JSON.stringify(next))
    requestAnimationFrame(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }

  function showItem(item: QAItem) {
    setQuery(item.question); setView('search'); setAmbiguous(false); setResults([{ item, score: 120, matchedTerms: [] }])
    requestAnimationFrame(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }

  function toggleSaved(id: string) {
    const next = saved.includes(id) ? saved.filter((item) => item !== id) : [...saved, id]
    setSaved(next); localStorage.setItem(SAVED_KEY, JSON.stringify(next))
  }

  function goHome() { setView('search'); setResults(null); setConversationResults([]); setAmbiguous(false); setQuery(''); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  const savedItems = data?.items.filter((item) => saved.includes(item.id)) ?? []

  useEffect(() => {
    if (!data || !document.modelContext?.registerTool) return
    const lifecycle = new AbortController()
    const currentData = data
    void Promise.resolve(document.modelContext.registerTool({
      name: 'search_registered_sod_qa',
      title: '등록된 SOD Q&A 검색',
      description: '사용자가 지정한 증상을 등록된 77개 원문 Q&A 안에서만 검색하고 동일한 결과를 화면에 표시합니다.',
      inputSchema: { type: 'object', properties: { query: { type: 'string', minLength: 1 } }, required: ['query'], additionalProperties: false },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      async execute(input) {
        const queryValue = typeof input === 'object' && input !== null && 'query' in input ? (input as { query?: unknown }).query : undefined
        if (typeof queryValue !== 'string' || !queryValue.trim()) throw new Error('query must be a non-empty string')
        const matched = searchQA(currentData.items, queryValue)
        runSearch(queryValue)
        await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
        return { query: queryValue, count: matched.length, ids: matched.map((result) => result.item.id), answerPolicy: 'source-only' }
      },
    }, { signal: lifecycle.signal })).catch(() => undefined)
    return () => lifecycle.abort()
  }, [data])

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">본문으로 바로가기</a>
      <header className="topbar">
        <button type="button" className="brand" onClick={goHome} aria-label="처음 화면으로"><span className="brand-mark">S</span><span>명현반응 Q&A</span></button>
        <div className="top-actions">
          <button type="button" onClick={goHome}><Home aria-hidden="true" />홈</button>
          <div className="font-controls" aria-label="글자 크기 조절">
            <button type="button" aria-label="글씨 작게" onClick={() => setFontScale((v) => Math.max(.9, v - .1))}>가−</button>
            <button type="button" onClick={() => setFontScale(1)}>기본</button>
            <button type="button" aria-label="글씨 크게" onClick={() => setFontScale((v) => Math.min(1.25, v + .1))}>가+</button>
          </div>
        </div>
      </header>

      <main id="main">
        <section className="search-hero" aria-labelledby="page-title">
          <div className="eyebrow"><span />등록 자료에서만 찾아드립니다</div>
          <h1 id="page-title">명현반응<span>(호전반응)</span> Q&A</h1>
          <p>증상이나 궁금한 내용을 입력해 보세요</p>
          <SearchBox value={query} suggestions={autoSuggestions} onChange={setQuery} onSearch={runSearch} />
          <div className="privacy-note"><CircleAlert aria-hidden="true" /><span>입력 내용은 외부 서버로 전송하거나 저장하지 않습니다.</span></div>
          {recents.length > 0 && <div className="recent-row"><strong>최근 검색</strong><div>{recents.map((term) => <button type="button" key={term} onClick={() => runSearch(term)}>{term}</button>)}</div><button type="button" className="clear-recents" onClick={() => { setRecents([]); localStorage.removeItem(RECENTS_KEY) }}><Trash2 aria-hidden="true" />삭제</button></div>}
        </section>

        <nav className="view-nav" aria-label="자료 보기">
          <button className={view === 'categories' ? 'active' : ''} onClick={() => setView('categories')}><ListTree aria-hidden="true" />증상별 보기</button>
          <button className={view === 'index' ? 'active' : ''} onClick={() => setView('index')}><Search aria-hidden="true" />증상 빠른 찾기</button>
          <button className={view === 'all' ? 'active' : ''} onClick={() => setView('all')}><BookOpenText aria-hidden="true" />전체 질문</button>
          <button className={view === 'conversations' ? 'active' : ''} onClick={() => setView('conversations')}><MessageSquareText aria-hidden="true" />대화 원문</button>
          <button className={view === 'consult' ? 'active' : ''} onClick={() => setView('consult')}><HeartHandshake aria-hidden="true" />상담 확인정보</button>
        </nav>

        {loadError && <section className="status-panel error"><h2>자료를 불러오지 못했습니다</h2><p>페이지를 새로고침한 뒤 다시 시도해 주세요.</p></section>}
        {!data && !loadError && <section className="status-panel" aria-live="polite"><div className="loader" /><p>등록 자료를 불러오는 중입니다.</p></section>}

        {data && view === 'search' && results === null && <section className="quick-section"><div className="section-heading"><div><span>빠르게 찾아보기</span><h2>자주 찾는 증상</h2></div><p>버튼을 누르면 바로 관련 원문을 찾습니다.</p></div><div className="quick-grid">{quickSymptoms.map((term) => <button type="button" key={term} onClick={() => runSearch(term)}>{term}</button>)}</div>{savedItems.length > 0 && <div className="saved-section"><h2>저장한 질문 <span>{savedItems.length}</span></h2>{savedItems.map((item) => <AnswerCard key={item.id} item={item} saved onToggleSave={toggleSaved} />)}</div>}</section>}

        {data && view === 'search' && results !== null && <section className="results-section" ref={resultsRef} tabIndex={-1} aria-live="polite">
          {ambiguous ? <div className="empty-state"><h2>{AMBIGUOUS_MESSAGE}</h2><p>가장 가까운 항목을 선택해 주세요.</p><div className="broad-choices">{broadChoices.map((choice) => <button type="button" key={choice} onClick={() => runSearch(choice)}>{choice}</button>)}</div></div>
            : results.length === 0 && conversationResults.length === 0 ? <div className="empty-state"><CircleAlert aria-hidden="true" /><h2>관련 자료를 찾지 못했습니다</h2><p>{FALLBACK_MESSAGE}</p></div>
              : <><div className="results-heading"><div><span>검색어</span><h2>“{query}”</h2></div><p>기존 Q&A와 새 단체대화 원문을 함께 찾았습니다.</p></div>{results.length > 0 && <><h3 className="result-group-title">기존 등록 Q&A · {results.length}건</h3><div className="results-list">{results.map(({ item, score }) => <AnswerCard key={item.id} item={item} score={score} saved={saved.includes(item.id)} onToggleSave={toggleSaved} />)}</div></>}{conversationResults.length > 0 && <><h3 className="result-group-title">2026년 9월 26일~10월 8일 단체대화 원문 · {conversationResults.length}건</h3><div className="conversation-list">{conversationResults.map(({ item }) => <ConversationCard key={item.id} item={item} />)}</div></>}</>}
          <button type="button" className="restart-button" onClick={goHome}><ChevronLeft aria-hidden="true" />다른 증상 검색하기</button>
        </section>}

        {data && view === 'categories' && <section className="content-section"><div className="section-heading"><div><span>분류별 탐색</span><h2>증상별 보기</h2></div><p>분류를 펼쳐 등록된 질문을 선택하세요.</p></div><CategoryBrowser items={data.items.filter((item) => item.part === '1부')} onOpen={showItem} /></section>}
        {data && view === 'all' && <section className="content-section"><div className="section-heading"><div><span>총 {data.items.length}개</span><h2>전체 질문 보기</h2></div><p>1부 체험사례와 2부 반응·대응 자료 전체입니다.</p></div><CategoryBrowser items={data.items} onOpen={showItem} /></section>}
        {data && view === 'index' && <section className="content-section"><div className="section-heading"><div><span>원문 표 전체</span><h2>증상 빠른 찾기</h2></div><p>증상을 누르면 관련 원문 Q&A를 검색합니다.</p></div><SymptomIndex rows={symptomIndex} onSearch={runSearch} /></section>}
        {data && conversations && view === 'conversations' && <section className="content-section"><div className="section-heading"><div><span>총 {conversations.metadata.totalMessages}개 메시지</span><h2>단체대화 원문</h2></div><p>화자·날짜·시각·본문을 내보낸 파일 그대로 표시합니다. 분류 표시는 탐색용이며 원문을 바꾸지 않습니다.</p></div><div className="conversation-filters" aria-label="대화 원문 분류"><button className={conversationFilter === 'all' ? 'active' : ''} onClick={() => setConversationFilter('all')}>전체 {conversations.metadata.totalMessages}</button><button className={conversationFilter === 'symptom-question' ? 'active' : ''} onClick={() => setConversationFilter('symptom-question')}>증상 문의 {conversations.metadata.counts['symptom-question']}</button><button className={conversationFilter === 'reaction' ? 'active' : ''} onClick={() => setConversationFilter('reaction')}>체험·반응 {conversations.metadata.counts.reaction}</button><button className={conversationFilter === 'answer' ? 'active' : ''} onClick={() => setConversationFilter('answer')}>답변·안내 {conversations.metadata.counts.answer}</button></div><div className="conversation-list">{conversations.items.filter((item) => conversationFilter === 'all' || item.kind === conversationFilter).map((item) => <ConversationCard key={item.id} item={item} />)}</div></section>}
        {data && view === 'consult' && <section className="content-section consult-section"><div className="section-heading"><div><span>서버 저장 없음</span><h2>상담할 때 함께 확인하면 좋은 정보</h2></div><p>상담 전에 아래 내용을 따로 메모해 두면 좋습니다.</p></div><ol>{consultItems.map((item, index) => <li key={item}><span>{String(index + 1).padStart(2, '0')}</span>{item}</li>)}</ol></section>}
      </main>

      <footer>
        <div className="footer-inner"><div><strong>자료 이용 안내</strong><p>이 서비스는 등록된 명현반응(호전반응) 체험담 및 상담 자료를 쉽게 검색하기 위한 서비스입니다. 화면의 답변은 등록된 자료의 내용을 기반으로 표시됩니다.</p></div>{data && <aside><strong>원문 주의사항</strong><p>{data.metadata.sourceNotice}</p></aside>}</div>
      </footer>
      <div className="source-ribbon">답변과 대화 본문은 등록된 원문 그대로 표시되며 새로운 건강 답변을 생성하지 않습니다.</div>
    </div>
  )
}
