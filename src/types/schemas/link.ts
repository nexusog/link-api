import { env } from '@/lib/env'
import { EngagementType } from '@prisma/client'
import { t } from 'elysia'

export const LinkTitleSchema = t.String({
	minLength: 1,
	maxLength: 100,
	description: 'The title of the link',
})

export const LinkIdSchema = t.String({
	minLength: 1,
	description: 'The ID of the link',
	pattern: '[0-9a-f]',
})

export const LinkURLSchema = t.String({
	minLength: 8,
	maxLength: 512,
	description: 'The URL of the link',
	format: 'uri',
})

export const LinkShortNameSchema = t.String({
	minLength: 2,
	maxLength: 100,
	description: 'The short name of the link',
	pattern: `^[a-zA-Z0-9${env.LINK_SHORT_NAME_ALLOWED_SYMBOLIC_CHARACTERS}]*$`,
})

export const LinkEngagementSchema = t.Enum(EngagementType)
