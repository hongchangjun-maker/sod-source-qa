import { useEffect, useRef, useState } from 'react'
import { Mic, Search, X } from 'lucide-react'

interface Props {
  value: string
  suggestions: string[]
  onChange: (value: string) => void
  onSearch: (value: string) => void
}

interface SpeechRecognitionEventLike extends Event { results: { [index: number]: { [index: number]: { transcript: string } } } }
interface SpeechRecognitionLike { lang: string; interimResults: boolean; start(): void; onresult: (event: SpeechRecognitionEventLike) => void; onend: () => void; onerror: () => void }
type SpeechRecognitionCtor = new () => SpeechRecognitionLike

export function SearchBox({ value, suggestions, onChange, onSearch }: Props) {
  const [open, setOpen] = useState(false)
  const [listening, setListening] = useState(false)
  const wrapperRef = useRef<HTMLFormElement>(null)
  const SpeechRecognition = (window as unknown as { SpeechRecognition?: SpeechRecognitionCtor; webkitSpeechRecognition?: SpeechRecognitionCtor }).SpeechRecognition
    ?? (window as unknown as { webkitSpeechRecognition?: SpeechRecognitionCtor }).webkitSpeechRecognition

  useEffect(() => {
    const close = (event: MouseEvent) => { if (!wrapperRef.current?.contains(event.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  function submit(event: React.FormEvent) {
    event.preventDefault()
    setOpen(false)
    onSearch(value)
  }

  function listen() {
    if (!SpeechRecognition) return
    const recognition = new SpeechRecognition()
    recognition.lang = 'ko-KR'
    recognition.interimResults = false
    recognition.onresult = (event) => { const text = event.results[0][0].transcript; onChange(text); onSearch(text) }
    recognition.onend = () => setListening(false)
    recognition.onerror = () => setListening(false)
    setListening(true)
    recognition.start()
  }

  return (
    <form className="search-form" onSubmit={submit} role="search" ref={wrapperRef}>
      <label htmlFor="main-search" className="sr-only">증상이나 궁금한 내용 검색</label>
      <div className="search-input-wrap">
        <Search aria-hidden="true" />
        <input
          id="main-search"
          value={value}
          onChange={(event) => { onChange(event.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          autoComplete="off"
          placeholder="예: 가려움, 두통, 졸림, 변비, 부종"
          aria-expanded={open && suggestions.length > 0}
          aria-controls="suggestion-list"
        />
        {value && <button type="button" className="icon-button clear-button" aria-label="검색어 지우기" onClick={() => onChange('')}><X /></button>}
        {open && suggestions.length > 0 && (
          <ul className="suggestions" id="suggestion-list" role="listbox">
            {suggestions.map((suggestion) => <li key={suggestion}><button type="button" onClick={() => { onChange(suggestion); onSearch(suggestion); setOpen(false) }}>{suggestion}</button></li>)}
          </ul>
        )}
      </div>
      <div className="search-actions">
        <button className="search-button" type="submit"><Search aria-hidden="true" />답변 찾기</button>
        {SpeechRecognition && <button type="button" className={`voice-button ${listening ? 'listening' : ''}`} aria-label={listening ? '음성 듣는 중' : '말로 검색하기'} onClick={listen}><Mic aria-hidden="true" /><span>{listening ? '듣는 중…' : '말로 검색'}</span></button>}
      </div>
    </form>
  )
}
