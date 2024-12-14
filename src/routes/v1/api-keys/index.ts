import { baseElysia } from '@/base'
import { ApiKeyCreateRoute } from './create'

export const ApiKeysRoutes = baseElysia({
	prefix: '/api-keys',
}).use(ApiKeyCreateRoute)
