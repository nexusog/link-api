import { env } from '@/lib/env'
import { createConsola } from 'consola'

export const logger = createConsola({
	formatOptions: {
		date: true,
		colors: true,
		compact: false,
	},
	level: env.LOG_LEVEL,
})
