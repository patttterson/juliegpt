import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { discordClient } from '$lib/server/discord';
import { getThreadId, saveMessage } from '$lib/server/conversations';
import { ChannelType } from 'discord.js';

export const POST: RequestHandler = async ({ request }) => {
	const { conversationId, content } = await request.json();

	const threadId = await getThreadId(conversationId);
	if (!threadId) throw error(404, 'Conversation not found');

	const thread = await discordClient.channels.fetch(threadId);
	if (!thread || thread.type !== ChannelType.PublicThread) {
		throw error(500, 'Discord thread not found');
	}

	await thread.send(content);
	await saveMessage(conversationId, content, 'You', false, Date.now());

	return json({ ok: true });
};
