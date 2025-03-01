import { baseElysia } from '@/base'
import { StatsRouteLinkFetchCacheMemoizer } from '@/lib/cache'
import db from '@/lib/db'
import { env } from '@/lib/env'
import { apiKeyAuthorizationMiddleware } from '@/middlewares/auth'
import { defaultRateLimitOptions } from '@/middlewares/rateLimit'
import { LinkEngagementTypeSchema, LinkIdSchema } from '@/types/schemas/link'
import { ApiKeyAuthorizationHeaders } from '@/types/schemas/middleware'
import { logger } from '@/utils/logger'
import {
	fulfillTimeRange,
	TimeRangeError,
	validateTimeRange,
} from '@/utils/time'
import { Responses } from '@nexusog/golakost'
import { until } from '@open-draft/until'
import { ApiKeyPermission, EngagementType } from '@prisma/client'
import { t } from 'elysia'
import { rateLimit } from 'elysia-rate-limit'
import moment from 'moment'
import { LinkStatsCountRoute } from './count'

export const LinkStatsQuerySchema = t.Object({
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

export const LinkStatsRoutes = baseElysia({
	prefix: '/:id/stats',
})
	.use(apiKeyAuthorizationMiddleware([ApiKeyPermission.ENGAGEMENT_READ]))
	.use(
		rateLimit({
			...defaultRateLimitOptions,
			max: env.STATS_RATE_LIMIT,
			duration: env.STATS_RATE_LIMIT_DURATION_MS,
		}),
	)
	.get(
		'',
		async ({ params, error, query, set }) => {
			const { id } = params

			const { since: sinceParsed, until: untilParsed } = fulfillTimeRange(
				query.since ? moment(query.since) : undefined,
				query.until ? moment(query.until) : undefined,
				{
					maxDuration: moment.duration(
						env.LINK_STATS_TIME_RANGE_MAX_DURATION,
						'milliseconds',
					),
				},
			)

			const { error: DurationValidationError, data } =
				await until<TimeRangeError>(async () =>
					validateTimeRange(sinceParsed, untilParsed, {
						maxDuration: moment.duration(
							env.LINK_STATS_TIME_RANGE_MAX_DURATION,
							'milliseconds',
						),
					}),
				)

			if (DurationValidationError) {
				return error(400, {
					error: true,
					message: DurationValidationError.message,
				})
			}

			const cacheKey = `${id}-SINCE:${sinceParsed.format('YYYY-MM-DDTHH:MM')}-UNTIL:${untilParsed.format('YYYY-MM-DDTHH:MM')}`

			// get link record
			const { data: link, error: LinkFetchError } = await until(() =>
				StatsRouteLinkFetchCacheMemoizer.memoize(cacheKey, () =>
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
							engagements: {
								where: {
									createdAt: {
										gte: sinceParsed.toDate(),
										lte: untilParsed.toDate(),
									},
								},
								select: {
									id: true,
									engagementType: true,
									createdAt: true,
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

			const engagements: [number, EngagementType][] =
				link.engagements.map((e) => [
					e.createdAt.getTime(),
					e.engagementType,
				])

			set.headers['cache-control'] =
				`public, max-age=${moment.duration(env.STATS_LINK_FETCH_CACHE_TTL, 'milliseconds').asSeconds()}`

			return {
				error: false,
				message: 'Link stats found',
				data: {
					since: sinceParsed.toDate(),
					until: untilParsed.toDate(),
					id: link.id,
					totalRedirects: engagements.length,
					engagements,
				},
			}
		},
		{
			query: LinkStatsQuerySchema,
			response: {
				200: Responses.ConstructSuccessResponseSchema(
					t.Object({
						since: t.Date(),
						until: t.Date(),
						id: LinkIdSchema,
						totalRedirects: t.Number(),
						engagements: t.Array(
							t.Tuple([
								t.Number({
									description: 'Timestamp',
								}),
								LinkEngagementTypeSchema,
							]),
							{
								examples: [
									[
										[Date.now(), EngagementType.CLICK],
										[Date.now() + 1000, EngagementType.QR],
									],
								],
							},
						),
					}),
				),
				500: Responses.ErrorResponseSchema,
				403: Responses.ErrorResponseSchema,
				400: Responses.ErrorResponseSchema,
				404: Responses.ErrorResponseSchema,
			},
			headers: ApiKeyAuthorizationHeaders,
		},
	)
	.use(LinkStatsCountRoute)
