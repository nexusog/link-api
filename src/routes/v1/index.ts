import { baseElysia } from '@/base'
import { WorkspacesRoutes } from './workspaces'
import { ApiKeysRoutes } from './api-keys'
import { LinksRoutes } from './links'

export const V1Routes = baseElysia({
	prefix: '/v1',
	name: 'V1Routes',
})
	.use(WorkspacesRoutes)
	.use(ApiKeysRoutes)
	.use(LinksRoutes)
