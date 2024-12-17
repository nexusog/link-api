import moment from 'moment'
import type { Generator, Options } from 'elysia-rate-limit'

const ipGenerator: Generator<{ ip: string }> = async (
	_req,
	_server,
	{ ip },
) => {
	return Bun.hash(JSON.stringify(ip)).toString()
}

export const defaultRateLimitOptions: Partial<Options> = {
	duration: moment.duration(1, 'minute').asMilliseconds(),
	errorResponse: new Response('Too many requests', {
		status: 429,
	}),
	generator: ipGenerator,
	scoping: 'scoped',
}
