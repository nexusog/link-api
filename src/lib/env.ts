import { createEnv } from '@t3-oss/env-core'
import moment from 'moment'
import { z } from 'zod'

const zodUint = z.coerce.number().int().positive()

export const env = createEnv({
	server: {
		DATABASE_URL: z.string().url(),
		PORT: z.string(),
		CROSS_ORIGINS: z.string().optional().default('*'),
		TRAFFIC_LOG: z
			.enum(['true', 'false'])
			.transform((value) => value === 'true')
			.default('true'),
		LOG_LEVEL: zodUint.optional().default(999),

		WORKSPACE_ID_PREFIX: z.string().optional().default('workspace_'),
		WORKSPACE_SECRET_PREFIX: z.string().optional().default('secret_'),

		WORKSPACE_ID_BYTES: zodUint.optional().default(8),
		WORKSPACE_SECRET_BYTES: zodUint.optional().default(32),

		API_KEY_ID_PREFIX: z.string().optional().default(''),
		API_KEY_PREFIX: z.string().optional().default('key_'),

		API_KEY_ID_BYTES: zodUint.optional().default(8),
		API_KEY_BYTES: zodUint.optional().default(32),

		LINK_ID_PREFIX: z.string().optional().default(''),
		LINK_ID_BYTES: zodUint.positive().optional().default(4),

		LINK_SHORT_NAME_ALLOWED_SYMBOLIC_CHARACTERS: z
			.string()
			.optional()
			.default('-_'),

		LINK_STATS_TIME_RANGE_MAX_DURATION: zodUint
			.optional()
			.default(moment.duration(1, 'month').asMilliseconds()),

		// POST /workspaces
		CREATE_WORKSPACE_RATE_LIMIT: zodUint.optional().default(5),
		CREATE_WORKSPACE_RATE_LIMIT_DURATION_MS: zodUint
			.optional()
			.default(moment.duration(5, 'minute').asMilliseconds()),

		// GET /workspaces/{id}
		GET_WORKSPACE_BY_ID_RATE_LIMIT: zodUint.optional().default(30),
		GET_WORKSPACE_BY_ID_RATE_LIMIT_DURATION_MS: zodUint
			.optional()
			.default(moment.duration(1, 'minute').asMilliseconds()),

		// GET /workspaces/{id}/stats
		GET_WORKSPACE_STATS_RATE_LIMIT: zodUint.optional().default(60),
		GET_WORKSPACE_STATS_RATE_LIMIT_DURATION_MS: zodUint
			.optional()
			.default(moment.duration(1, 'minute').asMilliseconds()),

		// POST /api-keys
		CREATE_API_KEY_RATE_LIMIT: zodUint.optional().default(10),
		CREATE_API_KEY_RATE_LIMIT_DURATION_MS: zodUint
			.optional()
			.default(moment.duration(5, 'minute').asMilliseconds()),

		// POST /links
		CREATE_LINK_RATE_LIMIT: zodUint.optional().default(20),
		CREATE_LINK_RATE_LIMIT_DURATION_MS: zodUint
			.optional()
			.default(moment.duration(1, 'minute').asMilliseconds()),

		// GET /links/{id}/redirect
		REDIRECT_RATE_LIMIT: zodUint.optional().default(60),
		REDIRECT_RATE_LIMIT_DURATION_MS: zodUint
			.optional()
			.default(moment.duration(1, 'minute').asMilliseconds()),
		REDIRECT_LINK_FETCH_CACHE_TTL: zodUint
			.optional()
			.default(moment.duration(1, 'minute').asMilliseconds()),
		REDIRECT_SMART_ENGAGEMENT_COUNTING_TRACING_COOKIE_AGE: zodUint
			.optional()
			.default(7),

		// GET /links/{id}/stats
		STATS_RATE_LIMIT: zodUint.optional().default(100),
		STATS_RATE_LIMIT_DURATION_MS: zodUint
			.optional()
			.default(moment.duration(1, 'minute').asMilliseconds()),
		STATS_LINK_FETCH_CACHE_TTL: zodUint
			.optional()
			.default(moment.duration(30, 'seconds').asMilliseconds()),

		// GET /links/{id}/stats/count
		STATS_COUNT_RATE_LIMIT: zodUint.optional().default(200),
		STATS_COUNT_RATE_LIMIT_DURATION_MS: zodUint
			.optional()
			.default(moment.duration(1, 'minute').asMilliseconds()),
		STATS_COUNT_LINK_FETCH_CACHE_TTL: zodUint
			.optional()
			.default(moment.duration(30, 'seconds').asMilliseconds()),

		CRON_LINK_TITLE_REFETCH_CRON_PATTERN: z.string().default('0 0 * * * *'),
	},
	isServer: true,
	runtimeEnv: Bun.env,
	emptyStringAsUndefined: true,
})
