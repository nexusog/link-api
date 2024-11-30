import db from '@/lib/db'
import * as NexusCrypto from '@nexusog/crypto'
import { until } from '@open-draft/until'
import { logger } from '@/utils/logger'

const MAX_TRIES = 10

export async function generateId(bytes = 8, tries = 0) {
	if (tries > MAX_TRIES) {
		return null
	}

	const id = NexusCrypto.utils.getRandomHex(bytes)

	const { data: link, error: LinkFetchError } = await until(() =>
		db.link.findUnique({
			where: {
				id,
			},
		}),
	)

	if (LinkFetchError) {
		logger.error(LinkFetchError)
		return generateId(bytes, tries + 1)
	}

	if (link) {
		return generateId(bytes, tries + 1)
	}

	return id
}
