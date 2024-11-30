import { baseElysia } from '@/base'
import db from '@/lib/db'
import {
	GeneralErrorResponseSchema,
	GeneralSuccessResponseSchema,
} from '@/types/response'
import { LinkAccessTokenSchema } from '@/types/schema'
import { logger } from '@/utils/logger'
import { until } from '@open-draft/until'
import { t } from 'elysia'

export const LinkDeleteBodySchema = t.Object({
	token: LinkAccessTokenSchema,
})

export const LinkDeleteRoute = baseElysia().delete(
	'/:id',
	async ({ params, body, error: sendError }) => {
		const { id } = params
		const { token } = body

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
					accessTokens: {
						where: {
							role: LinkAccessTokenSchema.OWNER,
						},
					},
					id: true,
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

		// verify token
		// make sure only OWNER can delete a link
		if (link.accessTokens[0].token !== token) {
			return sendError(403, {
				error: true,
				message: 'Forbidden',
			})
		}

		// delete link
		const { error: DeleteLinkError } = await until(() =>
			db.link.delete({
				where: {
					id: link.id,
				},
			}),
		)

		if (DeleteLinkError) {
			logger.error(DeleteLinkError)
			return sendError(500, {
				error: true,
				message: 'Database error',
			})
		}

		return {
			error: false,
			message: 'Link deleted',
		}
	},
	{
		body: LinkDeleteBodySchema,
		response: {
			200: GeneralSuccessResponseSchema,
			500: GeneralErrorResponseSchema,
			404: GeneralErrorResponseSchema,
			403: GeneralErrorResponseSchema,
		},
	},
)
