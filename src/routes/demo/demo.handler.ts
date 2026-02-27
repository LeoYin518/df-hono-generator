import type { RouteHandler } from "@hono/zod-openapi";
import type { ListRoute } from "./demo.routes.js";

export const list: RouteHandler<ListRoute> = (c) => {
    throw new Error("Function not implemented.");
    return c.json({
        data: [
            { id: 1001, title: "Demo 1" },
            { id: 1002, title: "Demo 2" },
            { id: 1003, title: "Demo 3" },
        ]
    })
}