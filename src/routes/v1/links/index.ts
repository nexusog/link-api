import { baseElysia } from '@/base'
import { LinkCreateRoute } from './create'
import { LinkRedirectRoute } from './redirect'
import { LinkGetRoute } from './get'
import { LinkDeleteRoute } from './delete'
import { LinkStatsRoutes } from './stats'
import { LinkPatchRoute } from './patch'

export const LinksRoutes = baseElysia({
	prefix: '/links',
	detail: {
		tags: ['Links'],
	},
})
	.use(LinkCreateRoute)
	.use(LinkGetRoute)
	.use(LinkRedirectRoute)
	.use(LinkStatsRoutes)
	.use(LinkDeleteRoute)
	.use(LinkPatchRoute)
