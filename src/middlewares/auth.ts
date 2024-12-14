import db from '@/lib/db'
import { until } from '@open-draft/until'
import { Elysia, t } from 'elysia'
import { logger } from '@/utils/logger'
import {
	ApiKeyAuthorizationHeaders,
	WorkspaceAuthorizationHeaders,
} from '@/types/schemas/middleware'
import { ApiKeyPermission } from '@prisma/client'

export const workspaceAuthorizationMiddleware = new Elysia({
	name: 'WorkspaceAuthorizationMiddleware',
})
	.guard({
		headers: WorkspaceAuthorizationHeaders,
	})
	.resolve(async ({ headers }) => {
		const {
			'x-workspace-id': workspaceId,
			'x-workspace-secret': workspaceSecret,
		} = headers

		const { data: workspace, error: WorkspaceFindError } = await until(
			async () =>
				db.workspace.findUnique({
					where: {
						id: workspaceId,
						secret: workspaceSecret,
					},
					select: {
						id: true,
						secret: true,
					},
				}),
		)

		if (WorkspaceFindError) {
			logger.fail('Failed to find workspace', WorkspaceFindError)
			throw new Response(
				JSON.stringify({
					error: true,
					message: 'Failed to find workspace',
				}),
				{
					status: 401,
					headers: {
						'Content-Type': 'application/json',
					},
				},
			)
		}

		if (!workspace) {
			throw new Response(
				JSON.stringify({
					error: true,
					message: 'Unauthorized',
				}),
				{
					status: 401,
					headers: {
						'Content-Type': 'application/json',
					},
				},
			)
		}

		return {
			workspaceId: workspace.id,
			workspaceSecret: workspace.secret,
		}
	})
	.as('plugin')

export const apiKeyAuthorizationMiddleware = (
	permissions: ApiKeyPermission[],
) => {
	return new Elysia({
		name: 'ApiKeyAuthorizationMiddleware',
	})
		.guard({
			headers: ApiKeyAuthorizationHeaders,
		})
		.resolve(async ({ headers }) => {
			const { 'x-workspace-id': workspaceId, 'x-api-key': apiKey } =
				headers

			const { data: apiKeyById, error: ApiKeyFindError } = await until(
				async () =>
					db.apiKey.findUnique({
						where: {
							key: apiKey,
							workspace: {
								id: workspaceId,
							},
						},
						select: {
							id: true,
							key: true,
							permissions: true,
							workspace: {
								select: {
									id: true,
									secret: true,
								},
							},
						},
					}),
			)

			if (ApiKeyFindError) {
				logger.fail('Failed to find api key', ApiKeyFindError)
				throw new Response(
					JSON.stringify({
						error: true,
						message: 'Failed to find api key',
					}),
					{
						status: 401,
						headers: {
							'Content-Type': 'application/json',
						},
					},
				)
			}

			if (!apiKeyById) {
				logger.info(
					`Unauthorized (Workspace ID: ${workspaceId}, Api Key: ${apiKey.slice(0, 12)}...)`,
				)
				throw new Response(
					JSON.stringify({
						error: true,
						message: 'Unauthorized',
					}),
					{
						status: 401,
						headers: {
							'Content-Type': 'application/json',
						},
					},
				)
			}

			if (
				apiKeyById.permissions.some((permission) =>
					permissions.includes(permission),
				) === false
			) {
				throw new Response(
					JSON.stringify({
						error: true,
						message: 'Unauthorized (Insufficient Permissions)',
					}),
					{
						status: 401,
						headers: {
							'Content-Type': 'application/json',
						},
					},
				)
			}

			return {
				apiKeyId: apiKeyById.id,
				apiKeyKey: apiKeyById.key,
				workspaceId: apiKeyById.workspace.id,
				workspaceSecret: apiKeyById.workspace.secret,
			}
		})
		.as('plugin')
}
