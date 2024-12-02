import { baseElysia } from '@/base'
import db from '@/lib/db'
import {
	apiKeyAuthGuard,
	apiKeyAuthGuardHeadersSchema,
} from '@/middlewares/auth'
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
import { logger } from '@/utils/logger'
import { until } from '@open-draft/until'
import { t } from 'elysia'

export const LinkGetRoute = baseElysia()
	.use(apiKeyAuthGuard())
	.get(
		'/:id',
		async ({ params, error: sendError, apiKeyId }) => {
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
					include: {
						accessTokens: true,
						engagements: true,
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

			return {
				error: false,
				message: 'Link found',
				data: {
					id: link.id,
					url: link.url,
					shortName: link.shortName,
					title: link.title,
					createdAt: link.createdAt,
					updatedAt: link.updatedAt,
				},
			}
		},
		{
			response: {
				200: ConstructSuccessResponseSchemaWithData(
					t.Object({
						id: LinkIdSchema,
						url: LinkURLSchema,
						shortName: t.Nullable(LinkShortNameSchema),
						title: LinkTitleSchema,
						createdAt: t.Date(),
						updatedAt: t.Date(),
					}),
				),
				404: GeneralErrorResponseSchema,
				500: GeneralErrorResponseSchema,
				403: GeneralErrorResponseSchema,
			},
			headers: apiKeyAuthGuardHeadersSchema,
			detail: {
				description: "Get a link's information",
			},
		},
	)
