import { baseElysia } from '@/base'
import { LinkRoutes } from './link'

export const V1Routes = baseElysia({
	prefix: '/v1',
	name: 'V1Routes',
})
	.use(LinkRoutes)
	.get('/ping', () => {
		return 'OK'
	})
