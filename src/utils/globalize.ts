export function globalize<T>(key: string, value: () => T) {
	const global = globalThis as unknown as { globalize: Record<string, T> }
	if (!global.globalize) global.globalize = {}
	global.globalize[key] = value()
	return global.globalize[key]
}
