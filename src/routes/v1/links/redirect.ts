import { baseElysia } from '@/base'
import { RedirectRouteLinkFetchCacheMemoizer } from '@/lib/cache'
import db from '@/lib/db'
import { env } from '@/lib/env'
import { defaultRateLimitOptions } from '@/middlewares/rateLimit'
import { LinkEngagementTypeSchema } from '@/types/schemas/link'
import { logger } from '@/utils/logger'
import { Responses } from '@nexusog/golakost'
import { until } from '@open-draft/until'
import { redirect, t } from 'elysia'
import { rateLimit } from 'elysia-rate-limit'
import moment from 'moment'

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
		async ({ query, params, error: sendError, set }) => {
			const { id } = params
			const { type } = query

			// get link record
			const { data: link, error: LinkFetchError } = await until(() =>
				RedirectRouteLinkFetchCacheMemoizer.memoize(id, () =>
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

			set.headers['cache-control'] =
				`public, max-age=${moment.duration(env.REDIRECT_LINK_FETCH_CACHE_TTL, 'milliseconds').asSeconds()}`

			return redirect(link.url, 307)
		},
		{
			query: LinkRedirectQuerySchema,
			response: {
				307: t.Object({}),
				500: Responses.ErrorResponseSchema,
				404: Responses.ErrorResponseSchema,
			},
			detail: {
				description: 'Redirect to URL of a short link',
			},
		},
	)
