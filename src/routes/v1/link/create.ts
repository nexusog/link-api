import { baseElysia } from '@/base'
import {
	ConstructSuccessResponseSchemaWithData,
	GeneralErrorResponseSchema,
} from '@/types/response'
import {
	LinkAccessTokenIdSchema,
	LinkAccessTokenRoleSchema,
	LinkAccessTokenSchema,
	LinkIdSchema,
	LinkShortNameSchema,
	LinkTitleSchema,
	LinkURLSchema,
} from '@/types/schema'
import { t } from 'elysia'
import { generateId } from '@/utils/generateId'
import db from '@/lib/db'
import { until } from '@open-draft/until'
import { logger } from '@/utils/logger'
import {
	apiKeyAuthGuard,
	apiKeyAuthGuardHeadersSchema,
} from '@/middlewares/auth'
import NexusCrypto from '@nexusog/crypto'
import { LinkAccessTokenRole } from '@prisma/client'

const LinkCreateBodySchema = t.Object({
	title: LinkTitleSchema,
	url: LinkURLSchema,
	shortName: t.Optional(LinkShortNameSchema),
	createAccessToken: t.Optional(
		t.Boolean({
			default: false,
		}),
	),
	accessToken: t.Optional(
		t.Object({
			role: t.Optional(LinkAccessTokenRoleSchema),
		}),
	),
})

export const LinkCreateRoute = baseElysia()
	.use(apiKeyAuthGuard())
	.post(
		'',
		async ({ body, error: sendError, apiKeyId }) => {
			const {
				title,
				url,
				shortName,
				accessToken: bodyAccessToken,
				createAccessToken,
			} = body

			// check if short name is taken
			if (shortName) {
				const { data: link, error: LinkFetchError } = await until(() =>
					db.link.findFirst({
						where: {
							shortName,
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

				// if link already exists, return error
				if (link) {
					return sendError(409, {
						error: true,
						message: 'Short name is already taken',
					})
				}
			}

			// generate id
			const id = await generateId()

			// if id is null, it usually means MAX_TRIES was reached
			if (!id) {
				logger.error(`Failed to generate ID`)
				return sendError(500, {
					error: true,
					message: 'Database error',
				})
			}

			// create link
			const { error: CreateLinkError } = await until(() =>
				db.link.create({
					data: {
						id,
						title,
						url,
						shortName,
						ownerKey: {
							connect: {
								id: apiKeyId,
							},
						},
					},
				}),
			)

			if (CreateLinkError) {
				logger.error(CreateLinkError)
				return sendError(500, {
					error: true,
					message: 'Database error',
				})
			}

			// if createAccessToken is true, create access token
			const accessToken = NexusCrypto.utils.getRandomHex(32)
			let accessTokenId: string
			if (createAccessToken) {
				const {
					data: accessTokenRecord,
					error: CreateAccessTokenError,
				} = await until(() =>
					db.linkAccessToken.create({
						data: {
							label: 'default',
							token: accessToken,
							role:
								bodyAccessToken?.role ||
								LinkAccessTokenRole.VIEWER,
							link: {
								connect: { id },
							},
						},
						select: {
							id: true,
							token: true,
						},
					}),
				)

				if (CreateAccessTokenError) {
					logger.error(CreateAccessTokenError)
					return sendError(500, {
						error: true,
						message: 'Failed to create access token',
					})
				}

				accessTokenId = accessTokenRecord.id
			}

			return {
				error: false,
				message: 'Link created',
				data: Object.assign(
					{
						id,
					},
					createAccessToken && {
						accessToken: {
							token: accessToken,
							id: accessTokenId!,
						},
					},
				),
			}
		},
		{
			body: LinkCreateBodySchema,
			response: {
				200: ConstructSuccessResponseSchemaWithData(
					t.Object({
						id: LinkIdSchema,
						accessToken: t.Optional(
							t.Object({
								token: LinkAccessTokenSchema,
								id: LinkAccessTokenIdSchema,
							}),
						),
					}),
				),
				500: GeneralErrorResponseSchema,
				409: GeneralErrorResponseSchema,
				403: GeneralErrorResponseSchema,
			},
			headers: apiKeyAuthGuardHeadersSchema,
			detail: {
				description: 'Create a new link',
			},
		},
	)
