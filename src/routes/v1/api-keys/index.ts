import { baseElysia } from '@/base'
import { ApiKeyCreateRoute } from './create'
import { ApiKeyGetRoute } from './get'

export const ApiKeysRoutes = baseElysia({
	prefix: '/api-keys',
	detail: {
		tags: ['API Keys'],
	},
})
	.use(ApiKeyCreateRoute)
	.use(ApiKeyGetRoute)
