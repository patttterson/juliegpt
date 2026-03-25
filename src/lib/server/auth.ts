import { Discord } from 'arctic';
import { eq } from 'drizzle-orm';
import { env } from '$env/dynamic/private';
import { db } from './db/index';
import { sessions } from './db/schema';

export const SESSION_COOKIE = 'session';
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export function getDiscordOAuthClient() {
	return new Discord(
		env.DISCORD_CLIENT_ID,
		env.DISCORD_CLIENT_SECRET,
		`${env.ORIGIN}/auth/discord/callback`
	);
}

export async function createSession(userId: string): Promise<string> {
	const id = crypto.randomUUID().replace(/-/g, '');
	await db.insert(sessions).values({ id, userId, expiresAt: Date.now() + SESSION_TTL_MS });
	return id;
}

export async function validateSession(sessionId: string) {
	const row = await db.query.sessions.findFirst({
		where: eq(sessions.id, sessionId),
		with: { user: true }
	});
	if (!row || row.expiresAt < Date.now()) return null;
	return row;
}

export async function deleteSession(sessionId: string) {
	await db.delete(sessions).where(eq(sessions.id, sessionId));
}
