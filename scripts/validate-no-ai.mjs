import fs from 'node:fs'
import path from 'node:path'

const roots = ['src', 'index.html', 'package.json', 'public/manifest.webmanifest', 'public/sw.js']
const forbidden = [
  /modelContext/i,
  /registerTool/i,
  /api\.openai\.com/i,
  /\bopenai\b/i,
  /\bchatgpt\b/i,
  /@anthropic-ai|generativelanguage\.googleapis\.com|@google\/generative-ai/i,
  /\/v1\/(?:chat\/completions|responses)/i,
  /SpeechRecognition|webkitSpeechRecognition/i,
]

function filesOf(target) {
  const stat = fs.statSync(target)
  if (stat.isFile()) return [target]
  return fs.readdirSync(target, { withFileTypes: true }).flatMap((entry) => filesOf(path.join(target, entry.name)))
}

const files = roots.flatMap(filesOf)
const violations = []
for (const file of files) {
  const content = fs.readFileSync(file, 'utf8')
  for (const pattern of forbidden) {
    if (pattern.test(content)) violations.push(`${file}: forbidden runtime marker ${pattern}`)
  }
}

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'))
const dependencies = { ...pkg.dependencies, ...pkg.devDependencies }
const forbiddenPackages = Object.keys(dependencies).filter((name) => /openai|anthropic|generative-ai|langchain|llamaindex/i.test(name))
if (forbiddenPackages.length) violations.push(`Forbidden generation packages: ${forbiddenPackages.join(', ')}`)

if (violations.length) {
  console.error(violations.join('\n'))
  process.exit(1)
}

console.log(`No generative service, agent integration, or generation SDK found in ${files.length} runtime files.`)
