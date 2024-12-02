import { baseElysia } from '@/base'
import {
	ConstructSuccessResponseSchemaWithData,
	GeneralErrorResponseSchema,
} from '@/types/response'
import {
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

const LinkCreateBodySchema = t.Object(
	{
		title: LinkTitleSchema,
		url: LinkURLSchema,
		shortName: t.Optional(LinkShortNameSchema),
	},
	{
		default: {
			title: 'Google',
			url: 'https://google.com',
			shortName: 'google',
		},
	},
)

export const LinkCreateRoute = baseElysia()
	.use(apiKeyAuthGuard())
	.post(
		'',
		async ({ body, error: sendError, apiKeyId }) => {
			const { title, url, shortName } = body

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

			return {
				error: false,
				message: 'Link created',
				data: {
					id,
				},
			}
		},
		{
			body: LinkCreateBodySchema,
			response: {
				200: ConstructSuccessResponseSchemaWithData(
					t.Object({
						id: LinkIdSchema,
					}),
				),
				500: GeneralErrorResponseSchema,
				409: GeneralErrorResponseSchema,
				403: GeneralErrorResponseSchema,
			},
			headers: apiKeyAuthGuardHeadersSchema,
		},
	)
