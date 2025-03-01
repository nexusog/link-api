import TTLCache from '@isaacs/ttlcache'
import { Modules } from '@nexusog/golakost'
import { EngagementType } from '@prisma/client'
import moment from 'moment'
import { env } from './env'

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
				ttl: moment
					.duration(env.REDIRECT_LINK_FETCH_CACHE_TTL, 'milliseconds')
					.asMilliseconds(),
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
				ttl: moment
					.duration(env.STATS_LINK_FETCH_CACHE_TTL, 'milliseconds')
					.asMilliseconds(),
			}),
			{
				get: (cache, key) => cache.get(key),
				set: (cache, key, value) => cache.set(key, value),
			},
		),
)

type StatsCountsRouteLinkFetchCacheValue = {
	id: string
	url: string
	_count: {
		engagements: number
	}
} | null
export const StatsCountRouteLinkFetchCacheMemoizer = Modules.globalize(
	'StatsCountRouteLinkFetchCacheMemoizer',
	() =>
		new Modules.FlexibleMemoizer<
			TTLCache<string, StatsCountsRouteLinkFetchCacheValue>,
			StatsCountsRouteLinkFetchCacheValue,
			string
		>(
			new TTLCache({
				max: 1000,
				ttl: moment
					.duration(
						env.STATS_COUNT_LINK_FETCH_CACHE_TTL,
						'milliseconds',
					)
					.asMilliseconds(),
			}),
			{
				get: (cache, key) => cache.get(key),
				set: (cache, key, value) => cache.set(key, value),
			},
		),
)
