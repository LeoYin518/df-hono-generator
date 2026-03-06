# df-hono-generator

一个开箱即用的 `Hono + TypeScript + Zod OpenAPI` 服务端脚手架生成器。

## 30 秒了解这个脚手架

它的目标是：快速生成一个可直接开发业务接口的 Hono 后端项目，并内置常见工程化能力。

固定集成（所有项目都有）：

- Hono + TypeScript + ESM
- `@hono/zod-openapi` + Scalar（`/scalar` 文档页）
- `dotenv + zod` 环境变量校验
- `eslint`、`node:test`、`tsx`
- `pnpm run gen:route` 路由 CRUD 代码生成脚本

可选模块（按参数注入）：

- `sqlite`：SQLite + Drizzle + 鉴权示例 + seed
- `oss`：阿里云 OSS 上传模块
- `redis`：Redis 缓存工具模块
- 后续迭代集成更多中间件

## 选项与模块映射（一眼看懂）

先看规则：

- 不传功能参数：默认启用 `sqlite + oss + redis`
- 显式传功能参数：默认会带上 `sqlite`，再叠加你传入的参数
- `--clean`：强制空模板，不启用任何可选模块（并忽略其它功能参数）
- `--all`：等价于启用全部可选模块

常见命令对应结果：

| 命令 | 最终启用模块 | 会新增的核心模块 |
| --- | --- | --- |
| `npx df-hono-generator my-app` | `sqlite + oss + redis` | `src/db/*`、`src/routes/auth/*`、`src/routes/oss/*`、`src/utils/redis.cache.ts`、`docker-compose.yml` |
| `npx df-hono-generator my-app --clean` | 无 | 仅保留基础框架，不包含 `db/auth/oss/redis` 相关模块 |
| `npx df-hono-generator my-app --sqlite` | `sqlite` | `src/db/*`、`src/routes/auth/*`、`src/utils/passwordAuth.ts`、`src/utils/jwt.ts`、`drizzle.config.ts`、`seed` 脚本 |
| `npx df-hono-generator my-app --oss` | `sqlite + oss` | 在 `sqlite` 基础上再增加 `src/routes/oss/*` |
| `npx df-hono-generator my-app --redis` | `sqlite + redis` | 在 `sqlite` 基础上再增加 `src/utils/redis.cache.ts`、`docker-compose.yml` |
| `npx df-hono-generator my-app --oss --redis` | `sqlite + oss + redis` | 同时包含 `sqlite`、`oss`、`redis` 全部模块 |
| `npx df-hono-generator my-app --all` | `sqlite + oss + redis` | 同上（全部可选模块） |

## 快速开发流程

### 1) 创建项目

```bash
npx df-hono-generator my-hono-app
cd my-hono-app
```

按功能裁剪创建（示例）：

```bash
npx df-hono-generator my-app
npx df-hono-generator my-app --clean
npx df-hono-generator my-app --oss --sqlite --redis
npx df-hono-generator my-app --all
npx df-hono-generator my-app --oss
npx df-hono-generator my-app --oss --redis
```

说明：

- 不传功能参数时，默认包含全部功能（`sqlite + oss + redis`）
- 显式传参数时，默认包含 `sqlite`，再叠加你传入的功能（如 `--oss --redis`）
- `--clean` 表示空模板，不包含 `sqlite/oss/redis`，且会忽略其它功能参数

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

### 4) 初始化数据库（启用 `--sqlite` 时）

```bash
npx drizzle-kit push
```

### 5) 运行种子文件

```bash
pnpm run seed
```

使用 `--clean` 且未显式启用 `--sqlite` 时可跳过第 4、5 步。

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
- `schema/<module>.schemas.ts`（模块私有 schema，例如 `crudDataSchema`）

同时复用公共响应 schema：

- `src/utils/response-schema.ts`（`successSchema` / `errorSchema`）

## 环境要求

- Node.js `>= 20`
- pnpm `>= 8`（推荐）

## 生成后的项目包含

- 固定基础：
  - 基于 Hono 的 Node.js 后端模板
  - TypeScript + ESM
  - `@hono/zod-openapi` 自动生成 OpenAPI 文档
  - Scalar API 文档页面（`/scalar`）
  - `dotenv + zod` 环境变量校验
  - `eslint`、`node:test`、`tsx`
  - `pnpm run gen:route` 接口生成脚本
- 按选项注入：
  - `--sqlite`：`src/db/*`、`src/routes/auth/*`、`drizzle.config.ts`、`seed` 脚本
  - `--oss`：`src/routes/oss/*`
  - `--redis`：`src/utils/redis.cache.ts`、`docker-compose.yml`

## 命令行参数

```bash
df-hono-generator [project-name] [options]
```

- 不传 `project-name` 时，默认目录名为 `my-hono-app`
- 若目标目录已存在且非空，会阻止覆盖并退出
- 支持功能选项：
  - `--oss`：包含 OSS 上传模块
  - `--sqlite`：包含 SQLite + Drizzle + 鉴权示例
  - `--redis`：包含 Redis 工具模块
  - `--all`：包含全部可选模块
  - `--clean`：空模板（不包含任何可选模块）
- 不传任何功能选项时，默认包含全部可选模块
- `docker-compose.yml` 仅在包含 `--redis` 功能时生成
- 当 `--clean` 与其它功能参数同时出现时，会忽略其它功能参数并给出警告

## 目录说明（脚手架包本身）

- `bin/create.cjs`：CLI 入口，复制模板并重写目标项目 `package.json`
- `template/`：实际生成到业务项目的模板内容

## License

MIT
