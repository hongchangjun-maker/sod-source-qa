import fs from 'node:fs'
import crypto from 'node:crypto'

const qa = JSON.parse(fs.readFileSync('public/data/qa.json', 'utf8'))
const symptomIndex = JSON.parse(fs.readFileSync('public/data/symptom-index.json', 'utf8'))
const conversations = JSON.parse(fs.readFileSync('public/data/conversations.json', 'utf8'))
const conversationSourceBuffer = fs.readFileSync('source/KakaoTalk_20261009_0755_55_963_group.txt')
const conversationSource = conversationSourceBuffer.toString('utf8').replace(/^\uFEFF/, '').replace(/\r\n/g, '\n')
const errors = []
if (qa.metadata.answerPolicy !== 'source-only') errors.push('answerPolicy must be source-only')
if (qa.metadata.originalItemCount !== 77) errors.push('Original source contract must remain 77 items')
if (qa.metadata.totalItems !== qa.items.length || qa.items.length < qa.metadata.originalItemCount) errors.push(`Q&A count is inconsistent (found ${qa.items.length})`)
if (qa.items.filter((item) => item.part === '1부').length < 45) errors.push('Part 1 must retain at least 45 source items')
if (qa.items.filter((item) => item.part === '2부').length < 32) errors.push('Part 2 must retain at least 32 source items')
if (new Set(qa.items.map((item) => item.id)).size !== qa.items.length) errors.push('Duplicate ids found')
if (qa.items.some((item) => !item.question.trim() || !item.answer.trim())) errors.push('Empty question or answer found')
if (qa.items.some((item) => /(^|\n)---($|\n)|(^|\n)#{1,3}\s/.test(item.answer))) errors.push('Document structure marker leaked into an answer')
if (qa.items.some((item) => !Array.isArray(item.keywords) || item.keywords.length === 0)) errors.push('Missing keywords')
if (symptomIndex.length !== 14) errors.push(`Symptom index count must be 14 (found ${symptomIndex.length})`)
if (!qa.metadata.sourceNotice.startsWith('※ 본 문서는')) errors.push('Source notice missing')
if (conversations.metadata.textPolicy !== 'verbatim') errors.push('Conversation textPolicy must be verbatim')
if (conversations.metadata.totalMessages !== conversations.items.length) errors.push('Conversation count is inconsistent')
if (conversations.metadata.sourceSha256 !== crypto.createHash('sha256').update(conversationSourceBuffer).digest('hex')) errors.push('Conversation source hash mismatch')
if (new Set(conversations.items.map((item) => item.id)).size !== conversations.items.length) errors.push('Duplicate conversation ids found')
if (conversations.items.some((item) => !item.date || !item.time || !item.speaker || !item.text)) errors.push('Incomplete conversation message found')
if (conversations.items.some((item) => !conversationSource.includes(item.text))) errors.push('Conversation message differs from source text')
if (conversations.items.some((item) => /님이 (?:들어왔습니다|나갔습니다)\./.test(item.text))) errors.push('Kakao system notice leaked into conversation text')
if (errors.length) { console.error(errors.join('\n')); process.exit(1) }
console.log(`Data validation passed: ${qa.items.length} source-only Q&A items, ${conversations.items.length} verbatim conversation messages, 14 symptom rows.`)
