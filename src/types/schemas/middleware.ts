import { t } from 'elysia'
import { WorkspaceIdSchema, WorkspaceSecretSchema } from './workspace'
import { ApiKeySchema } from './api-key'

export const WORKSPACE_ID_HEADER_KEY = 'x-workspace-id'
export const WORKSPACE_SECRET_HEADER_KEY = 'x-workspace-secret'
export const API_KEY_HEADER_KEY = 'x-api-key'

export const WorkspaceAuthorizationHeaders = t.Object({
	[WORKSPACE_ID_HEADER_KEY]: WorkspaceIdSchema,
	[WORKSPACE_SECRET_HEADER_KEY]: WorkspaceSecretSchema,
})

export const ApiKeyAuthorizationHeaders = t.Object({
	[WORKSPACE_ID_HEADER_KEY]: WorkspaceIdSchema,
	[API_KEY_HEADER_KEY]: ApiKeySchema,
})
