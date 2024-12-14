import { baseElysia } from '@/base'
import db from '@/lib/db'
import { apiKeyAuthorizationMiddleware } from '@/middlewares/auth'
import {
	ConstructSuccessResponseSchemaWithData,
	GeneralErrorResponseSchema,
} from '@/types/response'
import { LinkEngagementTypeSchema, LinkIdSchema } from '@/types/schemas/link'
import { ApiKeyAuthorizationHeaders } from '@/types/schemas/middleware'
import { logger } from '@/utils/logger'
import { until } from '@open-draft/until'
import { ApiKeyPermission, EngagementType } from '@prisma/client'
import { t } from 'elysia'
import moment from 'moment'

export const LinkStatsQuerySchema = t.Object({
	since: t.Optional(
		t.String({
			format: 'date',
		}),
	),
	until: t.Optional(
		t.String({
			format: 'date',
		}),
	),
})

export const LinkStatsRoute = baseElysia()
	.use(apiKeyAuthorizationMiddleware([ApiKeyPermission.ENGAGEMENT_READ]))
	.get(
		'/:id/stats',
		async ({ params, error, query }) => {
			const { id } = params

			// Default duration of 1 month
			const MaxDuration = moment.duration(1, 'month')

			// Parse dates or calculate defaults
			const untilParsed = query.until
				? moment(query.until)
				: query.since
					? moment(query.since).add(MaxDuration)
					: moment()

			const sinceParsed = query.since
				? moment(query.since)
				: untilParsed.clone().subtract(MaxDuration)

			// Validate parsed dates
			if (!sinceParsed.isValid() || !untilParsed.isValid()) {
				return error(400, {
					error: true,
					message: "Invalid 'since' or 'until' date provided",
				})
			}

			// Ensure the difference is less than 1 month
			if (untilParsed.diff(sinceParsed, 'months', true) > 1) {
				return error(400, {
					error: true,
					message:
						"The difference between 'since' and 'until' must be less than 1 month",
				})
			}

			// get link record
			const { data: link, error: LinkFetchError } = await until(() =>
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

			return {
				error: false,
				message: 'Link stats found',
				data: {
					id: link.id,
					totalRedirects: engagements.length,
					engagements,
				},
			}
		},
		{
			query: LinkStatsQuerySchema,
			response: {
				200: ConstructSuccessResponseSchemaWithData(
					t.Object({
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
				500: GeneralErrorResponseSchema,
				403: GeneralErrorResponseSchema,
				400: GeneralErrorResponseSchema,
				404: GeneralErrorResponseSchema,
			},
			headers: ApiKeyAuthorizationHeaders,
		},
	)