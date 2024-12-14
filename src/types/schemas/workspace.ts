import { env } from '@/lib/env'
import { t } from 'elysia'

export const WorkspaceNameSchema = t.String({
	minLength: 1,
	maxLength: 100,
	description: 'The name of the workspace',
})

export const WorkspaceIdSchema = t.String({
	minLength: 1,
	description: 'The ID of the workspace',
	pattern: `${env.WORKSPACE_ID_PREFIX}[0-9a-f]`,
})

export const WorkspaceSecretSchema = t.String({
	minLength: 1,
	description: 'The secret of the workspace',
	pattern: `${env.WORKSPACE_SECRET_PREFIX}[0-9a-f]`,
})
