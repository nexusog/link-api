import { baseElysia } from '@/base'
import { LinkCreateRoute } from './create'
import { LinkRedirectRoute } from './redirect'

export const LinksRoutes = baseElysia({
	prefix: '/links',
})
	.use(LinkCreateRoute)
	.use(LinkRedirectRoute)
