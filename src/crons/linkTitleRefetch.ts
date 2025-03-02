import db from '@/lib/db'
import { fetchUrlTitle } from '@/utils/fetchUrlTitle'
import { logger } from '@/utils/logger'
import { until } from '@open-draft/until'

export async function linkTitleRefetchCronJob() {
	logger.withTag('CRON').info('RUN')

	const links = await db.link.findMany({
		select: {
			id: true,
			url: true,
		},
	})

	for (const link of links) {
		const { error: URLTitleError, data: title } = await until(() =>
			fetchUrlTitle(link.url),
		)

		if (URLTitleError) {
			continue
		}

		await db.link.update({
			where: {
				id: link.id,
			},
			data: {
				title,
			},
		})
	}

	logger.withTag('CRON').info('DONE')
}
