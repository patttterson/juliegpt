import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { models } from '$lib/models.config';
import { discordClient } from '$lib/server/discord';
import { createConversation, listConversations, saveMessage } from '$lib/server/conversations';
import { ChannelType } from 'discord.js';

export const GET: RequestHandler = async ({ url }) => {
	const modelId = url.searchParams.get('modelId');
	if (!modelId) throw error(400, 'Missing modelId');

	const convos = await listConversations(modelId);
	return json(convos);
};

export const POST: RequestHandler = async ({ request, locals }) => {
	const { modelId, initialMessage } = await request.json();

	const model = models.find((m) => m.id === modelId);
	if (!model) throw error(404, `Model "${modelId}" not found`);

	const channel = await discordClient.channels.fetch(model.forumChannelId);
	if (!channel || channel.type !== ChannelType.GuildForum) {
		throw error(500, 'Discord channel not found or is not a forum channel');
	}

	const thread = await channel.threads.create({
		name: `Conversation with ${locals.user!.discordUsername}`,
		message: { content: initialMessage }
	});

	const conversationId = crypto.randomUUID();
	await createConversation(conversationId, modelId, thread.id);
	await saveMessage(conversationId, initialMessage, 'You', false, Date.now());

	return json({ conversationId, modelId });
};
