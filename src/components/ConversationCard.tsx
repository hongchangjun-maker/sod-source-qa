import type { ConversationItem } from '../types'

const kindLabels = {
  'symptom-question': '증상 문의 원문',
  reaction: '체험·반응 원문',
  answer: '답변·안내 원문',
  context: '대화 원문',
} as const

export function ConversationCard({ item }: { item: ConversationItem }) {
  return (
    <article className="conversation-card" data-conversation-id={item.id}>
      <div className="conversation-meta">
        <span className={`conversation-kind kind-${item.kind}`}>{kindLabels[item.kind]}</span>
        <span>{item.date} · {item.time}</span>
      </div>
      <strong className="conversation-speaker">{item.speaker}</strong>
      <p>{item.text}</p>
      <span className="source-id">{item.id}</span>
    </article>
  )
}
