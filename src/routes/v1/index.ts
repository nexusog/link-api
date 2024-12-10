import { baseElysia } from '@/base'
import { WorkspacesRoutes } from './workspaces'
import { ApiKeysRoutes } from './api-keys'

export const V1Routes = baseElysia({
	prefix: '/v1',
	name: 'V1Routes',
})
	.use(WorkspacesRoutes)
	.use(ApiKeysRoutes)
