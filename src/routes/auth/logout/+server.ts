import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { deleteSession, SESSION_COOKIE } from '$lib/server/auth';

export const POST: RequestHandler = async ({ cookies }) => {
	const sessionId = cookies.get(SESSION_COOKIE);
	if (sessionId) await deleteSession(sessionId);
	cookies.delete(SESSION_COOKIE, { path: '/' });
	return redirect(302, '/login');
};
