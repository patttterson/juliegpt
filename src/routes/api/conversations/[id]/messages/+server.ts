import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { getMessages } from '$lib/server/conversations';

export const GET: RequestHandler = async ({ params }) => {
	const { id } = params;
	if (!id) throw error(400, 'Missing conversation id');

	const msgs = await getMessages(id);
	return json(msgs);
};
