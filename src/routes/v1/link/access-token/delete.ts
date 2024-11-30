import { baseElysia } from '@/base'
import db from '@/lib/db'
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

export const LinkAccessTokenDeleteBodySchema = t.Object({
	token: LinkAccessTokenSchema,
})

export const LinkAccessTokenDeleteRoute = baseElysia().delete(
	'/:tokenId',
	async ({ params, body, error: sendError }) => {
		const { id, tokenId } = params
		const { token } = body

		// verify token
		const { data: accessToken, error: AccessTokenFetchError } = await until(
			() =>
				db.linkAccessToken.findUnique({
					where: {
						token,
						link: {
							OR: [
								{
									id,
								},
								{
									shortName: id,
								},
							],
						},
					},
					select: {
						role: true,
						link: {
							select: {
								id: true,
								shortName: true,
							},
						},
					},
				}),
		)

		if (AccessTokenFetchError) {
			return sendError(500, {
				error: true,
				message: 'Failed to verify token',
			})
		}

		if (!accessToken) {
			return sendError(404, {
				error: true,
				message: 'Access token not found',
			})
		}

		// only OWNER and ADMIN can delete a token
		if (accessToken.role === LinkAccessTokenRole.VIEWER) {
			return sendError(403, {
				error: true,
				message: 'Forbidden',
			})
		}

		// delete token with tokenId
		const { error: DeleteTokenError } = await until(() =>
			db.linkAccessToken.delete({
				where: {
					id: tokenId,
					NOT: {
						// make sure OWNER cannot be deleted
						role: LinkAccessTokenRole.OWNER,
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
		body: LinkAccessTokenDeleteBodySchema,
		response: {
			200: GeneralSuccessResponseSchema,
			500: GeneralErrorResponseSchema,
			403: GeneralErrorResponseSchema,
			404: GeneralErrorResponseSchema,
		},
	},
)
