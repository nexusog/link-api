import { baseElysia } from '@/base'
import { LinkRoutes } from './link'
import { APIKeyRoutes } from './api-key'

export const V1Routes = baseElysia({
	prefix: '',
	name: 'V1Routes',
})
	.use(APIKeyRoutes)
	.use(LinkRoutes)
