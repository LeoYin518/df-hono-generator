# df-hono-generator

基于 `Hono + TypeScript + Zod OpenAPI` 的后端服务模板。

## 快速开发（先看这部分）

### 1) 环境要求

- Node.js `>= 20`
- pnpm `>= 8`

### 2) 安装依赖

```bash
pnpm install
```

### 3) 准备环境文件

macOS / Linux：

```bash
cp .env.example .env
```

Windows PowerShell：

```powershell
Copy-Item .env.example .env
```

然后补齐 `.env`（必填项见下文「环境变量说明」）。

### 4) 初始化数据库

```bash
npx drizzle-kit push
```

说明：

- 会按 `src/db/schema.ts` 将表结构同步到 `DB_FILE_URL` 指向的 SQLite 文件。
- 默认 `DB_FILE_URL=./src/db/dev.db`。

### 5) 运行种子文件

```bash
pnpm run seed
```

默认会写入一个管理员账号（见 `src/db/seeds/index.ts`）。

### 6) 启动项目

```bash
pnpm run dev
```

- 服务地址：`http://localhost:3000`
- OpenAPI JSON：`GET /doc`
- Scalar UI：`GET /scalar`

### 7) 快速创建接口（CRUD 路由三件套）

```bash
pnpm run gen:route admin-web/category
pnpm run gen:route admin-web/category /admin/category
```

脚本会自动生成并注册：

- `<module>.routes.ts`：路由与 schema
- `<module>.handler.ts`：业务逻辑
- `<module>.index.ts`：路由聚合

### 8) 5 分钟自检流程

```bash
pnpm install
cp .env.example .env
npx drizzle-kit push
pnpm run seed
pnpm run dev
```

访问 `http://localhost:3000/scalar`，能打开文档页即表示模板可用。

## 常用命令

```bash
pnpm run dev      # 开发模式（tsx watch）
pnpm run build    # TypeScript 构建到 dist
pnpm run start    # 运行构建产物
pnpm run gen:route <module-path> [mount-path] # 生成 CRUD 路由三件套并自动注册到 app.ts
pnpm run seed     # 运行种子数据
npx drizzle-kit push # 同步 schema 到数据库（SQLite）
pnpm run lint     # 代码检查
pnpm run lint:fix # 自动修复格式与部分 lint 问题
pnpm run test     # 运行测试（node:test + tsx）
```

## 环境变量说明

环境变量由 [`src/env.ts`](src/env.ts) 使用 Zod 在启动时校验，不满足要求会直接退出进程。

| 变量名                          | 必填 | 默认值                                      | 说明                               |
| ------------------------------- | ---- | ------------------------------------------- | ---------------------------------- |
| `NODE_ENV`                      | 否   | `development`                               | 运行环境                           |
| `PORT`                          | 否   | `3000`                                      | 服务端口                           |
| `OSS_ACCESS_KEY_ID`             | 是   | -                                           | 阿里云 OSS AccessKey ID            |
| `OSS_ACCESS_KEY_SECRET`         | 是   | -                                           | 阿里云 OSS AccessKey Secret        |
| `OSS_BUCKET`                    | 是   | -                                           | OSS Bucket 名称                    |
| `OSS_REGION`                    | 是   | -                                           | OSS Region，例如 `oss-cn-hangzhou` |
| `OSS_BASE_URL`                  | 是   | -                                           | OSS 对外访问基础地址               |
| `DB_FILE_URL`                   | 否   | `./src/db/dev.db`                           | SQLite 文件路径                    |
| `REDIS_SERVER`                  | 否   | `redis://default:123456@localhost:6379`     | Redis 连接串                       |
| `JWT_ADMIN_SECRET`              | 是   | -                                           | 管理端 JWT 密钥                    |
| `JWT_ADMIN_EXPIRES_IN_SECONDS`  | 否   | `86400`                                     | 管理端 JWT 过期秒数（最小 60）     |
| `JWT_CLIENT_SECRET`             | 是   | -                                           | 客户端 JWT 密钥                    |
| `JWT_CLIENT_EXPIRES_IN_SECONDS` | 否   | `86400`                                     | 客户端 JWT 过期秒数（最小 60）     |

说明：

- “必填”以 [`src/env.ts`](src/env.ts) 的 Zod schema 是否提供默认值为准。
- 生产环境建议显式配置全部关键变量，避免不同环境行为不一致。

## 目录约定

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
  *.test.ts                 # 集成/接口测试
```

## 路由规范

- 使用 `@hono/zod-openapi` 的 `createRoute` 声明路由。
- 每个接口至少声明：`path`、`method`、`tags`、`responses`。
- 有请求体时必须提供 Zod schema，保证自动校验与文档生成。

## 响应与错误码规范

成功响应结构（`ok()`）：

```json
{
  "success": true,
  "code": 0,
  "message": "操作成功",
  "data": {}
}
```

失败响应结构（`fail()`）：

```json
{
  "success": false,
  "code": 400,
  "message": "参数校验失败",
  "error": {}
}
```

建议错误码：

- `400` 参数错误
- `401` 未认证
- `403` 无权限
- `404` 资源不存在
- `409` 资源冲突
- `422` 语义校验失败
- `500` 服务内部错误

## 测试规范

- 测试文件位于根目录 `test/`，命名为 `*.test.ts`。
- 运行命令：`pnpm run test`。
- 每个路由建议覆盖成功用例、参数校验失败用例、关键异常路径。

## 部署步骤（通用）

```bash
pnpm install --frozen-lockfile
cp .env.example .env
pnpm run build
pnpm run start
```

生产环境建议设置：

- `NODE_ENV=production`
- `PORT=<生产端口>`
- OSS 相关变量
- `DB_FILE_URL`
- `REDIS_SERVER`
- JWT 相关变量（`JWT_ADMIN_SECRET`、`JWT_CLIENT_SECRET` 等）

## 已知注意事项

- 环境变量缺失会在启动时直接退出（预期行为）。
- 若数据库表不存在，请先执行 `npx drizzle-kit push`。
- 种子脚本会插入固定管理员账号，如重复执行可能触发唯一约束冲突。
- 测试中若导入 `app` 依赖 `env`，需要在测试前准备必要的 `process.env`。

## License

This project is licensed under the [MIT License](./LICENSE).
