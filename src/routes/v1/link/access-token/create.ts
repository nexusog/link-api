import { baseElysia } from '@/base'
import db from '@/lib/db'
import {
	LinkAccessTokenIdSchema,
	LinkAccessTokenLabelSchema,
	LinkAccessTokenRoleSchema,
	LinkAccessTokenRoleWithoutOwnerSchema,
	LinkAccessTokenSchema,
	LinkIdSchema,
	LinkShortNameSchema,
} from '@/types/schema'
import { until } from '@open-draft/until'
import { LinkAccessTokenRole } from '@prisma/client'
import { t } from 'elysia'
import NexusCrypto from '@nexusog/crypto'
import {
	ConstructSuccessResponseSchemaWithData,
	GeneralErrorResponseSchema,
} from '@/types/response'

export const LinkAccessTokenCreateParamsSchema = t.Object({
	id: t.Union([LinkIdSchema, LinkShortNameSchema]),
})

export const LinkAccessTokenCreateBodySchema = t.Object({
	token: LinkAccessTokenSchema,
	label: LinkAccessTokenSchema,
	role: LinkAccessTokenRoleWithoutOwnerSchema,
})

export const LinkAccessTokenCreateRoute = baseElysia().post(
	'',
	async ({ params, body, error: sendError }) => {
		const { id } = params
		const { token, role, label } = body

		// verify token
		const { data: accessToken, error: AccessTokenFetchError } = await until(
			() =>
				db.linkAccessToken.findUnique({
					where: {
						token: token,
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

		// only OWNER and ADMIN can create token
		if (accessToken.role === LinkAccessTokenRole.VIEWER) {
			return sendError(403, {
				error: true,
				message: 'Forbidden',
			})
		}

		// create token
		const newToken = NexusCrypto.utils.getRandomHex(32)

		const { data: tokenRecord, error: CreateTokenError } = await until(() =>
			db.linkAccessToken.create({
				data: {
					token: newToken,
					label,
					role,
					link: {
						connect: {
							id: accessToken.link.id,
						},
					},
				},
			}),
		)

		if (CreateTokenError) {
			return sendError(500, {
				error: true,
				message: 'Failed to create token',
			})
		}

		return {
			error: false,
			message: 'Access token created',
			data: {
				label,
				tokenId: tokenRecord.id,
				token: newToken,
				role: tokenRecord.role,
			},
		}
	},
	{
		params: LinkAccessTokenCreateParamsSchema,
		body: LinkAccessTokenCreateBodySchema,
		response: {
			200: ConstructSuccessResponseSchemaWithData(
				t.Object({
					label: LinkAccessTokenLabelSchema,
					tokenId: LinkAccessTokenIdSchema,
					token: LinkAccessTokenSchema,
					role: LinkAccessTokenRoleSchema,
				}),
			),
			500: GeneralErrorResponseSchema,
			403: GeneralErrorResponseSchema,
			404: GeneralErrorResponseSchema,
		},
	},
)
