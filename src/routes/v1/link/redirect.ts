import { baseElysia } from '@/base'
import db from '@/lib/db'
import { ipInfoWrapper } from '@/lib/ip'
import { logger } from '@/utils/logger'
import { until } from '@open-draft/until'
import { EngagementType } from '@prisma/client'
import { redirect, t } from 'elysia'
import { ip } from 'elysia-ip'

const LinkRedirectQuerySchema = t.Object({
	qr: t.Optional(
		t.Boolean({
			default: false,
		}),
	),
	click: t.Optional(
		t.Boolean({
			default: true,
		}),
	),
})

export const LinkRedirectRoute = baseElysia()
	.use(ip())
	.get(
		'/:id/redirect',
		async ({ query, params, error: sendError, ip: incomingIp }) => {
			const { id } = params
			const { qr, click } = query

			// get link record
			const { data: link, error: LinkFetchError } = await until(() =>
				db.link.findFirst({
					where: {
						OR: [
							{
								id,
							},
							{
								shortName: id,
							},
						],
					},
					select: {
						id: true,
						url: true,
					},
				}),
			)

			if (LinkFetchError) {
				logger.error(LinkFetchError)
				return sendError(500, {
					error: true,
					message: 'Database error',
				})
			}

			if (!link) {
				return sendError(404, {
					error: true,
					message: 'Link not found',
				})
			}

			const { data: ipInfo } = await until(
				async () => await ipInfoWrapper.lookupIp(incomingIp),
			)

			await until(() =>
				db.engagement.create({
					data: {
						link: {
							connect: {
								id: link.id,
							},
						},

						ip: ipInfo?.ip,
						originCity: ipInfo?.city,
						originCountry: ipInfo?.country,
						originRegion: ipInfo?.region,
						engagementType: qr
							? EngagementType.QR
							: click
								? EngagementType.CLICK
								: EngagementType.UNKNOWN,
					},
				}),
			)

			return redirect(link.url, 307)
		},
		{
			query: LinkRedirectQuerySchema,
		},
	)
