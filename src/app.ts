import { configureOpenAPI } from '@/lib/configure-open-api.js'
import createApp from '@/lib/create-app.js'

const app = createApp()

configureOpenAPI(app)

export default app
