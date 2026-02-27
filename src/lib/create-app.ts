import { OpenAPIHono } from '@hono/zod-openapi'
import { serveStatic } from 'hono/serve-static'

export function createRouter() {
    return new OpenAPIHono({
        strict: false,
    })
}

export default function createApp() {
    const app = createRouter()
    // notFound & onError
    app.notFound((c) => {
        return c.json({ message: 'Not Found' }, 404)
    })
    app.onError((err, c) => {
        console.error('Unhandled Error:', err)
        return c.json({ message: 'Internal Server Error' }, 500)
    })
    return app
}
