import { baseElysia } from '@/base'
import db from '@/lib/db'
import {
	LinkAccessTokenIdSchema,
	LinkAccessTokenRoleSchema,
	LinkAccessTokenSchema,
	LinkIdSchema,
	LinkShortNameSchema,
} from '@/types/schema'
import { until } from '@open-draft/until'
import { t } from 'elysia'
import NexusCrypto from '@nexusog/crypto'
import {
	ConstructSuccessResponseSchemaWithData,
	GeneralErrorResponseSchema,
} from '@/types/response'
import {
	apiKeyAuthGuard,
	apiKeyAuthGuardHeadersSchema,
} from '@/middlewares/auth'
import { logger } from '@/utils/logger'

export const LinkAccessTokenCreateParamsSchema = t.Object({
	id: t.Union([LinkIdSchema, LinkShortNameSchema]),
})

export const LinkAccessTokenCreateBodySchema = t.Object({
	label: LinkAccessTokenSchema,
	role: LinkAccessTokenRoleSchema,
})

export const LinkAccessTokenCreateRoute = baseElysia()
	.use(apiKeyAuthGuard())
	.post(
		'',
		async ({ params, body, error: sendError, apiKeyId }) => {
			const { id } = params
			const { role, label } = body

			// check if link exists
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
					message: 'Database error',
				})
			}
			if (!link) {
				return sendError(404, {
					error: true,
					message: 'Link not found',
				})
			}

			// create token
			const newToken = NexusCrypto.utils.getRandomHex(32)

			const { data: tokenRecord, error: CreateTokenError } = await until(
				() =>
					db.linkAccessToken.create({
						data: {
							token: newToken,
							label,
							role,
							link: {
								connect: {
									id: link.id,
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
					tokenId: tokenRecord.id,
					token: newToken,
				},
			}
		},
		{
			params: LinkAccessTokenCreateParamsSchema,
			body: LinkAccessTokenCreateBodySchema,
			response: {
				200: ConstructSuccessResponseSchemaWithData(
					t.Object({
						tokenId: LinkAccessTokenIdSchema,
						token: LinkAccessTokenSchema,
					}),
				),
				500: GeneralErrorResponseSchema,
				403: GeneralErrorResponseSchema,
				404: GeneralErrorResponseSchema,
			},
			headers: apiKeyAuthGuardHeadersSchema,
			detail: {
				description: 'Generate a new access token for a link',
			},
		},
	)
