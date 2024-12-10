import { createEnv } from '@t3-oss/env-core'
import { z } from 'zod'

export const env = createEnv({
	server: {
		DATABASE_URL: z.string().url(),
		PORT: z.string(),
		CROSS_ORIGINS: z.string().optional().default('*'),
		LOG_LEVEL: z.coerce.number().int().positive().optional().default(999),

		WORKSPACE_ID_PREFIX: z.string().optional().default('workspace_'),
		WORKSPACE_SECRET_PREFIX: z.string().optional().default('secret_'),

		WORKSPACE_ID_BYTES: z.coerce
			.number()
			.int()
			.positive()
			.optional()
			.default(8),
		WORKSPACE_SECRET_BYTES: z.coerce
			.number()
			.int()
			.positive()
			.optional()
			.default(32),

		API_KEY_ID_PREFIX: z.string().optional().default('key_'),
		API_KEY_PREFIX: z.string().optional().default('key_'),

		API_KEY_ID_BYTES: z.coerce
			.number()
			.int()
			.positive()
			.optional()
			.default(8),
		API_KEY_BYTES: z.coerce
			.number()
			.int()
			.positive()
			.optional()
			.default(32),
	},
	isServer: true,
	runtimeEnv: Bun.env,
	emptyStringAsUndefined: true,
})
