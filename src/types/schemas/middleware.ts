import { t } from 'elysia'
import { WorkspaceIdSchema, WorkspaceSecretSchema } from './workspace'
import { ApiKeySchema } from './api-key'

export const WorkspaceAuthorizationHeaders = t.Object({
	'x-workspace-id': WorkspaceIdSchema,
	'x-workspace-secret': WorkspaceSecretSchema,
})

export const ApiKeyAuthorizationHeaders = t.Object({
	'x-workspace-id': WorkspaceIdSchema,
	'x-api-key': ApiKeySchema,
})
