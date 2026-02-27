import { serve } from '@hono/node-server'
import { Hono } from 'hono'

const app = new Hono()

app.get('/', (c) => {
  // 修改成返回 json 格式
  return c.json({
    message: 'hello',
  })
})

serve({
  fetch: app.fetch,
  port: 3000,
}, (info) => {
  console.warn(`Server is running on http://localhost:${info.port}`)
})
