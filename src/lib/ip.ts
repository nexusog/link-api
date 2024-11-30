import { env } from '@/utils/env'
import { globalize } from '@/utils/globalize'
import IPinfoWrapper, { LruCache } from 'node-ipinfo'

export const cache = globalize(
	'IPINFO_LRU_CACHE',
	() =>
		new LruCache({
			max: 5000,
			ttl: 1000 * 60 * 60 * 1, // 1 hour,
		}),
)

export const ipInfoWrapper = new IPinfoWrapper(
	env.get('IPINFO_TOKEN'),
	cache,
	0,
)
