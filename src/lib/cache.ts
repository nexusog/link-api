import { globalize } from '@/utils/globalize'
import TTLCache from '@isaacs/ttlcache'
import moment from 'moment'

export const RedirectRouteLinkFetchCache = globalize(
	'RedirectRouteLinkFetchCache',
	() =>
		new TTLCache<string, any>({
			max: 1000,
			ttl: moment.duration(1, 'minute').asMilliseconds(),
		}),
)

export const StatsRouteLinkFetchCache = globalize(
	'StatsRouteLinkFetchCache',
	() =>
		new TTLCache<string, any>({
			max: 1000,
			ttl: moment.duration(30, 'seconds').asMilliseconds(),
		}),
)
