import type { QAItem } from '../types'

interface Props { items: QAItem[]; onOpen: (item: QAItem) => void }

export function CategoryBrowser({ items, onOpen }: Props) {
  const groups = Object.entries(items.reduce<Record<string, QAItem[]>>((all, item) => {
    (all[item.category] ??= []).push(item)
    return all
  }, {}))
  return <div className="accordion-list">{groups.map(([category, group]) => (
    <details key={category} className="category-details">
      <summary><span>{category}</span><strong>{group.length}개</strong></summary>
      <div className="question-list">{group.map((item) => <button type="button" key={item.id} onClick={() => onOpen(item)}><span>Q.</span>{item.question}</button>)}</div>
    </details>
  ))}</div>
}
