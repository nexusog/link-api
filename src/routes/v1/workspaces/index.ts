import { baseElysia } from '@/base'
import { WorkspacesCreateRoute } from './create'
import { GetWorkspaceByIdRoute } from './getById'

export const WorkspacesRoutes = baseElysia({
	prefix: '/workspaces',
	detail: {
		tags: ['Workspaces'],
	},
})
	.use(WorkspacesCreateRoute)
	.use(GetWorkspaceByIdRoute)
