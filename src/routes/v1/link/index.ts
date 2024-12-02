import { baseElysia } from '@/base'
import { LinkCreateRoute } from './create'
import { LinkGetRoute } from './get'
import { LinkRedirectRoute } from './redirect'
import { LinkAccessTokenRoutes } from './access-token'
import { LinkDeleteRoute } from './delete'
import { LinkStatsRoutes } from './stats'

export const LinkRoutes = baseElysia({
	prefix: '/link',
	name: 'LinkRoutes',
})
	.use(LinkCreateRoute)
	.use(LinkGetRoute)
	.use(LinkRedirectRoute)
	.use(LinkStatsRoutes)
	.use(LinkDeleteRoute)
	.use(LinkAccessTokenRoutes)
