import { baseElysia } from '@/base'
import { RedirectRouteLinkFetchCacheMemoizer } from '@/lib/cache'
import db from '@/lib/db'
import { apiKeyAuthorizationMiddleware } from '@/middlewares/auth'
import {
	LinkEnabledSchema,
	LinkSmartEngagementCountingSettingSchema,
} from '@/types/schemas/link'
import { Responses } from '@nexusog/golakost'
import { until } from '@open-draft/until'
import { ApiKeyPermission } from '@prisma/client'
import { t } from 'elysia'

export const LinkPatchRouteBodySchema = t.Object({
	enabled: t.Optional(LinkEnabledSchema),
	smartEngagementCounting: t.Optional(
		LinkSmartEngagementCountingSettingSchema,
	),
})

export const LinkPatchRoute = baseElysia({
	prefix: '/:id',
})
	.use(apiKeyAuthorizationMiddleware([ApiKeyPermission.LINK_WRITE]))
	.patch(
		'',
		async ({ body, error, params }) => {
			const { id: linkId } = params
			const { enabled, smartEngagementCounting } = body

			const { error: LinkUpdateError, data: linkUpdatedRecord } =
				await until(() =>
					db.link.update({
						where: {
							id: linkId,
						},
						data: {
							enabled,
							smartEngagementCounting,
						},
						select: {
							// to prevent fail
							id: true,

							// select only which was updated
							enabled: enabled !== undefined,
							smartEngagementCounting:
								smartEngagementCounting !== undefined,
						},
					}),
				)

			if (LinkUpdateError) {
				return error(500, {
					error: true,
					message: 'Failed to update link',
				})
			}

			// remove cache
			RedirectRouteLinkFetchCacheMemoizer.remove(linkId)

			return {
				error: false,
				message: 'Link updated',
				data: linkUpdatedRecord,
			}
		},
		{
			body: LinkPatchRouteBodySchema,

			response: {
				200: Responses.ConstructSuccessResponseSchema(
					LinkPatchRouteBodySchema,
				),
				500: Responses.ErrorResponseSchema,
			},
		},
	)
