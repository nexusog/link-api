import { env } from '@/lib/env'
import { ApiKeyPermission } from '@prisma/client'
import { t } from 'elysia'

export const ApiKeyLabelSchema = t.String({
	minLength: 1,
	maxLength: 100,
	description: 'The label of the API key',
})

export const ApiKeyPermissionSchema = t.Enum(ApiKeyPermission)

export const ApiKeyPermissionArraySchema = t.Array(ApiKeyPermissionSchema, {
	uniqueItems: true,
	maxItems: 4,
})

export const ApiKeyIdSchema = t.String({
	minLength: 1,
	description: 'The ID of the API key',
	pattern: `${env.API_KEY_ID_PREFIX}[0-9a-f]`,
})

export const ApiKeySchema = t.String({
	minLength: 1,
	description: 'The API key',
	pattern: `${env.API_KEY_PREFIX}[0-9a-f]`,
})
