import { baseElysia } from '@/base'
import { LinkCreateRoute } from './create'
import { LinkGetRoute } from './get'
import { LinkRedirectRoute } from './redirect'
import { LinkAccessTokenRoutes } from './access-token'
import { LinkDeleteRoute } from './delete'

export const LinkRoutes = baseElysia({
	prefix: '/link',
	name: 'LinkRoutes',
})
	.use(LinkCreateRoute)
	.use(LinkGetRoute)
	.use(LinkRedirectRoute)
	.use(LinkDeleteRoute)
	.use(LinkAccessTokenRoutes)
