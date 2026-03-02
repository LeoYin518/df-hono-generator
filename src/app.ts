import { configureOpenAPI } from '@/lib/configure-open-api.js'
import createApp from '@/lib/create-app.js'
import adminAuth from '@/routes/admin-web/auth/auth.index.js'
import demo from '@/routes/demo/demo.index.js'
import alioss from '@/routes/oss/alioss.index.js'
import { requireAdminAuth, requireEitherAuth } from './middleware/auth.js'

const app = createApp()

configureOpenAPI(app)

// 启用中间件
app.use('/admin/*', requireAdminAuth())
app.use('/oss/*', requireEitherAuth())

// 定义路由数组
const routes = [
  { path: '/test', router: demo },
  { path: '/oss', router: alioss },
  { path: '/admin/auth', router: adminAuth },
]

// 注册所有路由
routes.forEach(({ path, router }) => {
  app.route(path, router)
})

export default app
