import { baseElysia } from '@/base'
import db from '@/lib/db'
import { env } from '@/lib/env'
import { defaultRateLimitOptions } from '@/middlewares/rateLimit'
import {
	ConstructSuccessResponseSchemaWithData,
	GeneralErrorResponseSchema,
} from '@/types/response'
import {
	WorkspaceIdSchema,
	WorkspaceNameSchema,
	WorkspaceSecretSchema,
} from '@/types/schemas/workspace'
import { generateWorkspaceId, generateWorkspaceSecret } from '@/utils/generator'
import { logger } from '@/utils/logger'
import { until } from '@open-draft/until'
import { t } from 'elysia'
import { rateLimit } from 'elysia-rate-limit'

export const WorkspacesCreateBodySchema = t.Object({
	name: WorkspaceNameSchema,
})

export const WorkspacesCreateRoute = baseElysia()
	.use(
		rateLimit({
			...defaultRateLimitOptions,
			max: env.CREATE_WORKSPACE_RATE_LIMIT,
			duration: env.CREATE_API_KEY_RATE_LIMIT_DURATION_MS,
		}),
	)
	.post(
		'',
		async ({ body, error }) => {
			const { name: workspaceName } = body

			const { data: workspaceId, error: WorkspaceIdGenerateError } =
				await until(async () => generateWorkspaceId())

			if (WorkspaceIdGenerateError) {
				logger.fatal('Failed to generate Workspace Id')
				logger.fatal(WorkspaceIdGenerateError)
				process.exit(1)
			}

			const {
				data: workspaceSecret,
				error: WorkspaceSecretGenerateError,
			} = await until(async () => generateWorkspaceSecret())

			if (WorkspaceSecretGenerateError) {
				logger.fatal('Failed to generate Workspace Secret')
				logger.fatal(WorkspaceSecretGenerateError)
				process.exit(1)
			}

			// TODO: check for select id
			const { error: WorkspaceRecordCreateError } = await until(
				async () =>
					db.workspace.create({
						data: {
							id: workspaceId,
							name: workspaceName,
							secret: workspaceSecret,
						},
						select: {
							id: true,
						},
					}),
			)

			if (WorkspaceRecordCreateError) {
				logger.fail(
					'Failed to create workspace record',
					WorkspaceRecordCreateError,
				)
				return error(500, {
					error: true,
					message: 'Failed to create workspace record',
				})
			}

			return {
				error: false,
				message: 'Workspace created successfully',
				data: {
					id: workspaceId,
					secret: workspaceSecret,
				},
			}
		},
		{
			body: WorkspacesCreateBodySchema,
			response: {
				200: ConstructSuccessResponseSchemaWithData(
					t.Object({
						id: WorkspaceIdSchema,
						secret: WorkspaceSecretSchema,
					}),
				),
				500: GeneralErrorResponseSchema,
			},
		},
	)
