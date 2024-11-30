import { baseElysia } from '@/base'
import { LinkAccessTokenCreateRoute } from './create'
import { LinkAccessTokenDeleteRoute } from './delete'

export const LinkAccessTokenRoutes = baseElysia({
	prefix: '/:id/access-token',
	name: 'AccessTokenRoutes',
})
	.use(LinkAccessTokenCreateRoute)
	.use(LinkAccessTokenDeleteRoute)
