import { baseElysia } from '@/base'
import db from '@/lib/db'
import { apiKeyAuthGuard } from '@/middlewares/auth'
import {
	GeneralErrorResponseSchema,
	GeneralSuccessResponseSchema,
} from '@/types/response'
import { logger } from '@/utils/logger'
import { until } from '@open-draft/until'

export const LinkDeleteRoute = baseElysia()
	.use(apiKeyAuthGuard())
	.delete(
		'/:id',
		async ({ params, body, error: sendError, apiKeyId }) => {
			const { id } = params

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
						ownerKey: {
							id: apiKeyId,
						},
					},
					select: {
						id: true,
					},
				}),
			)

			if (LinkFetchError) {
				logger.error(LinkFetchError)
				return sendError(500, {
					error: true,
					message: 'Failed to fetch link',
				})
			}

			if (!link) {
				return sendError(404, {
					error: true,
					message: 'Link not found',
				})
			}

			// delete link
			const { error: DeleteLinkError } = await until(() =>
				db.link.delete({
					where: {
						id: link.id,
						ownerKey: {
							id: apiKeyId,
						},
					},
				}),
			)

			if (DeleteLinkError) {
				logger.error(DeleteLinkError)
				return sendError(500, {
					error: true,
					message: 'Failed to delete link',
				})
			}

			return {
				error: false,
				message: 'Link deleted',
			}
		},
		{
			response: {
				200: GeneralSuccessResponseSchema,
				500: GeneralErrorResponseSchema,
				404: GeneralErrorResponseSchema,
				403: GeneralErrorResponseSchema,
			},
		},
	)
