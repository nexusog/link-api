import db from '@/lib/db'
import { env } from '@/lib/env'
import NexusCrypto from '@nexusog/crypto'
import { until } from '@open-draft/until'

// aliasing
const N = NexusCrypto.utils.getRandomHex

export function generateWorkspaceId() {
	return `${env.WORKSPACE_ID_PREFIX}${N(env.WORKSPACE_ID_BYTES)}`
}

export function generateWorkspaceSecret() {
	return `${env.WORKSPACE_SECRET_PREFIX}${N(env.WORKSPACE_SECRET_BYTES)}`
}

export function generateApiKeyId() {
	return `${env.API_KEY_ID_PREFIX}${N(env.API_KEY_ID_BYTES)}`
}

export function generateApiKey() {
	return `${env.API_KEY_PREFIX}${N(env.API_KEY_BYTES)}`
}

export async function generateLinkId() {
	const id = `${env.LINK_ID_PREFIX}${N(env.LINK_ID_BYTES)}`

	// check for existing link id
	const { data: linkById, error: LinkByIdFetchError } = await until(() =>
		db.link.findUnique({
			where: {
				id: id,
			},
			select: {
				id: true,
			},
		}),
	)

	if (LinkByIdFetchError || linkById) {
		return generateLinkId()
	}

	return id
}
