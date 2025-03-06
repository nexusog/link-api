import { baseElysia } from '@/base'
import db from '@/lib/db'
import { env } from '@/lib/env'
import { workspaceAuthorizationMiddleware } from '@/middlewares/auth'
import { defaultRateLimitOptions } from '@/middlewares/rateLimit'
import { LinkIdSchema } from '@/types/schemas/link'
import {
	WORKSPACE_SECRET_HEADER_KEY,
	WorkspaceAuthorizationHeaders,
} from '@/types/schemas/middleware'
import { WorkspaceSecretSchema } from '@/types/schemas/workspace'
import { logger } from '@/utils/logger'
import { Responses } from '@nexusog/golakost'
import { until } from '@open-draft/until'
import { t } from 'elysia'
import { rateLimit } from 'elysia-rate-limit'
import moment from 'moment'

export const WorkspaceStatsRoute = baseElysia()
	.use(
		rateLimit({
			...defaultRateLimitOptions,
			max: env.GET_WORKSPACE_STATS_RATE_LIMIT,
			duration: env.GET_WORKSPACE_STATS_RATE_LIMIT_DURATION_MS,
		}),
	)
	.get(
		'/:id/stats',
		async ({ params, headers, error }) => {
			const { id: workspaceId } = params

			const { [WORKSPACE_SECRET_HEADER_KEY]: workspaceSecret } = headers

			const { data: workspace, error: WorkspaceFetchError } = await until(
				() =>
					db.workspace.findFirst({
						where: {
							id: workspaceId,
							secret: workspaceSecret,
						},
						select: {
							id: true,
							_count: { select: { links: true } },
							links: {
								select: {
									_count: {
										select: {
											engagements: {
												where: { shouldCount: true },
											},
										},
									},
									engagements: {
										where: {
											createdAt: {
												gte: moment()
													.subtract(7, 'days')
													.toDate(),
											},
											shouldCount: true,
										},
										orderBy: {
											createdAt: 'desc',
										},
										select: {
											id: true,
										},
									},
								},
							},
						},
					}),
			)

			if (WorkspaceFetchError) {
				return error(500, {
					error: true,
					message: 'Failed to fetch workspace',
				})
			}

			if (!workspace) {
				return error(404, {
					error: true,
					message: 'Workspace not found',
				})
			}

			const {
				data: topPerformingLinks,
				error: TopPerformingLinksFetchError,
			} = await until(() =>
				db.link.findMany({
					where: {
						workspace: {
							id: workspaceId,
						},
					},
					orderBy: {
						engagements: {
							_count: 'desc',
						},
					},
					select: {
						id: true,
						_count: {
							select: {
								engagements: { where: { shouldCount: true } },
							},
						},
					},
					take: 3,
				}),
			)

			if (TopPerformingLinksFetchError) {
				logger.fail(
					'Failed to fetch top performing links',
					TopPerformingLinksFetchError,
				)

				return error(500, {
					error: true,
					message: 'Failed to fetch',
				})
			}

			return {
				error: false,
				message: 'Stats fetched successfully',
				data: {
					numberOfLinks: workspace._count.links,
					totalEngagements: workspace.links.reduce((acc, link) => {
						return acc + link._count.engagements
					}, 0),
					totalEngagementsLastWeek: workspace.links.reduce(
						(acc, link) => {
							return acc + link.engagements.length
						},
						0,
					),
					topPerformingLinks: topPerformingLinks.map((link) => ({
						id: link.id,
						totalEngagements: link._count.engagements,
					})),
				},
			}
		},
		{
			headers: t.Object({
				[WORKSPACE_SECRET_HEADER_KEY]: WorkspaceSecretSchema,
			}),
			response: {
				200: Responses.ConstructSuccessResponseSchema(
					t.Object({
						numberOfLinks: t.Number(),
						totalEngagements: t.Number(),
						totalEngagementsLastWeek: t.Number(),
						topPerformingLinks: t.Array(
							t.Object({
								id: LinkIdSchema,
								totalEngagements: t.Number(),
							}),
						),
					}),
				),
				500: Responses.ErrorResponseSchema,
				404: Responses.ErrorResponseSchema,
			},
		},
	)
