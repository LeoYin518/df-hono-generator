# df-hono-generator

一个开箱即用的 `Hono + TypeScript + Zod OpenAPI` 服务端脚手架生成器。  
通过一条命令快速创建项目，并内置 API 文档、环境变量校验、统一响应结构、测试与 lint 配置。

## 特性

- 基于 Hono 的 Node.js 后端模板
- TypeScript + ESM
- `@hono/zod-openapi` 自动生成 OpenAPI 文档
- Scalar API 文档页面（`/scalar`）
- `dotenv + zod` 环境变量校验
- 内置 SQLite（Drizzle）与 Redis 依赖
- 内置 `eslint`、`node:test`、`tsx`

## 环境要求

- Node.js `>= 20`
- pnpm `>= 8`（推荐）

## 使用方式

### 1) 使用 npx 创建项目

```bash
npx df-hono-generator my-hono-app
```

### 2) 进入目录并启动

```bash
cd my-hono-app
pnpm install
pnpm run dev
```

默认服务地址：`http://localhost:3000`

## 生成后的项目包含

- 应用入口与路由组织约定
- OpenAPI JSON：`GET /doc`
- Scalar UI：`GET /scalar`
- 统一成功/失败返回结构
- 环境变量校验（缺失会在启动时直接报错）
- 常用脚本：
  - `pnpm run dev`
  - `pnpm run build`
  - `pnpm run start`
  - `pnpm run lint`
  - `pnpm run test`

## 命令行参数

```bash
df-hono-generator [project-name]
```

- 不传 `project-name` 时，默认目录名为 `my-hono-app`
- 若目标目录已存在且非空，会阻止覆盖并退出

## 目录说明（脚手架包本身）

- `bin/create.cjs`：CLI 入口，负责复制模板并重写目标项目 `package.json`
- `template/`：实际生成到业务项目的模板内容

## License

MIT

