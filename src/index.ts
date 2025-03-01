import { swagger } from '@elysiajs/swagger'
import { baseElysia } from '@/base'
import { logger as NiceLogger } from '@tqman/nice-logger'
import { logger } from '@/utils/logger'
import { V1Routes } from '@/routes/v1'
import { t } from 'elysia'
import cors from '@elysiajs/cors'
import { compression } from 'elysia-compression'
import { env } from '@/lib/env'
import { ip } from 'elysia-ip'
import { etag } from '@bogeychan/elysia-etag'

export const app = baseElysia({
	precompile: true,
	name: 'root',
})
	.use(compression())
	.use(ip())
	.use(
		etag({
			serialize(response) {
				if (typeof response === 'object') {
					return JSON.stringify(response)
				}
			},
		}),
	)
	.use(
		cors({
			origin:
				env.CROSS_ORIGINS === '*'
					? '*'
					: env.CROSS_ORIGINS.split(',').map((e) => e.trim()),
		}),
	)
	.use(
		NiceLogger({
			mode: 'live',
			withTimestamp: () => {
				return new Date().toISOString()
			},
			enabled: env.TRAFFIC_LOG,
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
			detail: {
				tags: ['Misc'],
			},
		},
	)

// Start the server
app.listen(env.PORT, () => {
	logger.success('Server started on port', env.PORT)
})
