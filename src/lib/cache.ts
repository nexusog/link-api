import TTLCache from '@isaacs/ttlcache'
import { Modules } from '@nexusog/golakost'
import { EngagementType } from '@prisma/client'
import moment from 'moment'

type RedirectRouteLinkFetchCacheValue = {
	id: string
	url: string
} | null
export const RedirectRouteLinkFetchCacheMemoizer = Modules.globalize(
	'RedirectRouteLinkFetchCacheMemoizer',
	() =>
		new Modules.FlexibleMemoizer<
			TTLCache<string, RedirectRouteLinkFetchCacheValue>,
			RedirectRouteLinkFetchCacheValue,
			string
		>(
			new TTLCache<string, RedirectRouteLinkFetchCacheValue>({
				max: 1000,
				ttl: moment.duration(1, 'minute').asMilliseconds(),
			}),
			{
				get: (cache, key) => cache.get(key),
				set: (cache, key, value) => cache.set(key, value),
			},
		),
)

type StatsRouteLinkFetchCacheValue = {
	id: string
	url: string
	engagements: {
		id: string
		engagementType: EngagementType
		createdAt: Date
	}[]
} | null
export const StatsRouteLinkFetchCacheMemoizer = Modules.globalize(
	'StatsRouteLinkFetchCacheMemoizer',
	() =>
		new Modules.FlexibleMemoizer<
			TTLCache<string, StatsRouteLinkFetchCacheValue>,
			StatsRouteLinkFetchCacheValue,
			string
		>(
			new TTLCache({
				max: 1000,
				ttl: moment.duration(30, 'seconds').asMilliseconds(),
			}),
			{
				get: (cache, key) => cache.get(key),
				set: (cache, key, value) => cache.set(key, value),
			},
		),
)
