import fs from 'node:fs'
import path from 'node:path'

const sourcePath = process.argv[2] ?? path.resolve('source/명현반응_호전반응_QA_재편집본.txt')
const raw = fs.readFileSync(sourcePath, 'utf8').replace(/^\uFEFF/, '').replace(/\r\n/g, '\n')
const lines = raw.split('\n')

const concepts = [
  ['가려움', '가려워요', '가렵습니다', '두피 가려움'], ['발진', '붉은 반점', '피부반응'], ['두드러기', '피부'],
  ['울렁거림', '메스꺼움', '구역감', '속 울렁거림'], ['속쓰림', '위통증', '위장'], ['복통', '배가 아파요', '배 아픔'],
  ['복부팽만', '가스', '꾸르륵'], ['변비', '배변'], ['설사', '녹색변', '배변'], ['검은 변', '흑변'],
  ['두통', '머리가 아파요', '머리 통증'], ['어지럼', '어지러워요', '어지럽습니다'], ['눈 침침함', '시야', '눈 통증'], ['눈 충혈', '눈 색'],
  ['졸림', '잠이 와요', '졸려요'], ['불면', '잠을 못 자요', '수면장애'], ['피로', '피곤해요', '무기력'], ['오한', '몸살', '떨림'],
  ['구토', '토함'], ['어깨 통증', '어깨가 아파요'], ['허리 통증', '허리가 아파요'], ['근육통', '허벅지'], ['관절통', '관절'],
  ['기침', '기관지'], ['가래', '콧물'], ['열', '고열', '열감', '열이 나요'], ['혈당', '혈당 상승'], ['혈압', '고혈압', '저혈압'],
  ['염증수치', '검사수치'], ['가슴 두근거림', '두근거림', '심장'], ['가슴 답답함', '가슴 조임', '흉통'],
  ['소변', '소변 줄기'], ['전립선', '비뇨'], ['부종', '붓기', '몸이 부었어요'], ['다리 부종', '하지부종'], ['발등 부종', '발등이 부었어요'],
  ['체중 감소', '살 빠짐'], ['섭취량', '용량', '증량', '감량'], ['중단', '쉬어가기'], ['처방약', '복용약'], ['기저질환', '과거 질환'],
  ['명현반응', '호전반응', 'SOD'], ['장기간', '지연성', '반복 반응'], ['물', '수분'], ['기록', '일기'], ['상담', '확인사항'],
]
const stopwords = new Set(['있나요', '있습니다', '어떻게', '원문에서', '사례가', '사례도', '경우', '하나요', '인가요', '했나요', '되나요', '것은', '것이', '이런', '다른', '사람이', '제품을', '먹고', '섭취한', '원문에는'])

let part = ''
let category = ''
const items = []
let current = null

function finishCurrent() {
  if (!current) return
  while (current.answerLines.length && (!current.answerLines.at(-1)?.trim() || current.answerLines.at(-1)?.trim() === '---')) current.answerLines.pop()
  current.answer = current.answerLines.join('\n').trim()
  delete current.answerLines
  const haystack = `${current.question} ${current.answer} ${current.category}`
  const keywords = new Set()
  for (const group of concepts) if (group.some((term) => haystack.includes(term))) group.forEach((term) => keywords.add(term));
  `${current.question} ${current.category}`.replace(/[^0-9A-Za-z가-힣]+/g, ' ').split(/\s+/)
    .filter((word) => word.length >= 2 && !stopwords.has(word)).forEach((word) => keywords.add(word))
  current.keywords = [...keywords]
  current.searchText = `${current.question} ${current.answer} ${current.category} ${current.keywords.join(' ')}`
  items.push(current)
  current = null
}

for (const rawLine of lines) {
  const line = rawLine.trimEnd()
  const partMatch = line.match(/^# ([12]부)\./)
  if (partMatch) { finishCurrent(); part = partMatch[1]; category = ''; continue }
  const categoryMatch = line.match(/^## [A-Z]\. (.+)$/)
  if (categoryMatch && part) { finishCurrent(); category = categoryMatch[1]; continue }
  const questionMatch = line.match(/^### Q(\d+)\. (.+)$/)
  if (questionMatch && part) {
    finishCurrent()
    const number = Number(questionMatch[1])
    current = {
      id: `${part === '1부' ? 'case' : 'guide'}-${String(number).padStart(3, '0')}`,
      part,
      category,
      question: questionMatch[2].trim(),
      answerLines: [],
    }
    continue
  }
  if (current && line.trim() === '---') { finishCurrent(); continue }
  if (current && /^#\s/.test(line)) { finishCurrent(); part = ''; category = ''; continue }
  if (current) {
    const answerStart = line.match(/^\*\*A\.\*\*\s?(.*)$/)
    if (answerStart) current.answerLines.push(answerStart[1])
    else if (current.answerLines.length > 0) current.answerLines.push(line)
  }
}
finishCurrent()

const sourceNotice = lines.find((line) => line.startsWith('※ 본 문서는'))?.trim() ?? ''
const tableLines = lines.filter((line) => /^\|.+\|$/.test(line.trim()))
const symptomIndex = tableLines.slice(2).map((line) => {
  const [symptom, originalInterpretation, classification] = line.split('|').slice(1, -1).map((cell) => cell.trim())
  return { symptom, originalInterpretation, classification }
}).filter((row) => row.symptom)

const qa = {
  metadata: {
    title: 'SOD 명현반응(호전반응) 체험사례 및 반응·대응 Q&A',
    version: '1.0',
    totalItems: items.length,
    source: path.basename(sourcePath),
    answerPolicy: 'source-only',
    sourceNotice,
  },
  items,
}

fs.mkdirSync(path.resolve('public/data'), { recursive: true })
fs.writeFileSync(path.resolve('public/data/qa.json'), `${JSON.stringify(qa, null, 2)}\n`, 'utf8')
fs.writeFileSync(path.resolve('public/data/symptom-index.json'), `${JSON.stringify(symptomIndex, null, 2)}\n`, 'utf8')
console.log(`Generated ${items.length} Q&A items and ${symptomIndex.length} symptom index rows.`)
