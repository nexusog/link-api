import { baseElysia } from '@/base'
import {
	StatsCountRouteLinkFetchCacheMemoizer,
	StatsRouteLinkFetchCacheMemoizer,
} from '@/lib/cache'
import db from '@/lib/db'
import { env } from '@/lib/env'
import { LinkIdSchema } from '@/types/schemas/link'
import { ApiKeyAuthorizationHeaders } from '@/types/schemas/middleware'
import { logger } from '@/utils/logger'
import {
	fulfillTimeRange,
	TimeRangeError,
	validateTimeRange,
} from '@/utils/time'
import { Responses } from '@nexusog/golakost'
import { until } from '@open-draft/until'
import { t } from 'elysia'
import moment from 'moment'

export const LinkStatsCountQuerySchema = t.Object({
	since: t.Optional(
		t.String({
			format: 'date-time',
		}),
	),
	until: t.Optional(
		t.String({
			format: 'date-time',
		}),
	),
})

export const LinkStatsCountRoute = baseElysia().get(
	'/count',
	async ({ params, query, error, set }) => {
		const { id } = params

		const { since: sinceParsed, until: untilParsed } = fulfillTimeRange(
			query.since ? moment(query.since) : undefined,
			query.until ? moment(query.until) : undefined,
			{
				maxDuration: moment.duration(Infinity),
			},
		)

		console.log('sinceParsed', sinceParsed)
		console.log('untilParsed', untilParsed)

		const cacheKey = `${id}-SINCE:${sinceParsed.format('YYYY-MM-DDTHH:MM')}-UNTIL:${untilParsed.format('YYYY-MM-DDTHH:MM')}`

		// get link record
		const { data: link, error: LinkFetchError } = await until(() =>
			StatsCountRouteLinkFetchCacheMemoizer.memoize(cacheKey, () =>
				db.link.findFirst({
					where: {
						OR: [
							{
								id,
							},
							{
								shortName: id,
							},
						],
					},
					select: {
						id: true,
						url: true,
						_count: {
							select: {
								engagements: {
									where: {
										createdAt: {
											gte: sinceParsed.toDate(),
											lte: untilParsed.toDate(),
										},
									},
								},
							},
						},
					},
				}),
			),
		)

		if (LinkFetchError) {
			logger.error(LinkFetchError)
			return error(500, {
				error: true,
				message: 'Database error',
			})
		}

		if (!link) {
			return error(404, {
				error: true,
				message: 'Link not found',
			})
		}

		set.headers['cache-control'] =
			`public, max-age=${moment.duration(env.STATS_COUNT_LINK_FETCH_CACHE_TTL, 'milliseconds').asSeconds()}`

		return {
			error: false,
			message: 'Count stats count found',
			data: {
				since: sinceParsed.toDate(),
				until: untilParsed.toDate(),
				id: link.id,
				totalRedirects: link._count.engagements,
			},
		}
	},
	{
		headers: ApiKeyAuthorizationHeaders,
		params: t.Object({
			id: LinkIdSchema,
		}),
		query: LinkStatsCountQuerySchema,
		response: {
			200: Responses.ConstructSuccessResponseSchema(
				t.Object({
					since: t.Date(),
					until: t.Date(),
					id: LinkIdSchema,
					totalRedirects: t.Number(),
				}),
			),
			500: Responses.ErrorResponseSchema,
			404: Responses.ErrorResponseSchema,
		},
	},
)
