# df-hono-generator

基于 `Hono + TypeScript + Zod OpenAPI` 的后端服务模板。

这份文档定位为长期复用的项目手册，包含：

- 快速启动
- 环境变量规范
- 目录与命名约定
- 路由与返回体规范
- 错误码规范
- 测试与部署流程

## 目录

- [1. 快速开始](#1-快速开始)
- [2. 环境变量说明](#2-环境变量说明)
- [3. 常用命令](#3-常用命令)
- [4. 目录约定](#4-目录约定)
- [5. 路由规范](#5-路由规范)
- [6. 响应与错误码规范](#6-响应与错误码规范)
- [7. 测试规范](#7-测试规范)
- [8. 部署步骤（通用）](#8-部署步骤通用)
- [9. 新增模块 Checklist](#9-新增模块-checklist)
- [10. 已知注意事项](#10-已知注意事项)
- [11. License](#11-license)

## 1. 快速开始

### 1.1 环境要求

- Node.js `>= 20`
- pnpm `>= 8`

### 1.2 安装依赖

```bash
pnpm install
```

### 1.3 配置环境变量

macOS / Linux：

```bash
cp .env.example .env
```

Windows PowerShell：

```powershell
Copy-Item .env.example .env
```

按下文「环境变量说明」补齐配置。

### 1.4 本地开发

```bash
pnpm run dev
```

默认地址：`http://localhost:3000`

### 1.5 API 文档

- OpenAPI JSON: `GET /doc`
- Scalar UI: `GET /scalar`

### 1.6 5 分钟验证

```bash
pnpm install
pnpm run dev
```

访问 `http://localhost:3000/scalar`，能看到接口文档页即表示模板运行正常。

## 2. 环境变量说明

环境变量由 [`src/env.ts`](src/env.ts) 使用 Zod 在启动时校验，不满足要求会直接退出进程。

| 变量名                          | 必填 | 默认值                               | 说明                               |
| ------------------------------- | ---- | ------------------------------------ | ---------------------------------- |
| `NODE_ENV`                      | 否   | `development`                        | 运行环境                           |
| `PORT`                          | 否   | `3000`                               | 服务端口                           |
| `OSS_ACCESS_KEY_ID`             | 是   | -                                    | 阿里云 OSS AccessKey ID            |
| `OSS_ACCESS_KEY_SECRET`         | 是   | -                                    | 阿里云 OSS AccessKey Secret        |
| `OSS_BUCKET`                    | 是   | -                                    | OSS Bucket 名称                    |
| `OSS_REGION`                    | 是   | -                                    | OSS Region，例如 `oss-cn-hangzhou` |
| `OSS_BASE_URL`                  | 是   | -                                    | OSS 对外访问基础地址               |
| `DB_FILE_URL`                   | 否   | `./src/db/dev.db`                    | SQLite 文件路径                    |
| `REDIS_SERVER`                  | 否   | `redis://default:123456@localhost:6379` | Redis 连接串                       |
| `JWT_ADMIN_SECRET`              | 是   | -                                    | 管理端 JWT 密钥                    |
| `JWT_ADMIN_EXPIRES_IN_SECONDS`  | 否   | `86400`                              | 管理端 JWT 过期秒数（最小 60）     |
| `JWT_CLIENT_SECRET`             | 是   | -                                    | 客户端 JWT 密钥                    |
| `JWT_CLIENT_EXPIRES_IN_SECONDS` | 否   | `86400`                              | 客户端 JWT 过期秒数（最小 60）     |

说明：

- “必填”以 [`src/env.ts`](src/env.ts) 的 Zod schema 是否提供默认值为准。
- 即使有默认值，生产环境也建议显式配置，避免不同环境行为不一致。

示例：

```env
# 基本信息
NODE_ENV=development
PORT=3000

# OSS 配置
OSS_ACCESS_KEY_ID=your_key_id
OSS_ACCESS_KEY_SECRET=your_key_secret
OSS_BUCKET=your_bucket
OSS_REGION=oss-cn-hangzhou
OSS_BASE_URL=https://your-bucket.oss-cn-hangzhou.aliyuncs.com

# 数据库配置
DB_FILE_URL=./src/db/dev.db

# Redis 配置
REDIS_SERVER=redis://default:123456@localhost:6379

# JWT 配置
JWT_ADMIN_SECRET=abcdefghijklmnopqrstuvwxyz
JWT_ADMIN_EXPIRES_IN_SECONDS=86400
JWT_CLIENT_SECRET=zyxwvutsrqponmlkjihgfedcba
JWT_CLIENT_EXPIRES_IN_SECONDS=86400
```

### 2.1 默认数据库（SQLite）与示例表

- 默认使用 **SQLite** 作为开发环境下的数据库，通过 `DB_FILE_URL` 指向本地 `.db` 文件。
- 模板仓库中已经内置了一组示例表结构（例如用户、博客等典型业务实体），用于演示常见的 CRUD、分页查询等场景，方便你快速联调与验收接口。
- 使用本模板时，如果你只想复用脚手架而接入自己现有的业务库，可以：
  - 直接在现有示例表的基础上增删字段；
  - 或者删除示例表相关的 schema/迁移/种子数据与路由，仅保留基础应用骨架。
- `.env.example` 中给出的 `DB_FILE_URL=./src/db/dev.db` 默认指向一份包含示例表结构的 SQLite 文件，开箱即可运行与体验。

## 3. 常用命令

```bash
pnpm run dev      # 开发模式（tsx watch）
pnpm run build    # TypeScript 构建到 dist
pnpm run start    # 运行构建产物
pnpm run lint     # 代码检查
pnpm run lint:fix # 自动修复格式与部分 lint 问题
pnpm run test     # 运行测试（node:test + tsx）
```

## 4. 目录约定

```text
src/
  app.ts                    # 应用入口，统一挂载业务路由
  index.ts                  # 启动 HTTP 服务
  env.ts                    # 环境变量加载与校验
  lib/                      # 基础库（app factory、响应封装、状态码等）
  middleware/               # 中间件
  routes/
    <module>/
      <module>.routes.ts    # 路由声明（createRoute + schema）
      <module>.handler.ts   # 业务处理逻辑
      <module>.index.ts     # 模块路由聚合（router.openapi）

 test/
   *.test.ts                # 集成/接口测试
```

新增业务模块时，建议沿用三件套：

- `xxx.routes.ts`
- `xxx.handler.ts`
- `xxx.index.ts`

并在 [`src/app.ts`](src/app.ts) 中统一注册：

```ts
app.route('/prefix', xxxRouter)
```

## 5. 路由规范

### 5.1 设计原则

- 使用 `@hono/zod-openapi` 的 `createRoute` 声明路由。
- 每个接口必须声明：`path`、`method`、`tags`、`responses`。
- 有请求体时必须提供 Zod schema（便于自动校验与文档生成）。

### 5.2 文件职责

- `*.routes.ts`：只做协议层定义（请求/响应 schema）。
- `*.handler.ts`：只做业务逻辑与调用外部服务。
- `*.index.ts`：路由与 handler 绑定。

### 5.3 命名建议

- 路由对象名使用业务语义，例如 `list`, `create`, `detail`, `update`, `remove`。
- handler 与 route 对象同名，减少映射负担。

### 5.4 URL 约定

- 模块级前缀在 `app.ts` 中统一挂载。
- 具体接口 path 在 `*.routes.ts` 中定义。
- 建议采用资源化命名，避免动词堆叠。

## 6. 响应与错误码规范

### 6.1 成功响应

统一通过 [`src/lib/response.ts`](src/lib/response.ts) 的 `ok()` 返回：

```json
{
  "success": true,
  "code": 0,
  "message": "操作成功",
  "data": {}
}
```

约定：

- `success = true`
- `code = 0`（业务成功码）
- HTTP 状态码通常为 `200`

### 6.2 失败响应

统一通过 `fail()` 返回：

```json
{
  "success": false,
  "code": 400,
  "message": "参数校验失败",
  "error": {}
}
```

约定：

- `success = false`
- `code` 与 HTTP 状态码/错误标识一致
- `message` 为可读错误信息
- `error` 仅在需要排障时提供结构化详情

### 6.3 当前全局错误处理

在 [`src/lib/create-app.ts`](src/lib/create-app.ts) 中已内置：

- 参数校验失败：`400 BAD_REQUEST`
- 路由不存在：`404 NOT_FOUND`
- 未捕获异常：`500 INTERNAL_SERVER_ERROR`

建议新增业务错误时使用：

- `400` 参数错误
- `401` 未认证
- `403` 无权限
- `404` 资源不存在
- `409` 资源冲突
- `422` 语义校验失败
- `500` 服务内部错误

## 7. 测试规范

项目当前使用 `node:test` + `tsx`。

### 7.1 存放约定

- 测试文件放在根目录 `test/`
- 文件命名：`*.test.ts`

### 7.2 运行测试

```bash
pnpm run test
```

### 7.3 测试目标建议

- 每个路由至少覆盖：
  - 1 个成功用例
  - 1 个参数校验失败用例
  - 关键异常路径（如外部服务失败）
- 断言内容至少包括：
  - HTTP 状态码
  - `success/code/message/data(error)` 结构

## 8. 部署步骤（通用）

以下流程适用于 Linux 服务器（systemd/pm2 均可复用）。

### 8.1 拉取代码并安装依赖

```bash
pnpm install --frozen-lockfile
```

### 8.2 配置生产环境变量

macOS / Linux：

```bash
cp .env.example .env
# 编辑 .env，填入生产值
```

Windows PowerShell：

```powershell
Copy-Item .env.example .env
# 编辑 .env，填入生产值
```

建议至少设置：

- `NODE_ENV=production`
- `PORT=<生产端口>`
- OSS 相关全部变量
- `DB_FILE_URL`
- `REDIS_SERVER`
- JWT 相关全部变量（`JWT_ADMIN_SECRET`、`JWT_CLIENT_SECRET` 等）

### 8.3 构建

```bash
pnpm run build
```

### 8.4 启动

```bash
pnpm run start
```

### 8.5 进程守护（推荐）

可用 `pm2` 示例：

```bash
pm2 start dist/index.js --name south-sound-server
pm2 save
pm2 startup
```

### 8.6 反向代理（可选）

建议在 Nginx/Caddy 前置：

- 统一 TLS
- 统一域名与路由
- 限流与日志聚合

## 9. 新增模块 Checklist

- 新建 `src/routes/<module>/` 三件套文件
- 在 `*.routes.ts` 完成 schema 与响应声明
- 在 `*.handler.ts` 实现业务逻辑
- 在 `src/app.ts` 注册路由前缀
- 为核心接口补充 `test/*.test.ts`
- 本地通过 `pnpm run lint && pnpm run test`

## 10. 已知注意事项

- 环境变量缺失会在启动时直接退出（预期行为）。
- 测试中如果导入 `app` 依赖 `env`，需要在测试前准备必要的 `process.env`。
- 建议保持返回结构稳定，避免前端联调频繁改动。

## 11. License

This project is licensed under the [MIT License](./LICENSE).

You are free to use, modify, distribute, and use this project commercially,
as long as the original copyright and license notice are retained.
