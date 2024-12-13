import { baseElysia } from '@/base'
import { RedirectRouteLinkFetchCache } from '@/lib/cache'
import db from '@/lib/db'
import { env } from '@/lib/env'
import { defaultRateLimitOptions } from '@/middlewares/rateLimit'
import { GeneralErrorResponseSchema } from '@/types/response'
import { LinkEngagementTypeSchema } from '@/types/schemas/link'
import { logger } from '@/utils/logger'
import { memoize } from '@/utils/memoize'
import { until } from '@open-draft/until'
import { redirect, t } from 'elysia'
import { rateLimit } from 'elysia-rate-limit'

const LinkRedirectQuerySchema = t.Object({
	type: t.Optional(LinkEngagementTypeSchema),
})

export const LinkRedirectRoute = baseElysia()
	.use(
		rateLimit({
			...defaultRateLimitOptions,
			max: env.REDIRECT_RATE_LIMIT,
			duration: env.REDIRECT_RATE_LIMIT_DURATION_MS,
		}),
	)
	.get(
		'/:id/redirect',
		async ({ query, params, error: sendError }) => {
			const { id } = params
			const { type } = query

			// get link record
			const { data: link, error: LinkFetchError } = await until(() =>
				memoize(RedirectRouteLinkFetchCache, id, () =>
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
						},
					}),
				),
			)

			if (LinkFetchError) {
				logger.error(LinkFetchError)
				return sendError(500, {
					error: true,
					message: 'Database error',
				})
			}

			if (!link) {
				return sendError(404, {
					error: true,
					message: 'Link not found',
				})
			}

			until(() =>
				db.engagement.create({
					data: {
						link: {
							connect: {
								id: link.id,
							},
						},
						engagementType: type,
					},
					select: {
						id: true,
					},
				}),
			).then(({ error: LinkEngagementCreateError }) => {
				if (LinkEngagementCreateError) {
					logger.fail(
						`Failed to create link engagement (ID: ${link.id}, Type: ${type})`,
						LinkEngagementCreateError,
					)
				}
			})

			return redirect(link.url, 307)
		},
		{
			query: LinkRedirectQuerySchema,
			response: {
				307: t.Object({}),
				500: GeneralErrorResponseSchema,
				404: GeneralErrorResponseSchema,
			},
			detail: {
				description: 'Redirect to URL of a short link',
			},
		},
	)
