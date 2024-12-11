import { baseElysia } from '@/base'
import db from '@/lib/db'
import { GeneralErrorResponseSchema } from '@/types/response'
import { LinkEngagementSchema } from '@/types/schemas/link'
import { logger } from '@/utils/logger'
import { until } from '@open-draft/until'
import { redirect, t } from 'elysia'

const LinkRedirectQuerySchema = t.Object({
	type: t.Optional(LinkEngagementSchema),
})

export const LinkRedirectRoute = baseElysia().get(
	'/:id/redirect',
	async ({ query, params, error: sendError }) => {
		const { id } = params
		const { type } = query

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
				},
			}),
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
