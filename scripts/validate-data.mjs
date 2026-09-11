import fs from 'node:fs'

const qa = JSON.parse(fs.readFileSync('public/data/qa.json', 'utf8'))
const symptomIndex = JSON.parse(fs.readFileSync('public/data/symptom-index.json', 'utf8'))
const errors = []
if (qa.metadata.answerPolicy !== 'source-only') errors.push('answerPolicy must be source-only')
if (qa.metadata.totalItems !== 77 || qa.items.length !== 77) errors.push(`Q&A count must be 77 (found ${qa.items.length})`)
if (qa.items.filter((item) => item.part === '1부').length !== 45) errors.push('Part 1 count must be 45')
if (qa.items.filter((item) => item.part === '2부').length !== 32) errors.push('Part 2 count must be 32')
if (new Set(qa.items.map((item) => item.id)).size !== qa.items.length) errors.push('Duplicate ids found')
if (qa.items.some((item) => !item.question.trim() || !item.answer.trim())) errors.push('Empty question or answer found')
if (qa.items.some((item) => /(^|\n)---($|\n)|(^|\n)#{1,3}\s/.test(item.answer))) errors.push('Document structure marker leaked into an answer')
if (qa.items.some((item) => !Array.isArray(item.keywords) || item.keywords.length === 0)) errors.push('Missing keywords')
if (symptomIndex.length !== 14) errors.push(`Symptom index count must be 14 (found ${symptomIndex.length})`)
if (!qa.metadata.sourceNotice.startsWith('※ 본 문서는')) errors.push('Source notice missing')
if (errors.length) { console.error(errors.join('\n')); process.exit(1) }
console.log('Data validation passed: 77 unique, non-empty source-only Q&A items (45 + 32), 14 symptom rows, source notice present.')
