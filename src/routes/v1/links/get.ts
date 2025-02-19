import { baseElysia } from '@/base'
import db from '@/lib/db'
import { apiKeyAuthorizationMiddleware } from '@/middlewares/auth'
import {
	LinkIdSchema,
	LinkShortNameSchema,
	LinkTitleSchema,
	LinkURLSchema,
} from '@/types/schemas/link'
import { ApiKeyAuthorizationHeaders } from '@/types/schemas/middleware'
import { logger } from '@/utils/logger'
import { Responses } from '@nexusog/golakost'
import { until } from '@open-draft/until'
import { ApiKeyPermission } from '@prisma/client'
import { t } from 'elysia'

export const LinkGetRoute = baseElysia()
	.use(apiKeyAuthorizationMiddleware([ApiKeyPermission.LINK_READ]))
	.get(
		'',
		async ({ error, workspaceId, query }) => {
			const { cursor, limit = 10 } = query

			const { error: LinkFetchError, data: links } = await until(() =>
				db.link.findMany({
					where: {
						workspaceId,
					},
					select: {
						id: true,
						shortName: true,
						title: true,
						url: true,
						createdAt: true,
						updatedAt: true,
					},
					orderBy: {
						updatedAt: 'desc',
					},
					take: limit + 1,
					cursor: cursor
						? {
								id: cursor,
							}
						: undefined,
				}),
			)

			if (LinkFetchError) {
				logger.fail('Failed to fetch links')
				logger.fail(LinkFetchError)
				return error(500, {
					error: true,
					message: 'Failed to fetch links',
				})
			}

			return {
				error: false,
				message: 'Links found',
				data: {
					links: links.slice(0, limit),
					nextCursor: links.length > limit ? links[limit].id : null,
				},
			}
		},
		{
			query: t.Object({
				cursor: t.Optional(t.String()),
				limit: t.Optional(
					t.Number({
						default: 10,
						maximum: 50,
						minimum: 1,
					}),
				),
			}),
			response: {
				200: Responses.ConstructSuccessResponseSchema(
					t.Object({
						links: t.Array(
							t.Object({
								id: LinkIdSchema,
								shortName: t.Nullable(LinkShortNameSchema),
								title: LinkTitleSchema,
								url: LinkURLSchema,
								createdAt: t.Date(),
								updatedAt: t.Date(),
							}),
						),
						nextCursor: t.Nullable(t.String()),
					}),
				),
				400: Responses.ErrorResponseSchema,
				500: Responses.ErrorResponseSchema,
			},
			headers: ApiKeyAuthorizationHeaders,
		},
	)
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
				200: Responses.ConstructSuccessResponseSchema(
					t.Object({
						id: LinkIdSchema,
						shortName: t.Nullable(LinkShortNameSchema),
						title: LinkTitleSchema,
						url: LinkURLSchema,
						createdAt: t.Date(),
						updatedAt: t.Date(),
					}),
				),
				500: Responses.ErrorResponseSchema,
				404: Responses.ErrorResponseSchema,
			},
			headers: ApiKeyAuthorizationHeaders,
		},
	)
