import { baseElysia } from '@/base'
import {
	ConstructSuccessResponseSchemaWithData,
	GeneralErrorResponseSchema,
} from '@/types/response'
import { ApiKeyLabelSchema, ApiKeySchema } from '@/types/schema'
import { t } from 'elysia'
import NexusCrypto from '@nexusog/crypto'
import db from '@/lib/db'
import { until } from '@open-draft/until'

const CreateAPIKeyBodySchema = t.Object({
	label: ApiKeyLabelSchema,
})

export const CreateAPIKeyRoute = baseElysia({
	prefix: '',
	name: 'CreateAPIKeyRoute',
}).post(
	'',
	async ({ body, error: sendError }) => {
		const { label } = body

		const { data: apiKey, error: CreateAPIKeyError } = await until(() =>
			db.apiKey.create({
				data: {
					label,
					key: NexusCrypto.utils.getRandomHex(32),
				},
			}),
		)

		if (CreateAPIKeyError) {
			return sendError(500, {
				error: true,
				message: 'Failed to create API key',
			})
		}

		return {
			error: false,
			message: 'API key created',
			data: {
				apiKey: apiKey.key,
			},
		}
	},
	{
		body: CreateAPIKeyBodySchema,
		response: {
			200: ConstructSuccessResponseSchemaWithData(
				t.Object({
					apiKey: ApiKeySchema,
				}),
			),
			500: GeneralErrorResponseSchema,
		},
		detail: {
			description: 'Generate a new API Key',
		},
	},
)
