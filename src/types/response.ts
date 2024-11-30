import { t, TSchema } from 'elysia'

export const GeneralSuccessResponseSchema = t.Object({
	error: t.Literal(false),
	message: t.String(),
})

export const ConstructSuccessResponseSchemaWithData = <T extends TSchema>(
	data: T,
	options: Partial<Parameters<typeof t.Object>[1]> = {},
) => {
	return t.Composite(
		[
			GeneralSuccessResponseSchema,
			t.Object({
				data,
			}),
		],
		{
			readOnly: true,
			...options,
		},
	)
}

export const GeneralErrorResponseSchema = t.Object({
	error: t.Literal(true),
	message: t.String(),
})

export const ConstructErrorResponseSchemaWithData = <T extends TSchema>(
	data: T,
	options: Partial<Parameters<typeof t.Object>[1]> = {},
) => {
	return t.Composite(
		[
			GeneralErrorResponseSchema,
			t.Object({
				data,
			}),
		],
		{
			readOnly: true,
			...options,
		},
	)
}
