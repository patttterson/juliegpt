import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';

export const users = sqliteTable('users', {
	id: text('id').primaryKey(),
	discordUsername: text('discord_username').notNull(),
	discordDisplayName: text('discord_display_name').notNull(),
	avatar: text('avatar'),
	createdAt: integer('created_at').notNull()
});

export const sessions = sqliteTable('sessions', {
	id: text('id').primaryKey(),
	userId: text('user_id').notNull().references(() => users.id),
	expiresAt: integer('expires_at').notNull()
});

export const sessionsRelations = relations(sessions, ({ one }) => ({
	user: one(users, { fields: [sessions.userId], references: [users.id] })
}));

export const conversations = sqliteTable('conversations', {
	id: text('id').primaryKey(),
	modelId: text('model_id').notNull(),
	threadId: text('thread_id').notNull().unique(),
	createdAt: integer('created_at').notNull(),
	closedAt: integer('closed_at')
});

export const messages = sqliteTable('messages', {
	id: text('id').primaryKey(),
	conversationId: text('conversation_id')
		.notNull()
		.references(() => conversations.id),
	content: text('content').notNull(),
	author: text('author').notNull(),
	fromDiscord: integer('from_discord', { mode: 'boolean' }).notNull(),
	timestamp: integer('timestamp').notNull()
});
