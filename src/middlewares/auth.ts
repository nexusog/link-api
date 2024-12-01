import db from '@/lib/db'
import { until } from '@open-draft/until'
import { LinkAccessTokenRole } from '@prisma/client'
import { Elysia, error, t } from 'elysia'

export const apiKeyAuthGuardHeadersSchema = t.Object({
	authorization: t.String(),
})

export const apiKeyAuthGuard = () =>
	new Elysia({
		name: 'authGuard',
	})
		.guard({
			headers: apiKeyAuthGuardHeadersSchema,
		})
		.resolve(
			{ as: 'scoped' },
			async ({
				headers: { authorization },
			}): Promise<{ apiKey: string; apiKeyId: string }> => {
				const apiKey = authorization.replace('Bearer ', '').trim()

				if (!apiKey) {
					throw new Response(
						JSON.stringify({
							error: true,
							message: 'No API key provided',
						}),
						{
							status: 401,
							headers: {
								'Content-Type': 'application/json',
							},
						},
					)
				}

				const { data: apiKeyRecord, error: apiKeyError } = await until(
					() =>
						db.apiKey.findUniqueOrThrow({
							where: {
								key: apiKey,
							},
							select: {
								id: true,
							},
						}),
				)

				if (apiKeyError) {
					throw new Response(
						JSON.stringify({
							error: true,
							message: 'Invalid API key',
						}),
						{
							status: 401,
							headers: {
								'Content-Type': 'application/json',
							},
						},
					)
				}

				return { apiKey, apiKeyId: apiKeyRecord.id }
			},
		)

export const accessTokenAuthGuard = (
	allowedRoles: LinkAccessTokenRole[] = [],
) =>
	new Elysia({
		name: 'accessTokenAuthGuard',
	})
		.guard({
			headers: apiKeyAuthGuardHeadersSchema,
		})
		.resolve(
			{ as: 'scoped' },
			async ({
				headers: { authorization },
			}): Promise<{
				accessToken: string
				linkId: string
				accessTokenId: string
				role: LinkAccessTokenRole
			}> => {
				const accessToken = authorization.replace('Bearer ', '').trim()

				if (!accessToken) {
					throw new Response(
						JSON.stringify({
							error: true,
							message: 'No access token provided',
						}),
						{
							status: 401,
							headers: {
								'Content-Type': 'application/json',
							},
						},
					)
				}

				const { data: accessTokenRecord, error: accessTokenError } =
					await until(() =>
						db.linkAccessToken.findUniqueOrThrow({
							where: {
								token: accessToken,
							},
							select: {
								id: true,
								role: true,
								link: {
									select: {
										id: true,
									},
								},
							},
						}),
					)

				if (accessTokenError) {
					throw new Response(
						JSON.stringify({
							error: true,
							message: 'Invalid access token',
						}),
						{
							status: 401,
							headers: {
								'Content-Type': 'application/json',
							},
						},
					)
				}

				if (
					allowedRoles.length > 0 &&
					allowedRoles.includes(accessTokenRecord.role) === false
				) {
					throw new Response(
						JSON.stringify({
							error: true,
							message: 'Forbidden',
						}),
						{
							status: 403,
							headers: {
								'Content-Type': 'application/json',
							},
						},
					)
				}

				return {
					accessToken,
					role: accessTokenRecord.role,
					linkId: accessTokenRecord.link.id,
					accessTokenId: accessTokenRecord.id,
				}
			},
		)
