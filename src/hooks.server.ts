import { redirect } from '@sveltejs/kit';
import type { Handle } from '@sveltejs/kit';
import { initDiscordBot } from '$lib/server/discord';
import { validateSession, SESSION_COOKIE } from '$lib/server/auth';

export const handle: Handle = async ({ event, resolve }) => {
	await initDiscordBot();

	const sessionId = event.cookies.get(SESSION_COOKIE);
	if (sessionId) {
		const session = await validateSession(sessionId);
		event.locals.user = session?.user ?? null;
		event.locals.session = session ? { id: session.id, expiresAt: session.expiresAt } : null;
	} else {
		event.locals.user = null;
		event.locals.session = null;
	}

	const isPublic =
		event.url.pathname.startsWith('/auth') || event.url.pathname === '/login';

	if (!event.locals.user && !isPublic) {
		return redirect(302, '/login');
	}

	return resolve(event);
};
