import { pinoLogger } from 'hono-pino'
import { pino } from 'pino'
import pretty from 'pino-pretty'

const logger = pino(pretty())
export function pinoLog() {
  return pinoLogger({
    pino: logger,
    http: {
      reqId: () => crypto.randomUUID(),
    },
  })
}
