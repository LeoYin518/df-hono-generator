#!/usr/bin/env node
const fs = require('node:fs')
const path = require('node:path')
const process = require('node:process')
const { execSync } = require('node:child_process')

const FEATURE_FLAGS = ['--oss', '--sqlite', '--redis', '--all', '--clean']

function printHelp() {
  console.log(`
Usage:
  df-hono-generator [project-name] [options]

Options:
  --oss       Include OSS upload module
  --sqlite    Include SQLite + Drizzle + auth demo
  --redis     Include Redis utility
  --all       Include all optional modules
  --clean     Start from empty template (no sqlite/oss/redis)
  -h, --help  Show help

Examples:
  npx df-hono-generator my-app
  npx df-hono-generator my-app --clean
  npx df-hono-generator my-app --clean --oss
  npx df-hono-generator my-app --all
  npx df-hono-generator my-app --oss --sqlite --redis
  npx df-hono-generator my-app --oss
`)
}

function parseArgs(argv) {
  const selectedFlags = {
    oss: false,
    sqlite: false,
    redis: false,
    all: false,
    clean: false,
  }

  let targetName

  for (const arg of argv) {
    if (arg === '-h' || arg === '--help') {
      printHelp()
      process.exit(0)
    }

    if (arg.startsWith('-')) {
      if (!FEATURE_FLAGS.includes(arg)) {
        console.error(`❌ 不支持的参数: ${arg}`)
        printHelp()
        process.exit(1)
      }
      if (arg === '--oss')
        selectedFlags.oss = true
      if (arg === '--sqlite')
        selectedFlags.sqlite = true
      if (arg === '--redis')
        selectedFlags.redis = true
      if (arg === '--all')
        selectedFlags.all = true
      if (arg === '--clean')
        selectedFlags.clean = true
      continue
    }

    if (!targetName) {
      targetName = arg
      continue
    }

    console.error(`❌ 检测到多个项目名参数: "${targetName}" 和 "${arg}"`)
    printHelp()
    process.exit(1)
  }

  const hasAnyFeatureArg = selectedFlags.oss || selectedFlags.sqlite || selectedFlags.redis || selectedFlags.all

  let features
  if (selectedFlags.clean) {
    if (hasAnyFeatureArg) {
      console.warn('⚠️ --clean 已启用，其他功能参数将被忽略。')
    }
    features = { oss: false, sqlite: false, redis: false }
  }
  else if (!hasAnyFeatureArg) {
    // 无选项时默认全功能
    features = { oss: true, sqlite: true, redis: true }
  }
  else {
    // 显式传参时默认启用 sqlite，再按参数追加功能
    features = { oss: false, sqlite: true, redis: false }
  }

  if (!selectedFlags.clean) {
    if (selectedFlags.all) {
      features.oss = true
      features.sqlite = true
      features.redis = true
    }
    if (selectedFlags.oss)
      features.oss = true
    if (selectedFlags.sqlite)
      features.sqlite = true
    if (selectedFlags.redis)
      features.redis = true
  }

  return {
    targetName: targetName || 'my-hono-app',
    features,
  }
}

const { targetName, features } = parseArgs(process.argv.slice(2))
const targetDir = path.resolve(process.cwd(), targetName)
const packageRoot = path.resolve(__dirname, '..')
const templateRoot = path.join(packageRoot, 'template')

function copyDirectory(srcDir, destDir) {
  fs.mkdirSync(destDir, { recursive: true })
  const entries = fs.readdirSync(srcDir, { withFileTypes: true })

  for (const entry of entries) {
    const srcPath = path.join(srcDir, entry.name)
    const destPath = path.join(destDir, entry.name)

    if (entry.isDirectory()) {
      copyDirectory(srcPath, destPath)
      continue
    }

    fs.copyFileSync(srcPath, destPath)
  }
}

function removeIfExists(targetPath) {
  if (!fs.existsSync(targetPath))
    return
  fs.rmSync(targetPath, { recursive: true, force: true })
}

function writeFile(filePath, content) {
  fs.writeFileSync(filePath, `${content.trimEnd()}\n`, 'utf8')
}

function buildEnvTs(selectedFeatures) {
  const schemaLines = [
    "  NODE_ENV: z.string().default('development'),",
    "  PORT: z.coerce.number().default(3000),",
  ]

  if (selectedFeatures.oss) {
    schemaLines.push(
      '  // OSS',
      '  OSS_ACCESS_KEY_ID: z.string(),',
      '  OSS_ACCESS_KEY_SECRET: z.string(),',
      '  OSS_BUCKET: z.string(),',
      '  OSS_REGION: z.string(),',
      '  OSS_BASE_URL: z.string(),',
    )
  }

  if (selectedFeatures.sqlite) {
    schemaLines.push(
      '  // DB',
      "  DB_FILE_URL: z.string().default('./src/db/dev.db'),",
    )
  }

  if (selectedFeatures.redis) {
    schemaLines.push(
      '  // REDIS',
      "  REDIS_SERVER: z.string().default('redis://default:123456@localhost:6379'),",
    )
  }

  if (selectedFeatures.oss || selectedFeatures.sqlite) {
    schemaLines.push(
      '  // JWT',
      '  JWT_ADMIN_SECRET: z.string(),',
      '  JWT_ADMIN_EXPIRES_IN_SECONDS: z.coerce.number().int().min(60).default(86400),',
      '  JWT_CLIENT_SECRET: z.string(),',
      '  JWT_CLIENT_EXPIRES_IN_SECONDS: z.coerce.number().int().min(60).default(86400),',
    )
  }

  return `import process from 'node:process'
import dotenv from 'dotenv'
import dotenvExpand from 'dotenv-expand'
import { z } from 'zod'

dotenvExpand.expand(dotenv.config())

const EnvSchema = z.object({
${schemaLines.join('\n')}
})

export type Env = z.infer<typeof EnvSchema>

const env: Env = (() => {
  try {
    return EnvSchema.parse(process.env)
  }
  catch (e) {
    const error = e as z.ZodError
    console.error('❌ Invalid environment variables:')
    console.error(error.flatten().fieldErrors)
    process.exit(1)
  }
})()

export default env
`
}

function buildEnvExample(selectedFeatures) {
  const lines = [
    '# 环境变量',
    '# 环境变量 NODE_ENV 可选值：development, production',
    'NODE_ENV=development',
    '# 端口',
    'PORT=3000',
    '',
  ]

  if (selectedFeatures.oss) {
    lines.push(
      '# OSS 配置',
      'OSS_ACCESS_KEY_ID=你自己的阿里云的 ACCESS_KEY_ID',
      'OSS_ACCESS_KEY_SECRET=你自己的阿里云的 OSS_ACCESS_KEY_SECRET',
      'OSS_BUCKET=阿里云 OSS 的 Bucket 名称',
      'OSS_REGION=阿里云 OSS Bucket 所在地域名称',
      'OSS_BASE_URL=阿里云 OSS Bucket 域名',
      '',
    )
  }

  if (selectedFeatures.sqlite) {
    lines.push(
      '# 数据库配置',
      '# 本地 SQLite 数据库文件路径（也可以像 mysql 一样使用远程数据库）',
      'DB_FILE_URL=./src/db/dev.db',
      '',
    )
  }

  if (selectedFeatures.redis) {
    lines.push(
      '# Redis 配置',
      'REDIS_SERVER=redis://default:123456@localhost:6379',
      '',
    )
  }

  if (selectedFeatures.oss || selectedFeatures.sqlite) {
    lines.push(
      '# JWT 配置',
      'JWT_ADMIN_SECRET=abcdefghijklmnopqrstuvwxyz',
      'JWT_ADMIN_EXPIRES_IN_SECONDS=86400',
      'JWT_CLIENT_SECRET=zyxwvutsrqponmlkjihgfedcba',
      'JWT_CLIENT_EXPIRES_IN_SECONDS=86400',
    )
  }

  return lines.join('\n')
}

function buildAppTs(selectedFeatures) {
  const imports = [
    "import { configureOpenAPI } from '@/lib/configure-open-api.js'",
    "import createApp from '@/lib/create-app.js'",
  ]

  if (selectedFeatures.sqlite)
    imports.push("import adminAuth from '@/routes/auth/auth.index.js'")
  if (selectedFeatures.oss)
    imports.push("import alioss from '@/routes/oss/alioss.index.js'")

  const middlewareImports = []
  if (selectedFeatures.sqlite)
    middlewareImports.push('requireAdminAuth')
  if (selectedFeatures.oss)
    middlewareImports.push('requireEitherAuth')
  if (middlewareImports.length > 0) {
    imports.push(`import { ${middlewareImports.join(', ')} } from './middleware/auth.js'`)
  }

  const middlewareLines = []
  if (selectedFeatures.sqlite)
    middlewareLines.push("app.use('/admin/*', requireAdminAuth())")
  if (selectedFeatures.oss)
    middlewareLines.push("app.use('/oss/*', requireEitherAuth())")

  const routeLines = []
  if (selectedFeatures.oss)
    routeLines.push("  { path: '/oss', router: alioss },")
  if (selectedFeatures.sqlite)
    routeLines.push("  { path: '/admin/auth', router: adminAuth },")

  const routeRegisterBlock = `const routes = [
${routeLines.join('\n')}
]

routes.forEach(({ path, router }) => {
  app.route(path, router)
})`

  return `${imports.join('\n')}

const app = createApp()

configureOpenAPI(app)

${middlewareLines.length > 0 ? `${middlewareLines.join('\n')}\n` : ''}${routeRegisterBlock}

export default app
`
}

function applyFeatureSelection(targetPath, selectedFeatures) {
  if (!selectedFeatures.oss) {
    removeIfExists(path.join(targetPath, 'src', 'routes', 'oss'))
  }

  if (!selectedFeatures.sqlite) {
    removeIfExists(path.join(targetPath, 'src', 'db'))
    removeIfExists(path.join(targetPath, 'src', 'routes', 'auth'))
    removeIfExists(path.join(targetPath, 'drizzle.config.ts'))
    removeIfExists(path.join(targetPath, 'src', 'utils', 'passwordAuth.ts'))
  }

  if (!selectedFeatures.redis) {
    removeIfExists(path.join(targetPath, 'src', 'utils', 'redis.cache.ts'))
    removeIfExists(path.join(targetPath, 'docker-compose.yml'))
  }

  if (!selectedFeatures.oss && !selectedFeatures.sqlite) {
    removeIfExists(path.join(targetPath, 'src', 'middleware', 'auth.ts'))
    removeIfExists(path.join(targetPath, 'src', 'utils', 'jwt.ts'))
  }

  writeFile(path.join(targetPath, 'src', 'app.ts'), buildAppTs(selectedFeatures))
  writeFile(path.join(targetPath, 'src', 'env.ts'), buildEnvTs(selectedFeatures))
  writeFile(path.join(targetPath, '.env.example'), buildEnvExample(selectedFeatures))
}

if (!fs.existsSync(templateRoot)) {
  console.error(`❌ 未找到模板目录: ${templateRoot}`)
  process.exit(1)
}

if (fs.existsSync(targetDir)) {
  const files = fs.readdirSync(targetDir)
  if (files.length > 0) {
    console.error(`❌ 目标目录已存在且非空: ${targetDir}`)
    process.exit(1)
  }
}

// 1) 复制 template 到目标目录
copyDirectory(templateRoot, targetDir)
applyFeatureSelection(targetDir, features)

// 2) 修改目标 package.json
const targetPkgPath = path.join(targetDir, 'package.json')
if (!fs.existsSync(targetPkgPath)) {
  console.error(`❌ 未找到模板 package.json: ${targetPkgPath}`)
  process.exit(1)
}

const targetPkg = JSON.parse(fs.readFileSync(targetPkgPath, 'utf8'))
targetPkg.name = targetName
delete targetPkg.bin

if (!features.oss) {
  delete targetPkg.dependencies['ali-oss']
  delete targetPkg.devDependencies['@types/ali-oss']
}

if (!features.sqlite) {
  delete targetPkg.scripts.seed
  delete targetPkg.dependencies['better-sqlite3']
  delete targetPkg.dependencies['drizzle-orm']
  delete targetPkg.dependencies['drizzle-seed']
  delete targetPkg.devDependencies['@types/better-sqlite3']
  delete targetPkg.devDependencies['drizzle-kit']

  if (Array.isArray(targetPkg.pnpm?.onlyBuiltDependencies)) {
    targetPkg.pnpm.onlyBuiltDependencies = targetPkg.pnpm.onlyBuiltDependencies.filter(dep => dep !== 'better-sqlite3')
    if (targetPkg.pnpm.onlyBuiltDependencies.length === 0) {
      delete targetPkg.pnpm.onlyBuiltDependencies
    }
    if (Object.keys(targetPkg.pnpm).length === 0) {
      delete targetPkg.pnpm
    }
  }
}

if (!features.redis) {
  delete targetPkg.dependencies.redis
}

if (!features.sqlite) {
  delete targetPkg.dependencies.bcryptjs
}

fs.writeFileSync(targetPkgPath, `${JSON.stringify(targetPkg, null, 2)}\n`, 'utf8')

// 3) 初始化 git 仓库
try {
  execSync('git init', { cwd: targetDir, stdio: 'ignore' })
}
catch {
  console.warn('⚠️ 未能自动执行 git init，请手动执行。')
}

// 4) 修复 npm 发布导致的 .gitignore -> .npmignore 问题
const npmIgnorePath = path.join(targetDir, '.npmignore')
const gitIgnorePath = path.join(targetDir, '.gitignore')
const defaultGitignore = `# dev
.yarn/
!.yarn/releases
.vscode/*
!.vscode/launch.json
!.vscode/*.code-snippets
.idea/workspace.xml
.idea/usage.statistics.xml
.idea/shelf

# deps
node_modules/
dist/

# env
.env
.env.production

# logs
logs/
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
lerna-debug.log*

# misc
.DS_Store
`
if (fs.existsSync(npmIgnorePath) && !fs.existsSync(gitIgnorePath)) {
  fs.renameSync(npmIgnorePath, gitIgnorePath)
}
if (!fs.existsSync(gitIgnorePath)) {
  fs.writeFileSync(gitIgnorePath, defaultGitignore, 'utf8')
}

console.log(`\n✅ 项目已创建: ${targetDir}`)
console.log(`   已启用功能: ${
  [
    features.oss ? 'oss' : null,
    features.sqlite ? 'sqlite' : null,
    features.redis ? 'redis' : null,
  ].filter(Boolean).join(', ') || 'none'
}`)
console.log('\n下一步:')
console.log(`  cd ${path.relative(process.cwd(), targetDir) || '.'}`)
console.log('  pnpm install')
console.log('  pnpm run dev\n')
