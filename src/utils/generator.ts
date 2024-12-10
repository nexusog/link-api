import { env } from '@/lib/env'
import NexusCrypto from '@nexusog/crypto'

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
