import { PrismaClient } from '@prisma/client'

const globalForDb = globalThis as unknown as { db: PrismaClient }

const db =
	globalForDb.db ||
	new PrismaClient({
		log:
			Bun.env.NODE_ENV == 'development'
				? ['query', 'error', 'warn']
				: ['warn', 'error'],
	})

if (Bun.env.NODE_ENV !== 'production') globalForDb.db = db

export default db
