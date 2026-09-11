const endings = /(인가요|이라고요|이라는데|합니다|됩니다|있습니다|없습니다|이에요|예요|네요|군요|거든요|거예요|주세요|해요|돼요|나요|까요|어요|아요|고요|는데요|은데요|습니다|ㅂ니다|입니다)$/
const particles = /(으로부터|에게서|이라고|라는|처럼|보다|까지|부터|에서|에게|한테|으로|하고|이며|이고|이나|이나마|라도|마저|조차|밖에|마다|처럼|만큼|께서|에는|에도|으로|로|을|를|이|가|은|는|에|의|와|과|도|만)$/

const variants: Record<string, string> = {
  '가려워': '가려움', '가렵': '가려움', '두드러기': '발진', '머리아파': '두통', '머리가아파': '두통',
  '어지러워': '어지럼', '어지럽': '어지럼', '메스꺼워': '메스꺼움', '울렁거려': '울렁거림',
  '배가아파': '복통', '배아파': '복통', '졸려': '졸림', '잠이와': '졸림', '잠못자': '불면',
  '피곤': '피로', '무기력': '피로', '심장이두근거려': '두근거림', '가슴이답답해': '가슴답답함',
  '다리가부었': '다리부종', '발등이부었': '발등부종', '눈이침침해': '눈침침함', '열이나': '열',
  '졸음': '졸림',
}

export function normalizeText(value: string): string {
  let normalized = value.normalize('NFKC').toLowerCase().replace(/[\s.,!?·/()\[\]{}'"“”‘’~:;_-]+/g, '')
  normalized = normalized
    .replace(/머리가?(아파요|아파|아픔)/g, '두통')
    .replace(/배가?(아파요|아파|아픔)/g, '복통')
    .replace(/잠이?와요?/g, '졸림')
    .replace(/졸려요?/g, '졸림')
    .replace(/잠을?못자요?/g, '불면')
    .replace(/피곤(해요|합니다)?/g, '피로')
    .replace(/가슴이?답답(해요|함)?/g, '가슴답답함')
    .replace(/심장이?두근거려요?/g, '두근거림')
    .replace(/다리가?부었어요?/g, '다리부종')
    .replace(/발등이?부었어요?/g, '발등부종')
    .replace(/눈이?침침(해요|함)?/g, '눈침침함')
  for (const [from, to] of Object.entries(variants)) normalized = normalized.replaceAll(from, to)
  normalized = normalized.replace(endings, '')
  return normalized.length > 2 ? normalized.replace(particles, '') : normalized
}

export function tokenize(value: string): string[] {
  const raw = value.normalize('NFKC').toLowerCase().replace(/[^0-9a-z가-힣]+/g, ' ').trim().split(/\s+/).filter(Boolean)
  const compact = normalizeText(value)
  return [...new Set([...raw.map(normalizeText).filter((token) => token.length >= 2), compact].filter(Boolean))]
}
