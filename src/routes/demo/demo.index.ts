import { createRouter } from "@/lib/create-app.js";
import * as handlers from "./demo.handler.js";
import * as routes from "./demo.routes.js";

const router = createRouter()
    .openapi(routes.list, handlers.list)

export default router