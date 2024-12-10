import { t } from 'elysia'
import { WorkspaceIdSchema, WorkspaceSecretSchema } from './workspace'

export const WorkspaceAuthorizationHeaders = t.Object({
	'x-workspace-id': WorkspaceIdSchema,
	'x-workspace-secret': WorkspaceSecretSchema,
})
