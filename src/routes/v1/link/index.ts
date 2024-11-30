import { baseElysia } from '@/base'
import { LinkCreateRoute } from './create'
import { LinkGetRoute } from './get'
import { LinkRedirectRoute } from './redirect'

export const LinkRoutes = baseElysia({
	prefix: '/link',
	name: 'IdRoutes',
})
	.use(LinkCreateRoute)
	.use(LinkGetRoute)
	.use(LinkRedirectRoute)
