import { redirect, error } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/server/db/index';
import { users } from '$lib/server/db/schema';
import { getDiscordOAuthClient, createSession, SESSION_COOKIE } from '$lib/server/auth';

export const GET: RequestHandler = async ({ url, cookies }) => {
	const code = url.searchParams.get('code');
	const state = url.searchParams.get('state');
	const storedState = cookies.get('oauth_state');

	const codeVerifier = cookies.get('oauth_code_verifier');

	if (!code || state !== storedState || !codeVerifier) throw error(400, 'Invalid OAuth state');

	const discord = getDiscordOAuthClient();
	const tokens = await discord.validateAuthorizationCode(code, codeVerifier);

	const userRes = await fetch('https://discord.com/api/users/@me', {
		headers: { Authorization: `Bearer ${tokens.accessToken()}` }
	});
	const discordUser = await userRes.json();

	await db
		.insert(users)
		.values({
			id: discordUser.id,
			discordUsername: discordUser.username,
			discordDisplayName: discordUser.global_name ?? discordUser.username,
			avatar: discordUser.avatar,
			createdAt: Date.now()
		})
		.onConflictDoUpdate({
			target: users.id,
			set: {
				discordUsername: discordUser.username,
				discordDisplayName: discordUser.global_name ?? discordUser.username,
				avatar: discordUser.avatar
			}
		});

	const sessionId = await createSession(discordUser.id);
	cookies.set(SESSION_COOKIE, sessionId, {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		maxAge: 30 * 24 * 60 * 60
	});

	return redirect(302, '/');
};
