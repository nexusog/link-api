import { baseElysia } from '@/base'
import db from '@/lib/db'
import { workspaceAuthorizationMiddleware } from '@/middlewares/auth'
import {
	ConstructSuccessResponseSchemaWithData,
	GeneralErrorResponseSchema,
} from '@/types/response'
import {
	ApiKeyIdSchema,
	ApiKeyLabelSchema,
	ApiKeyPermissionsSchema,
	ApiKeySchema,
} from '@/types/schemas/api-key'
import { logger } from '@/utils/logger'
import { until } from '@open-draft/until'
import { t } from 'elysia'

export const ApiKeyGetRoute = baseElysia()
	.use(workspaceAuthorizationMiddleware)
	.get(
		'',
		async ({ error, workspaceId, query }) => {
			const { cursor, limit = 10 } = query

			const { error: ApiKeyFetchError, data: apiKeys } = await until(() =>
				db.apiKey.findMany({
					where: {
						workspaceId,
					},
					select: {
						id: true,
						key: true,
						label: true,
						permissions: true,
						createdAt: true,
					},
					orderBy: {
						createdAt: 'desc',
					},
					take: limit + 1,
					cursor: cursor
						? {
								id: cursor,
							}
						: undefined,
				}),
			)

			if (ApiKeyFetchError) {
				logger.fail('Failed to fetch api keys')
				logger.fail(ApiKeyFetchError)
				return error(500, {
					error: true,
					message: 'Failed to fetch api keys',
				})
			}

			return {
				error: false,
				message: 'API keys found',
				data: {
					apiKeys: apiKeys.slice(0, limit),
					nextCursor:
						apiKeys.length > limit ? apiKeys[limit].id : null,
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
				200: ConstructSuccessResponseSchemaWithData(
					t.Object({
						apiKeys: t.Array(
							t.Object({
								id: ApiKeyIdSchema,
								key: ApiKeySchema,
								label: ApiKeyLabelSchema,
								permissions: ApiKeyPermissionsSchema,
								createdAt: t.Date(),
							}),
						),
						nextCursor: t.Nullable(t.String()),
					}),
				),
				500: GeneralErrorResponseSchema,
			},
		},
	)
