import { baseElysia } from '@/base'
import db from '@/lib/db'
import { env } from '@/lib/env'
import { apiKeyAuthorizationMiddleware } from '@/middlewares/auth'
import { defaultRateLimitOptions } from '@/middlewares/rateLimit'
import {
	LinkIdSchema,
	LinkShortNameSchema,
	LinkTitleSchema,
	LinkURLSchema,
} from '@/types/schemas/link'
import { ApiKeyAuthorizationHeaders } from '@/types/schemas/middleware'
import { fetchUrlTitle } from '@/utils/fetchUrlTitle'
import { generateLinkId } from '@/utils/generator'
import { logger } from '@/utils/logger'
import { Responses } from '@nexusog/golakost'
import { until } from '@open-draft/until'
import { ApiKeyPermission } from '@prisma/client'
import { t } from 'elysia'
import { rateLimit } from 'elysia-rate-limit'

export const CreateLinkBodySchema = t.Object({
	url: LinkURLSchema,
	shortName: t.Optional(LinkShortNameSchema),
})

export const LinkCreateRoute = baseElysia()
	.use(
		rateLimit({
			...defaultRateLimitOptions,
			max: env.CREATE_LINK_RATE_LIMIT,
			duration: env.CREATE_LINK_RATE_LIMIT_DURATION_MS,
		}),
	)
	.use(apiKeyAuthorizationMiddleware([ApiKeyPermission.LINK_WRITE]))
	.post(
		'',
		async ({ body, error, workspaceId }) => {
			const { shortName: linkShortName, url: linkURL } = body

			// check for existing link short name
			if (linkShortName !== undefined) {
				const {
					data: linkByShortName,
					error: LinkByShortNameFetchError,
				} = await until(() =>
					db.link.findUnique({
						where: {
							shortName: linkShortName,
						},
						select: {
							id: true,
						},
					}),
				)

				if (LinkByShortNameFetchError) {
					logger.fail(
						'Failed to Fetch Link by Shortname',
						LinkByShortNameFetchError,
					)
					return error(500, {
						error: true,
						message: 'Failed to Fetch Link by Shortname',
					})
				}

				if (linkByShortName) {
					return error(409, {
						error: true,
						message: 'Shortname already in use',
					})
				}
			}

			// generate id
			const { error: LinkIdGenerateError, data: linkId } = await until(
				() => generateLinkId(),
			)

			if (LinkIdGenerateError) {
				logger.fatal('Failed to generate Link ID')
				logger.fatal(LinkIdGenerateError)
				process.exit(1)
			}

			let { error: URLFetchError, data: linkTitle } = await until(() =>
				fetchUrlTitle(linkURL),
			)

			if (URLFetchError) {
				logger.warn('Failed to fetch link title', URLFetchError)
			}

			const { error: LinkCreateError } = await until(() =>
				db.link.create({
					data: {
						id: linkId,
						title: linkTitle ?? undefined,
						url: linkURL,
						shortName: linkShortName,
						workspace: {
							connect: {
								id: workspaceId,
							},
						},
					},
					select: {
						id: true,
					},
				}),
			)

			if (LinkCreateError) {
				logger.fail('Failed to create link', LinkCreateError)
				return error(500, {
					error: true,
					message: 'Failed to create link',
				})
			}

			return {
				error: false,
				message: 'Link created',
				data: {
					id: linkId,
					shortName: linkShortName,
					title: linkTitle ?? undefined,
				},
			}
		},
		{
			body: CreateLinkBodySchema,
			response: {
				200: Responses.ConstructSuccessResponseSchema(
					t.Object({
						id: LinkIdSchema,
						shortName: t.Optional(LinkShortNameSchema),
						title: t.Optional(LinkTitleSchema),
					}),
				),
				500: Responses.ErrorResponseSchema,
				409: Responses.ErrorResponseSchema,
			},
			headers: ApiKeyAuthorizationHeaders,
		},
	)
