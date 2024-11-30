import { LinkAccessTokenRole } from '@prisma/client'
import { t } from 'elysia'

export const LinkTitleSchema = t.String({
	minLength: 2,
	maxLength: 100,
	description: 'The title of the link',
})

export const LinkURLSchema = t.String({
	minLength: 8,
	maxLength: 100,
	description: 'The URL of the link',
	format: 'uri',
})

export const LinkShortNameSchema = t.String({
	minLength: 2,
	maxLength: 100,
	description: 'The short name of the link',
})

export const LinkIdSchema = t.String({
	minLength: 1,
	description: 'The ID of the link',
})

export const LinkAccessTokenSchema = t.String({
	minLength: 1,
	description: 'The access token of the link',
})

export const LinkAccessTokenRoleSchema = t.Enum(LinkAccessTokenRole, {
	description: 'The role of the access token',
})

export const LinkAccessTokenRoleWithoutOwnerSchema = t.Enum(
	{
		[LinkAccessTokenRole.ADMIN]: LinkAccessTokenRole.ADMIN,
		[LinkAccessTokenRole.VIEWER]: LinkAccessTokenRole.VIEWER,
	},
	{
		description: 'The role of the access token without OWNER',
	},
)

export const LinkAccessTokenLabelSchema = t.String({
	minLength: 1,
	maxLength: 100,
	description: 'The label of the access token',
})

export const LinkAccessTokenIdSchema = t.String({
	minLength: 1,
	description: 'The ID of the access token',
})
