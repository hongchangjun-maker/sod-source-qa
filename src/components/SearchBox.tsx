import { useEffect, useRef, useState } from 'react'
import { Search, X } from 'lucide-react'

interface Props {
  value: string
  suggestions: string[]
  onChange: (value: string) => void
  onSearch: (value: string) => void
}

export function SearchBox({ value, suggestions, onChange, onSearch }: Props) {
  const [open, setOpen] = useState(false)
  const wrapperRef = useRef<HTMLFormElement>(null)

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
      <button className="search-button" type="submit"><Search aria-hidden="true" />답변 찾기</button>
    </form>
  )
}
