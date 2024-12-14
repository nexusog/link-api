import { baseElysia } from '@/base'
import db from '@/lib/db'
import { apiKeyAuthorizationMiddleware } from '@/middlewares/auth'
import {
	ConstructSuccessResponseSchemaWithData,
	GeneralErrorResponseSchema,
} from '@/types/response'
import {
	LinkIdSchema,
	LinkShortNameSchema,
	LinkTitleSchema,
	LinkURLSchema,
} from '@/types/schemas/link'
import { ApiKeyAuthorizationHeaders } from '@/types/schemas/middleware'
import { logger } from '@/utils/logger'
import { until } from '@open-draft/until'
import { ApiKeyPermission } from '@prisma/client'
import { t } from 'elysia'

export const LinkGetRoute = baseElysia()
	.use(apiKeyAuthorizationMiddleware([ApiKeyPermission.LINK_READ]))
	.get(
		'/:id',
		async ({ params, error }) => {
			const { id } = params

			const { error: LinkFetchError, data: linkRecord } = await until(
				() =>
					db.link.findFirst({
						where: {
							OR: [{ id: id }, { shortName: id }],
						},
						select: {
							id: true,
							shortName: true,
							title: true,
							url: true,
							createdAt: true,
							updatedAt: true,
						},
					}),
			)

			if (LinkFetchError) {
				logger.fail('Failed to fetch link')
				logger.fail(LinkFetchError)
				return error(500, {
					error: true,
					message: 'Failed to fetch link',
				})
			}

			if (!linkRecord) {
				logger.fail(`Link not found (ID/ShortName: ${id})`)
				return error(404, {
					error: true,
					message: 'Link not found',
				})
			}

			return {
				error: false,
				message: 'Link found',
				data: {
					id: linkRecord.id,
					shortName: linkRecord.shortName,
					title: linkRecord.title,
					url: linkRecord.url,
					createdAt: linkRecord.createdAt,
					updatedAt: linkRecord.updatedAt,
				},
			}
		},
		{
			response: {
				200: ConstructSuccessResponseSchemaWithData(
					t.Object({
						id: LinkIdSchema,
						shortName: t.Nullable(LinkShortNameSchema),
						title: LinkTitleSchema,
						url: LinkURLSchema,
						createdAt: t.Date(),
						updatedAt: t.Date(),
					}),
				),
				500: GeneralErrorResponseSchema,
				404: GeneralErrorResponseSchema,
			},
			headers: ApiKeyAuthorizationHeaders,
		},
	)