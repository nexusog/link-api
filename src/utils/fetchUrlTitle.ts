import { parse } from 'node-html-parser'

export const getHeadChildNodes = (html: string) => {
	const ast = parse(html)
	const metaTags = ast.querySelectorAll('meta').map(({ attributes }) => {
		const property =
			attributes.property || attributes.name || attributes.href
		return {
			property,
			content: attributes.content,
		}
	})
	const title = ast.querySelector('title')?.innerText
	const linkTags = ast.querySelectorAll('link').map(({ attributes }) => {
		const { rel, href } = attributes
		return {
			rel,
			href,
		}
	})

	return { metaTags, title, linkTags }
}

export async function fetchUrlTitle(url: string): Promise<string> {
	// Validate URL format
	let validatedUrl: URL
	try {
		validatedUrl = new URL(url)
	} catch {
		throw new Error('Invalid URL')
	}

	if (
		validatedUrl.protocol !== 'http:' &&
		validatedUrl.protocol !== 'https:'
	) {
		throw new Error('Unsupported protocol')
	}

	const controller = new AbortController()
	const timeoutId = setTimeout(() => controller.abort(), 5000)

	try {
		const res = await fetch(validatedUrl.toString(), {
			signal: controller.signal,
			headers: {
				// LINK https://stackoverflow.com/a/46616889/13576395
				'User-Agent': 'facebookexternalhit/1.1',
			},
		})
		clearTimeout(timeoutId)

		if (!res.ok) {
			throw new Error(`Error fetching URL: ${res.statusText}`)
		}

		const html = await res.text()

		const { title, metaTags } = getHeadChildNodes(html)

		const titleElement =
			metaTags.find((e) => e.property === 'og:title')?.content ||
			metaTags.find((e) => e.property === 'og:twitter')?.content ||
			title ||
			null

		if (!titleElement) {
			throw new Error('Title not found')
		}
		return titleElement
	} catch (error) {
		throw new Error('Error fetching title' + error)
	}
}
