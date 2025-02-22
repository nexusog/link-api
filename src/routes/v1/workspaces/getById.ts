import { baseElysia } from '@/base'
import db from '@/lib/db'
import { env } from '@/lib/env'
import { defaultRateLimitOptions } from '@/middlewares/rateLimit'
import {
	WORKSPACE_SECRET_HEADER_KEY,
	WorkspaceAuthorizationHeaders,
} from '@/types/schemas/middleware'
import {
	WorkspaceIdSchema,
	WorkspaceNameSchema,
	WorkspaceSecretSchema,
} from '@/types/schemas/workspace'
import { logger } from '@/utils/logger'
import { Responses } from '@nexusog/golakost'
import { until } from '@open-draft/until'
import { t } from 'elysia'
import { rateLimit } from 'elysia-rate-limit'

export const GetWorkspaceByIdRoute = baseElysia()
	.use(
		rateLimit({
			...defaultRateLimitOptions,
			max: env.GET_WORKSPACE_BY_ID_RATE_LIMIT,
			duration: env.GET_WORKSPACE_BY_ID_RATE_LIMIT_DURATION_MS,
		}),
	)
	.get(
		'/:id',
		async ({ error, headers, params }) => {
			const { id: workspaceId } = params
			const { 'x-workspace-secret': workspaceSecret } = headers

			if (!workspaceId || !workspaceSecret) {
				return error(400, {
					error: true,
					message: 'Bad Request',
				})
			}

			const { data: workspace, error: WorkspaceRecordFetchError } =
				await until(() =>
					db.workspace.findFirst({
						where: {
							id: workspaceId,
							secret: workspaceSecret,
						},
						select: {
							id: true,
							name: true,
							createdAt: true,
						},
					}),
				)

			if (WorkspaceRecordFetchError) {
				logger.fail(
					'Failed to fetch workspace record',
					WorkspaceRecordFetchError,
				)
				return error(500, {
					error: true,
					message: 'Failed to fetch workspace record',
				})
			}

			if (!workspace) {
				return error(404, {
					error: true,
					message: 'Workspace not found',
				})
			}

			return {
				error: false,
				message: 'Workspace found',
				data: {
					secret: workspaceSecret,
					id: workspaceId,
					name: workspace.name,
					createdAt: workspace.createdAt,
				},
			}
		},
		{
			headers: t.Object({
				[WORKSPACE_SECRET_HEADER_KEY]: WorkspaceSecretSchema,
			}),
			response: {
				200: Responses.ConstructSuccessResponseSchema(
					t.Object({
						name: WorkspaceNameSchema,
						id: WorkspaceIdSchema,
						secret: WorkspaceSecretSchema,
						createdAt: t.Date(),
					}),
				),
				500: Responses.ErrorResponseSchema,
				404: Responses.ErrorResponseSchema,
				400: Responses.ErrorResponseSchema,
			},
		},
	)
