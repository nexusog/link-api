import { baseElysia } from '@/base'
import db from '@/lib/db'
import {
	ConstructSuccessResponseSchemaWithData,
	GeneralErrorResponseSchema,
} from '@/types/response'
import {
	LinkAccessTokenSchema,
	LinkIdSchema,
	LinkURLSchema,
} from '@/types/schema'
import { logger } from '@/utils/logger'
import { until } from '@open-draft/until'
import { LinkAccessTokenRole } from '@prisma/client'
import { t } from 'elysia'

const LinkGetQuerySchema = t.Object({
	token: LinkAccessTokenSchema,
})

export const LinkGetRoute = baseElysia().get(
	'/:id',
	async ({ query, params, error: sendError }) => {
		const { id } = params
		const { token } = query

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
				include: {
					accessTokens: true,
					engagements: true,
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

		const accessToken = link.accessTokens.find((e) => e.token === token)

		if (!accessToken) {
			return sendError(403, {
				error: true,
				message: 'Forbidden',
			})
		}

		const baseResponse = {
			...link,
			accessTokens:
				accessToken.role === LinkAccessTokenRole.VIEWER
					? undefined
					: link.accessTokens,
		}

		return {
			error: false,
			message: 'Link found',
			data: baseResponse,
		}
	},
	{
		query: LinkGetQuerySchema,
		response: {
			200: ConstructSuccessResponseSchemaWithData(
				t.Object({
					id: LinkIdSchema,
					url: LinkURLSchema,
				}),
				{
					additionalProperties: true,
				},
			),
			404: GeneralErrorResponseSchema,
			500: GeneralErrorResponseSchema,
			403: GeneralErrorResponseSchema,
		},
	},
)
