# df-hono-generator

一个开箱即用的 `Hono + TypeScript + Zod OpenAPI` 服务端脚手架生成器。

## 快速开发流程

### 1) 创建项目

```bash
npx df-hono-generator my-hono-app
cd my-hono-app
```

### 2) 安装依赖

```bash
pnpm install
```

### 3) 准备环境文件

macOS / Linux:

```bash
cp .env.example .env
```

Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

按 `template/README.md` 中的环境变量说明填写 `.env`。

### 4) 初始化数据库

```bash
npx drizzle-kit push
```

### 5) 运行种子文件

```bash
pnpm run seed
```

### 6) 启动项目

```bash
pnpm run dev
```

默认服务地址：`http://localhost:3000`  
文档地址：`http://localhost:3000/scalar`

### 7) 快速创建接口（CRUD 路由三件套）

```bash
pnpm run gen:route admin-web/category
pnpm run gen:route admin-web/category /admin/category
```

脚本会生成并注册：

- `<module>.routes.ts`（路由与 schema）
- `<module>.handler.ts`（业务逻辑）
- `<module>.index.ts`（路由聚合）

## 环境要求

- Node.js `>= 20`
- pnpm `>= 8`（推荐）

## 生成后的项目包含

- 基于 Hono 的 Node.js 后端模板
- TypeScript + ESM
- `@hono/zod-openapi` 自动生成 OpenAPI 文档
- Scalar API 文档页面（`/scalar`）
- `dotenv + zod` 环境变量校验
- SQLite（Drizzle）与 Redis 依赖
- `eslint`、`node:test`、`tsx`

## 命令行参数

```bash
df-hono-generator [project-name]
```

- 不传 `project-name` 时，默认目录名为 `my-hono-app`
- 若目标目录已存在且非空，会阻止覆盖并退出

## 目录说明（脚手架包本身）

- `bin/create.cjs`：CLI 入口，复制模板并重写目标项目 `package.json`
- `template/`：实际生成到业务项目的模板内容

## License

MIT

