import { baseElysia } from '@/base'
import { WorkspacesCreateRoute } from './create'
import { GetWorkspaceByIdRoute } from './getById'
import { WorkspaceStatsRoute } from './stats'

export const WorkspacesRoutes = baseElysia({
	prefix: '/workspaces',
	detail: {
		tags: ['Workspaces'],
	},
})
	.use(WorkspacesCreateRoute)
	.use(GetWorkspaceByIdRoute)
	.use(WorkspaceStatsRoute)
