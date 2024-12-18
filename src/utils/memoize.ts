import TTLCache from '@isaacs/ttlcache'

export function memoize<
	Callback extends (...args: any) => any,
	Cache extends TTLCache<string, ReturnType<Callback>>,
>(cache: Cache, key: string, fn: Callback): ReturnType<Callback> {
	const cached = cache.get(key)
	if (cached) return cached
	const result = fn()
	cache.set(key, result)
	return result
}
