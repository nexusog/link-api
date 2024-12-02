import { baseElysia } from '@/base'
import { CreateAPIKeyRoute } from './create'

export const APIKeyRoutes = baseElysia({
	prefix: '/api-key',
	name: 'ApiKeyRoutes',
}).use(CreateAPIKeyRoute)
