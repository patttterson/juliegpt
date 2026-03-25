import { db } from './db/index';
import { conversations, messages } from './db/schema';
import { eq, isNull } from 'drizzle-orm';

export async function createConversation(conversationId: string, modelId: string, threadId: string) {
	await db.insert(conversations).values({
		id: conversationId,
		modelId,
		threadId,
		createdAt: Date.now()
	});
}

export async function getThreadId(conversationId: string): Promise<string | undefined> {
	const row = await db.query.conversations.findFirst({
		where: eq(conversations.id, conversationId)
	});
	return row?.threadId;
}

export async function getConversationIdByThread(threadId: string): Promise<string | undefined> {
	const row = await db.query.conversations.findFirst({
		where: eq(conversations.threadId, threadId)
	});
	return row?.id;
}

export async function listConversations(modelId: string) {
	return db.query.conversations.findMany({
		where: (c, { and }) => and(eq(c.modelId, modelId), isNull(c.closedAt)),
		orderBy: (c, { desc }) => desc(c.createdAt)
	});
}

export async function closeConversation(conversationId: string) {
	await db.update(conversations).set({ closedAt: Date.now() }).where(eq(conversations.id, conversationId));
}

export async function saveMessage(
	conversationId: string,
	content: string,
	author: string,
	fromDiscord: boolean,
	timestamp: number
) {
	await db.insert(messages).values({
		id: crypto.randomUUID(),
		conversationId,
		content,
		author,
		fromDiscord,
		timestamp
	});
}

export async function getMessages(conversationId: string) {
	return db.query.messages.findMany({
		where: eq(messages.conversationId, conversationId),
		orderBy: (m, { asc }) => asc(m.timestamp)
	});
}
