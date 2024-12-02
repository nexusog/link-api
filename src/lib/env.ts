import { createEnv } from '@t3-oss/env-core'
import { z } from 'zod'

export const env = createEnv({
	server: {
		DATABASE_URL: z.string().url(),
		PORT: z.string(),
		LOG_LEVEL: z.number().int().positive().optional().default(999),
	},
	isServer: true,
	runtimeEnv: Bun.env,
	emptyStringAsUndefined: true,
})
