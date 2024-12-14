import { baseElysia } from '@/base'
import db from '@/lib/db'
import { apiKeyAuthorizationMiddleware } from '@/middlewares/auth'
import {
	GeneralErrorResponseSchema,
	GeneralSuccessResponseSchema,
} from '@/types/response'
import { ApiKeyAuthorizationHeaders } from '@/types/schemas/middleware'
import { logger } from '@/utils/logger'
import { until } from '@open-draft/until'
import { ApiKeyPermission } from '@prisma/client'

export const LinkDeleteRoute = baseElysia()
	.use(apiKeyAuthorizationMiddleware([ApiKeyPermission.LINK_WRITE]))
	.delete(
		'/:id',
		async ({ params, error }) => {
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
					},
					select: {
						id: true,
						url: true,
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

			const { error: LinkDeleteError } = await until(() =>
				db.link.delete({
					where: {
						id: link.id,
					},
				}),
			)

			if (LinkDeleteError) {
				logger.fail('Failed to delete link', LinkDeleteError)
				return error(500, {
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
			headers: ApiKeyAuthorizationHeaders,
			response: {
				200: GeneralSuccessResponseSchema,
				404: GeneralErrorResponseSchema,
				500: GeneralErrorResponseSchema,
			},
		},
	)
