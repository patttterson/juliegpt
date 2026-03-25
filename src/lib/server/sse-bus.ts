import { EventEmitter } from 'node:events';

export interface DiscordMessage {
	conversationId: string;
	authorName: string;
	content: string;
	timestamp: number;
}

class SSEBus extends EventEmitter {}

// Event name pattern: `message:<conversationId>`
export const sseBus = new SSEBus();
