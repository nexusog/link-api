import { baseElysia } from '@/base'
import {
	ConstructSuccessResponseSchemaWithData,
	GeneralErrorResponseSchema,
} from '@/types/response'
import { t } from 'elysia'

export const LinkCreateRoute = baseElysia().post(
	'',
	async () => {
		return {
			error: false,
			message: 'Link created',
			data: {},
		}
	},
	{
		response: {
			200: ConstructSuccessResponseSchemaWithData(t.Object({})),
			500: GeneralErrorResponseSchema,
			409: GeneralErrorResponseSchema,
			403: GeneralErrorResponseSchema,
		},
	},
)
