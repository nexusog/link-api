import * as cheerio from 'cheerio'

/**
 * Fetches the title of a webpage given its URL.
 * @param url - The URL of the webpage.
 * @returns A promise that resolves with the page title.
 * @throws An error if the URL is invalid, unsupported, or if fetching/parsing fails.
 */
export async function fetchUrlTitle(url: string): Promise<string> {
	// Validate URL format
	let validatedUrl: URL
	try {
		validatedUrl = new URL(url)
	} catch {
		throw new Error('Invalid URL')
	}

	// Only allow http and https protocols.
	if (
		validatedUrl.protocol !== 'http:' &&
		validatedUrl.protocol !== 'https:'
	) {
		throw new Error('Unsupported protocol')
	}

	// Set up an AbortController to timeout long requests.
	const controller = new AbortController()
	const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 seconds timeout

	try {
		const res = await fetch(validatedUrl.toString(), {
			signal: controller.signal,
			redirect: 'follow',
		})
		clearTimeout(timeoutId)

		if (!res.ok) {
			throw new Error(`Error fetching URL: ${res.statusText}`)
		}

		const html = await res.text()
		const $ = cheerio.load(html)
		const titleElement = $('title')
		if (!titleElement) {
			throw new Error('Title not found')
		}
		return titleElement.text().trim()
	} catch (error) {
		throw new Error('Error fetching title')
	}
}
