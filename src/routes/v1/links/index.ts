import { baseElysia } from '@/base'
import { LinkCreateRoute } from './create'
import { LinkRedirectRoute } from './redirect'
import { LinkGetRoute } from './get'
import { LinkStatsRoute } from './stats'

export const LinksRoutes = baseElysia({
	prefix: '/links',
})
	.use(LinkCreateRoute)
	.use(LinkGetRoute)
	.use(LinkRedirectRoute)
	.use(LinkStatsRoute)
