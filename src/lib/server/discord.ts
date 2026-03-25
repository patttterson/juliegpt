import { Client, GatewayIntentBits, Events } from 'discord.js';
import { env } from '$env/dynamic/private';
import { sseBus } from './sse-bus';
import { getConversationIdByThread, saveMessage, closeConversation } from './conversations';

export const discordClient = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent
	]
});

export async function initDiscordBot() {
	if (discordClient.isReady()) return;

	discordClient.on(Events.MessageCreate, async (message) => {
		if (message.author.bot) return;

		const conversationId = await getConversationIdByThread(message.channelId);
		if (!conversationId) return;

		if (message.content.trim() === '/close') {
			await closeConversation(conversationId);
			if (message.channel.isThread()) await message.channel.setArchived(true);
			sseBus.emit(`close:${conversationId}`, {});
			return;
		}

		const authorName = message.member?.displayName ?? message.author.username;

		await saveMessage(conversationId, message.content, authorName, true, message.createdTimestamp);

		sseBus.emit(`message:${conversationId}`, {
			conversationId,
			authorName,
			content: message.content,
			timestamp: message.createdTimestamp
		});
	});

	await discordClient.login(env.DISCORD_BOT_TOKEN);
	console.log('[Discord] Bot logged in');
}
