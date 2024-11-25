import { baseElysia } from '@/base'
import { LinkCreateRoute } from './create'

export const LinkRoutes = baseElysia({
	prefix: '/link',
	name: 'IdRoutes',
}).use(LinkCreateRoute)
