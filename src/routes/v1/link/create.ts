import { baseElysia } from '@/base'
import {
	ConstructSuccessResponseSchemaWithData,
	GeneralErrorResponseSchema,
} from '@/types/response'
import {
	LinkAccessTokenSchema,
	LinkIdSchema,
	LinkShortNameSchema,
	LinkTitleSchema,
	LinkURLSchema,
} from '@/types/schema'
import { t } from 'elysia'
import * as NexusCrypto from '@nexusog/crypto'
import { generateId } from '@/utils/generateId'
import db from '@/lib/db'
import { until } from '@open-draft/until'
import { logger } from '@/utils/logger'
import { LinkAccessTokenRole } from '@prisma/client'

const LinkCreateBodySchema = t.Object(
	{
		title: LinkTitleSchema,
		url: LinkURLSchema,
		shortName: t.Optional(LinkShortNameSchema),
	},
	{
		default: {
			title: 'Google',
			url: 'https://google.com',
			shortName: 'google',
		},
	},
)

export const LinkCreateRoute = baseElysia().post(
	'',
	async ({ body, error: sendError }) => {
		const { title, url, shortName } = body

		// check if short name is taken
		if (shortName) {
			const { data: link, error: LinkFetchError } = await until(() =>
				db.link.findUnique({
					where: {
						shortName,
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

			// if link already exists, return error
			if (link) {
				return sendError(409, {
					error: true,
					message: 'Short name is already taken',
				})
			}
		}

		// generate id
		const id = await generateId()

		// if id is null, it usually means MAX_TRIES was reached
		if (!id) {
			logger.error(`Failed to generate ID`)
			return sendError(500, {
				error: true,
				message: 'Database error',
			})
		}

		const accessToken = NexusCrypto.utils.getRandomHex(32)

		// create link
		const { error: CreateLinkError } = await until(() =>
			db.link.create({
				data: {
					id,
					title,
					url,
					shortName,
					// create access token
					accessTokens: {
						create: {
							label: 'Owner',
							token: accessToken,
							role: LinkAccessTokenRole.OWNER,
						},
					},
				},
			}),
		)

		if (CreateLinkError) {
			logger.error(CreateLinkError)
			return sendError(500, {
				error: true,
				message: 'Database error',
			})
		}

		return {
			error: false,
			message: 'Link created',
			data: {
				id,
				token: accessToken,
			},
		}
	},
	{
		body: LinkCreateBodySchema,
		response: {
			200: ConstructSuccessResponseSchemaWithData(
				t.Object({
					id: LinkIdSchema,
					token: LinkAccessTokenSchema,
				}),
			),
			500: GeneralErrorResponseSchema,
			409: GeneralErrorResponseSchema,
			403: GeneralErrorResponseSchema,
		},
	},
)
