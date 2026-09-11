import type { SymptomIndexItem } from '../types'

export function SymptomIndex({ rows, onSearch }: { rows: SymptomIndexItem[]; onSearch: (query: string) => void }) {
  return <div className="symptom-index-grid">{rows.map((row) => (
    <article key={row.symptom} className="index-card">
      <button type="button" onClick={() => onSearch(row.symptom)}>{row.symptom}</button>
      <dl><div><dt>원문에서 주로 나온 해석</dt><dd>{row.originalInterpretation}</dd></div><div><dt>편집상 분류</dt><dd>{row.classification}</dd></div></dl>
    </article>
  ))}</div>
}
