import { swagger } from '@elysiajs/swagger'
import { baseElysia } from '@/base'
import { logger as NiceLogger } from '@tqman/nice-logger'
import { logger } from '@/utils/logger'
import { V1Routes } from '@/routes/v1'
import { t } from 'elysia'
import cors from '@elysiajs/cors'
import { compression } from 'elysia-compression'

export const app = baseElysia({
	precompile: true,
	name: 'root',
})
	.use(compression())
	.use(
		cors({
			// TODO: allow specific
			origin: '*',
		}),
	)
	.use(
		NiceLogger({
			mode: 'live',
			withTimestamp: () => {
				return new Date().toISOString()
			},
		}),
	)
	.use(
		swagger({
			path: '/swagger',
			documentation: {
				info: {
					title: 'Link API',
					version: '0.0.1',
				},
			},
		}),
	)
	.use(V1Routes)
	.get(
		'/ping',
		() => {
			return 'OK' as const
		},
		{
			response: {
				200: t.Literal('OK'),
			},
		},
	)

// Start the server
const PORT = Bun.env.PORT

if (!PORT) {
	logger.fatal('PORT is not defined, throwing error')
	throw new Error('PORT is not defined')
}

app.listen(PORT, () => {
	logger.success('Server started on port', PORT)
})
