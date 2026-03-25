import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { generateState, generateCodeVerifier } from 'arctic';
import { getDiscordOAuthClient } from '$lib/server/auth';

export const GET: RequestHandler = async ({ cookies }) => {
	const discord = getDiscordOAuthClient();
	const state = generateState();
	const codeVerifier = generateCodeVerifier();
	const url = discord.createAuthorizationURL(state, codeVerifier, ['identify']);
	cookies.set('oauth_state', state, { path: '/', httpOnly: true, maxAge: 600 });
	cookies.set('oauth_code_verifier', codeVerifier, { path: '/', httpOnly: true, maxAge: 600 });
	return redirect(302, url.toString());
};
