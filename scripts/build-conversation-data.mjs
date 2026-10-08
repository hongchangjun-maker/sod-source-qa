import crypto from 'node:crypto'
import fs from 'node:fs'

const sourcePath = 'source/KakaoTalk_20261009_0755_55_963_group.txt'
const outputPath = 'public/data/conversations.json'
const sourceBuffer = fs.readFileSync(sourcePath)
const raw = sourceBuffer.toString('utf8').replace(/^\uFEFF/, '').replace(/\r\n/g, '\n')
const lines = raw.split('\n')
const messages = []
let date = ''
let current = null

function finish() {
  if (!current) return
  const text = current.lines.join('\n').trim()
  if (text) messages.push({ ...current, text })
  current = null
}

for (const line of lines) {
  const dateMatch = line.match(/^-+\s*(\d{4}년 \d{1,2}월 \d{1,2}일 [^\-]+)\s*-+$/)
  if (dateMatch) {
    finish()
    date = dateMatch[1].trim()
    continue
  }

  const messageMatch = line.match(/^\[(.+?)\] \[((?:오전|오후) \d{1,2}:\d{2})\]\s?(.*)$/)
  if (messageMatch) {
    finish()
    current = { date, speaker: messageMatch[1], time: messageMatch[2], lines: [messageMatch[3]] }
    continue
  }

  if (/^(?:.+님이 (?:들어왔습니다|나갔습니다)\.|관리자가 메시지를 가렸습니다\.|메시지가 삭제되었습니다\.)$/.test(line.trim())) {
    finish()
    continue
  }

  if (current) current.lines.push(line)
}
finish()

const healthPattern = /(SOD|에스오디|애스오디|리쏘드|명현|호전|증상|통증|질환|병원|검사|수치|복용|섭취|발진|가려|두통|어지|메스꺼|구토|설사|변비|부종|붓|혈당|혈압|소변|전립선|기침|가래|열|오한|불면|졸림|피로|암|간염|간수치|당뇨|심장|뇌|눈|망막|대상포진|피부|위염|관절|허리|어깨|염증|이명|난청|복수|근육|체중|생리|콜레스테롤|갑상선|신장|간경화|수면|알러지|알레르기|효소|프로폴리스|비타민|건강|치료|약|환자)/i
const questionPattern = /(\?|？|궁금|문의|여쭤|부탁드립니다|부탁드려요|어떻게|왜 그럴|왜그럴|인가요|일까요|할까요|되나요|맞나요|있나요|없나요|괜찮|도움말씀|고견|알려주세요|알고 싶|질문\)|질문요)/
const answerPattern = /(⭕️?\s*(?:답|답변)\)|답변입니다|답변드립니다|문의하신|말씀드리면|섭취 방법|권장 섭취량)/
const reactionPattern = /(좋아졌|호전|정상으로|사라졌|나아졌|회복|체험|후기|효과|변화|줄었|개선|떨어졌|올라갔|복용 후|섭취 후|먹고 나서|먹은 뒤|반응|부작용|아팠|통증)/
const keywordPatterns = [
  'SOD', '명현', '호전', '통증', '발진', '가려움', '두통', '어지럼', '구토', '설사', '변비', '부종', '혈당', '혈압', '소변', '전립선', '기침', '가래', '오한', '불면', '피로', '암', '간염', '당뇨', '심장', '뇌', '망막', '대상포진', '피부', '위염', '관절', '허리', '어깨', '염증', '이명', '난청', '복수', '근육', '체중', '생리', '콜레스테롤', '갑상선', '신장', '간경화', '수면', '알레르기', '프로폴리스', '비타민',
]

function classify(text) {
  if (answerPattern.test(text)) return 'answer'
  if (healthPattern.test(text) && questionPattern.test(text)) return 'symptom-question'
  if (healthPattern.test(text) && reactionPattern.test(text)) return 'reaction'
  return 'context'
}

const items = messages.map((message, index) => {
  const kind = classify(message.text)
  const keywords = keywordPatterns.filter((keyword) => message.text.toLocaleLowerCase('ko').includes(keyword.toLocaleLowerCase('ko')))
  return {
    id: `chat-${String(index + 1).padStart(4, '0')}`,
    ...message,
    kind,
    keywords,
    searchText: `${message.date} ${message.time} ${message.speaker} ${message.text}`,
  }
})

const counts = Object.fromEntries(['symptom-question', 'reaction', 'answer', 'context'].map((kind) => [kind, items.filter((item) => item.kind === kind).length]))
const output = {
  metadata: {
    title: '리쏘드 AI상담·후기 단체대화 원문',
    source: 'KakaoTalk_20261009_0755_55_963_group.txt',
    sourceSha256: crypto.createHash('sha256').update(sourceBuffer).digest('hex'),
    exportedAt: '2026-10-09',
    textPolicy: 'verbatim',
    totalMessages: items.length,
    counts,
  },
  items,
}

fs.mkdirSync('public/data', { recursive: true })
fs.writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`)
console.log(`Built ${items.length} verbatim conversation messages: ${JSON.stringify(counts)}`)
