import { baseElysia } from '@/base'
import { WorkspacesCreateRoute } from './create'

export const WorkspacesRoutes = baseElysia({
	prefix: '/workspaces',
	detail: {
		tags: ['Workspaces'],
	},
}).use(WorkspacesCreateRoute)
