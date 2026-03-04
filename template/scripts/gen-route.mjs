#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

function toCamelCase(input) {
  return input
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part, index) => {
      if (index === 0)
        return part.toLowerCase()
      return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
    })
    .join('')
}

function toPascalCase(input) {
  return input
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join('')
}

function safeRead(filePath) {
  return fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : ''
}

function parseArgs() {
  const [, , rawModulePath, rawMountPath] = process.argv
  if (!rawModulePath) {
    console.error('Usage: pnpm run gen:route <module-path> [mount-path]')
    console.error('Example: pnpm run gen:route admin-web/category /admin/category')
    process.exit(1)
  }

  const segments = rawModulePath.split('/').filter(Boolean)
  if (segments.length === 0) {
    console.error('Error: module-path is invalid.')
    process.exit(1)
  }

  const moduleName = segments[segments.length - 1]
  if (!/^[a-z0-9][\w-]*$/i.test(moduleName)) {
    console.error('Error: module name only supports letters, numbers, "-" and "_".')
    process.exit(1)
  }

  const mountPath = rawMountPath || `/${segments.join('/')}`
  if (!mountPath.startsWith('/')) {
    console.error('Error: mount-path must start with "/".')
    process.exit(1)
  }

  return { segments, moduleName, mountPath }
}

function buildRoutesTs(moduleName, modulePascalName) {
  return `import { createRoute, z } from '@hono/zod-openapi'
import * as HttpStatusCodes from '@/lib/http-status-codes.js'
import jsonContent from '@/lib/json-content.js'
import { errorSchema, successSchema } from '@/utils/response-schema.js'
import { crudDataSchema } from './schema/${moduleName}.schemas.js'

const tags = ['${moduleName}']

export const list = createRoute({
  path: '/',
  method: 'get',
  tags,
  responses: {
    [HttpStatusCodes.OK]: jsonContent(successSchema.extend({
      data: z.array(crudDataSchema),
    }), 'List ${moduleName}'),
  },
})

export const detail = createRoute({
  path: '/{id}',
  method: 'get',
  tags,
  request: {
    // request.params 对应 URL 的 path 参数（例如 /:id）
    params: z.object({
      id: z.string(),
    }),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(successSchema.extend({
      data: crudDataSchema,
    }), 'Detail ${moduleName}'),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(errorSchema, '${moduleName} not found'),
  },
})

export const create = createRoute({
  path: '/',
  method: 'post',
  tags,
  request: {
    body: jsonContent(z.object({}).passthrough(), 'Create ${moduleName} request body'),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(successSchema.extend({
      data: crudDataSchema,
    }), 'Create ${moduleName}'),
    [HttpStatusCodes.BAD_REQUEST]: jsonContent(errorSchema, 'Create ${moduleName} failed'),
  },
})

export const update = createRoute({
  path: '/{id}',
  method: 'put',
  tags,
  request: {
    // request.params 对应 URL 的 path 参数（例如 /:id）
    params: z.object({
      id: z.string(),
    }),
    body: jsonContent(z.object({}).passthrough(), 'Update ${moduleName} request body'),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(successSchema.extend({
      data: crudDataSchema,
    }), 'Update ${moduleName}'),
    [HttpStatusCodes.BAD_REQUEST]: jsonContent(errorSchema, 'Update ${moduleName} failed'),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(errorSchema, '${moduleName} not found'),
  },
})

export const remove = createRoute({
  path: '/{id}',
  method: 'delete',
  tags,
  request: {
    // request.params 对应 URL 的 path 参数（例如 /:id）
    params: z.object({
      id: z.string(),
    }),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(successSchema.extend({
      data: z.null(),
    }), 'Delete ${moduleName}'),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(errorSchema, '${moduleName} not found'),
  },
})

export type List${modulePascalName}Route = typeof list
export type Detail${modulePascalName}Route = typeof detail
export type Create${modulePascalName}Route = typeof create
export type Update${modulePascalName}Route = typeof update
export type Remove${modulePascalName}Route = typeof remove
`
}

function buildModuleSchemaTs() {
  return `import { z } from '@hono/zod-openapi'

export const crudDataSchema = z.object({
  id: z.string().or(z.number()),
}).passthrough()
`
}

function buildHandlerTs(moduleName, modulePascalName) {
  return `import type {
  Create${modulePascalName}Route,
  Detail${modulePascalName}Route,
  List${modulePascalName}Route,
  Remove${modulePascalName}Route,
  Update${modulePascalName}Route,
} from './${moduleName}.routes.js'
import type { AppRouteHandler } from '@/lib/types.js'
import { ok } from '@/lib/response.js'

export const list: AppRouteHandler<List${modulePascalName}Route> = async (c) => {
  // TODO: implement ${moduleName} list
  return ok(c, [])
}

export const detail: AppRouteHandler<Detail${modulePascalName}Route> = async (c) => {
  // TODO: implement ${moduleName} detail
  const { id } = c.req.valid('param')
  return ok(c, { id })
}

export const create: AppRouteHandler<Create${modulePascalName}Route> = async (c) => {
  // TODO: implement ${moduleName} create
  const payload = await c.req.json()
  return ok(c, payload)
}

export const update: AppRouteHandler<Update${modulePascalName}Route> = async (c) => {
  // TODO: implement ${moduleName} update
  const { id } = c.req.valid('param')
  const payload = await c.req.json()
  return ok(c, { id, ...payload })
}

export const remove: AppRouteHandler<Remove${modulePascalName}Route> = async (c) => {
  // TODO: implement ${moduleName} remove
  const { id } = c.req.valid('param')
  void id
  return ok(c, null)
}
`
}

function buildIndexTs(moduleName) {
  return `import { createRouter } from '@/lib/create-app.js'
import * as handlers from './${moduleName}.handler.js'
import * as routes from './${moduleName}.routes.js'

const router = createRouter()
  .openapi(routes.list, handlers.list)
  .openapi(routes.detail, handlers.detail)
  .openapi(routes.create, handlers.create)
  .openapi(routes.update, handlers.update)
  .openapi(routes.remove, handlers.remove)

export default router
`
}

function appendImport(appTs, importStatement) {
  if (appTs.includes(importStatement))
    return appTs

  const importLines = [...appTs.matchAll(/^import .+$/gm)]
  if (importLines.length === 0)
    return `${importStatement}\n${appTs}`

  const lastImport = importLines[importLines.length - 1]
  const insertIndex = (lastImport.index ?? 0) + lastImport[0].length
  return `${appTs.slice(0, insertIndex)}\n${importStatement}${appTs.slice(insertIndex)}`
}

function appendRouteItem(appTs, routeLine) {
  if (appTs.includes(routeLine))
    return appTs

  const routesRegex = /const routes\s*=\s*\[(?<content>[\s\S]*?)\]/m
  const match = appTs.match(routesRegex)
  if (match && match.groups) {
    const full = match[0]
    const content = match.groups.content ?? ''
    const nextContent = content.trim() === ''
      ? `\n${routeLine}\n`
      : `${content}\n${routeLine}`
    const nextFull = `const routes = [${nextContent}]`
    return appTs.replace(full, nextFull)
  }

  const fallbackBlock = `const routes = [
${routeLine}
]

routes.forEach(({ path, router }) => {
  app.route(path, router)
})
`

  if (appTs.includes('export default app')) {
    return appTs.replace('export default app', `${fallbackBlock}\nexport default app`)
  }

  return `${appTs}\n${fallbackBlock}`
}

function upsertAppRoute(appTsPath, importStatement, routeLine) {
  const original = safeRead(appTsPath)
  if (!original) {
    console.warn('Warn: src/app.ts not found, skip route registration.')
    return
  }

  const withImport = appendImport(original, importStatement)
  const withRoute = appendRouteItem(withImport, routeLine)

  if (withRoute === original)
    return

  fs.writeFileSync(appTsPath, withRoute, 'utf8')
}

function main() {
  const { segments, moduleName, mountPath } = parseArgs()
  const modulePascalName = toPascalCase(moduleName)
  const importName = toCamelCase(segments.join('-'))
  const moduleDir = path.resolve(process.cwd(), 'src', 'routes', ...segments)
  const schemaDir = path.join(moduleDir, 'schema')

  fs.mkdirSync(moduleDir, { recursive: true })
  fs.mkdirSync(schemaDir, { recursive: true })

  const routesPath = path.join(moduleDir, `${moduleName}.routes.ts`)
  const handlerPath = path.join(moduleDir, `${moduleName}.handler.ts`)
  const indexPath = path.join(moduleDir, `${moduleName}.index.ts`)
  const schemaPath = path.join(schemaDir, `${moduleName}.schemas.ts`)

  const files = [routesPath, handlerPath, indexPath, schemaPath]
  const existed = files.filter(file => fs.existsSync(file))
  if (existed.length > 0) {
    console.error('Error: target files already exist:')
    existed.forEach(file => console.error(`  - ${path.relative(process.cwd(), file)}`))
    process.exit(1)
  }

  fs.writeFileSync(routesPath, buildRoutesTs(moduleName, modulePascalName), 'utf8')
  fs.writeFileSync(handlerPath, buildHandlerTs(moduleName, modulePascalName), 'utf8')
  fs.writeFileSync(indexPath, buildIndexTs(moduleName), 'utf8')
  fs.writeFileSync(schemaPath, buildModuleSchemaTs(), 'utf8')

  const appTsPath = path.resolve(process.cwd(), 'src', 'app.ts')
  const importStatement = `import ${importName} from '@/routes/${segments.join('/')}/${moduleName}.index.js'`
  const routeLine = `  { path: '${mountPath}', router: ${importName} },`

  upsertAppRoute(appTsPath, importStatement, routeLine)

  console.log(`Generated module: src/routes/${segments.join('/')}`)
  console.log(`Registered route: ${mountPath} -> ${importName}`)
}

main()
