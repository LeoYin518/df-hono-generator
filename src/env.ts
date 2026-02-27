import process from 'node:process'
import dotenv from 'dotenv'
import dotenvExpand from 'dotenv-expand'
import { z } from 'zod'

dotenvExpand.expand(dotenv.config())

const EnvSchema = z.object({
  NODE_ENV: z.string().default('development'),
  PORT: z.coerce.number().default(3000),
})

export type Env = z.infer<typeof EnvSchema>

const env: Env = (() => {
  try {
    return EnvSchema.parse(process.env)
  }
  catch (e) {
    const error = e as z.ZodError
    console.error('❌ Invalid environment variables:')
    console.error(error.flatten().fieldErrors)
    process.exit(1)
  }
})()

export default env
