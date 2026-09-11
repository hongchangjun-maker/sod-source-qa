import { Bookmark, BookmarkCheck } from 'lucide-react'
import type { QAItem } from '../types'
import { relevanceLabel } from '../utils/search'

interface Props { item: QAItem; score?: number; saved: boolean; onToggleSave: (id: string) => void }

export function AnswerCard({ item, score, saved, onToggleSave }: Props) {
  return (
    <article className="answer-card" data-answer-id={item.id}>
      <div className="card-meta">
        <span className="category-pill">{item.category}</span>
        {score !== undefined && <span className="relevance">{relevanceLabel(score)}</span>}
      </div>
      <h3><span aria-hidden="true">Q.</span> {item.question}</h3>
      <div className="source-answer"><span className="answer-label" aria-hidden="true">A.</span><p>{item.answer}</p></div>
      <div className="card-actions">
        <span className="source-id">{item.part} · {item.id}</span>
        <button type="button" className="save-button" aria-pressed={saved} onClick={() => onToggleSave(item.id)}>
          {saved ? <BookmarkCheck aria-hidden="true" /> : <Bookmark aria-hidden="true" />}{saved ? '저장됨' : '저장'}
        </button>
      </div>
    </article>
  )
}
