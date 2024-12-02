import { baseElysia } from '@/base'
import db from '@/lib/db'
import {
	apiKeyAuthGuard,
	apiKeyAuthGuardHeadersSchema,
} from '@/middlewares/auth'
import {
	GeneralErrorResponseSchema,
	GeneralSuccessResponseSchema,
} from '@/types/response'
import {
	LinkAccessTokenIdSchema,
	LinkAccessTokenSchema,
	LinkIdSchema,
	LinkShortNameSchema,
} from '@/types/schema'
import { until } from '@open-draft/until'
import { LinkAccessTokenRole } from '@prisma/client'
import { t } from 'elysia'

export const LinkAccessTokenDeleteParamsSchema = t.Object({
	id: t.Union([LinkIdSchema, LinkShortNameSchema]),
	tokenId: LinkAccessTokenIdSchema,
})

export const LinkAccessTokenDeleteRoute = baseElysia()
	.use(apiKeyAuthGuard())
	.delete(
		'/:tokenId',
		async ({ params, body, error: sendError, apiKeyId }) => {
			const { id, tokenId } = params

			// delete token with tokenId
			const { error: DeleteTokenError } = await until(() =>
				db.linkAccessToken.delete({
					where: {
						id: tokenId,
						link: {
							id: id,
							ownerKey: {
								id: apiKeyId,
							},
						},
					},
				}),
			)

			if (DeleteTokenError) {
				return sendError(500, {
					error: true,
					message: 'Failed to delete token',
				})
			}

			return {
				error: false,
				message: 'Access tokens deleted',
			}
		},
		{
			params: LinkAccessTokenDeleteParamsSchema,
			response: {
				200: GeneralSuccessResponseSchema,
				500: GeneralErrorResponseSchema,
				403: GeneralErrorResponseSchema,
				404: GeneralErrorResponseSchema,
			},
			headers: apiKeyAuthGuardHeadersSchema,
			detail: {
				description: 'Delete an access token',
			},
		},
	)
