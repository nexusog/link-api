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
import { generateApiKey, generateApiKeyId } from '@/utils/generator'
import { logger } from '@/utils/logger'
import { until } from '@open-draft/until'
import { t } from 'elysia'

export const ApiKeyCreateBodySchema = t.Object({
	label: ApiKeyLabelSchema,
	permissions: ApiKeyPermissionsSchema,
})

export const ApiKeyCreateRoute = baseElysia()
	.use(workspaceAuthorizationMiddleware)
	.post(
		'',
		async ({ workspaceId, body, error }) => {
			const { label: apiKeyLabel, permissions: apiKeyPermissions } = body

			const { data: apiKeyId, error: ApiKeyIdGenerateError } =
				await until(async () => generateApiKeyId())

			if (ApiKeyIdGenerateError) {
				logger.fatal('Failed to generate API Key ID')
				logger.fatal(ApiKeyIdGenerateError)
				process.exit(1)
			}

			const { data: apiKey, error: ApiKeyGenerateError } = await until(
				async () => generateApiKey(),
			)

			if (ApiKeyGenerateError) {
				logger.fatal('Failed to generate API Key')
				logger.fatal(ApiKeyGenerateError)
				process.exit(1)
			}

			// TODO: check for api key id
			const { error: ApiKeyCreateError } = await until(() =>
				db.apiKey.create({
					data: {
						id: apiKeyId,
						label: apiKeyLabel,
						key: apiKey,
						permissions: apiKeyPermissions,
						workspace: {
							connect: {
								id: workspaceId,
							},
						},
					},
					select: {
						id: true,
					},
				}),
			)

			if (ApiKeyCreateError) {
				logger.fail('Failed to create Api Key', ApiKeyCreateError)
				return error(500, {
					error: true,
					message: 'Failed to create Api Key',
				})
			}

			return {
				error: false,
				message: 'Api Key created',
				data: {
					id: apiKeyId,
					key: apiKey,
				},
			}
		},
		{
			body: ApiKeyCreateBodySchema,
			response: {
				200: ConstructSuccessResponseSchemaWithData(
					t.Object({
						id: ApiKeyIdSchema,
						key: ApiKeySchema,
					}),
				),
				500: GeneralErrorResponseSchema,
			},
		},
	)
