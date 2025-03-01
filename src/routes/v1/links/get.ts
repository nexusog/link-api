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
			const { page = 1, pageSize = 10 } = query

			const skip = (page - 1) * pageSize

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
					skip,
					take: pageSize,
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

			const { data: totalCount, error: LinkTotalCountError } =
				await until(() =>
					db.link.count({
						where: {
							workspace: {
								id: workspaceId,
							},
						},
					}),
				)

			if (LinkTotalCountError) {
				logger.fail('Failed to fetch link total count')
				logger.fail(LinkTotalCountError)
				return error(500, {
					error: true,
					message: 'Failed to fetch link total count',
				})
			}

			return {
				error: false,
				message: 'Links found',
				data: {
					links: links,
					count: totalCount,
					page,
					pageSize,
				},
			}
		},
		{
			query: t.Object({
				page: t.Optional(t.Number()),
				pageSize: t.Optional(
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
						count: t.Number(),
						page: t.Number(),
						pageSize: t.Number(),
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
