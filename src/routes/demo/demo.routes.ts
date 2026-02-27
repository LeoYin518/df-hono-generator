import { createRoute, z } from "@hono/zod-openapi";

const tags = ["Demo"];

export const list = createRoute({
    path: "/demo",
    method: "get",
    tags,
    responses: {
        200: {
            description: "List of Demo",
            content: {
                "application/json": {
                    schema: z.object({
                        data: z.array(z.object({
                            id: z.number(),
                            title: z.string()
                        }))
                    })
                }
            }
        }
    }
})

export type ListRoute = typeof list