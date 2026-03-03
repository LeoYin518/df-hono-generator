#!/usr/bin/env node
const fs = require('node:fs')
const path = require('node:path')
const process = require('node:process')
const { execSync } = require('node:child_process')

const [, , rawTarget] = process.argv
const targetName = rawTarget || 'my-hono-app'
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

// 2) 修改目标 package.json
const targetPkgPath = path.join(targetDir, 'package.json')
if (!fs.existsSync(targetPkgPath)) {
  console.error(`❌ 未找到模板 package.json: ${targetPkgPath}`)
  process.exit(1)
}

const targetPkg = JSON.parse(fs.readFileSync(targetPkgPath, 'utf8'))
targetPkg.name = targetName
delete targetPkg.bin
fs.writeFileSync(targetPkgPath, `${JSON.stringify(targetPkg, null, 2)}\n`, 'utf8')

// 3) 初始化 git 仓库
try {
  execSync('git init', { cwd: targetDir, stdio: 'ignore' })
}
catch {
  console.warn('⚠️ 未能自动执行 git init，请手动执行。')
}

console.log(`\n✅ 项目已创建: ${targetDir}`)
console.log('\n下一步:')
console.log(`  cd ${path.relative(process.cwd(), targetDir) || '.'}`)
console.log('  pnpm install')
console.log('  pnpm run dev\n')
