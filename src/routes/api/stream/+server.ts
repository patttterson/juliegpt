import type { RequestHandler } from '@sveltejs/kit';
import { sseBus, type DiscordMessage } from '$lib/server/sse-bus';

export const GET: RequestHandler = ({ url }) => {
	const conversationId = url.searchParams.get('conversationId');
	if (!conversationId) {
		return new Response('Missing conversationId', { status: 400 });
	}

	let cleanup: (() => void) | undefined;

	const body = new ReadableStream({
		start(controller) {
			const enc = new TextEncoder();

			const sendMessage = (data: DiscordMessage) => {
				controller.enqueue(enc.encode(`data: ${JSON.stringify(data)}\n\n`));
			};

			const sendClose = () => {
				controller.enqueue(enc.encode(`event: close\ndata: {}\n\n`));
				controller.close();
			};

			sseBus.on(`message:${conversationId}`, sendMessage);
			sseBus.on(`close:${conversationId}`, sendClose);
			cleanup = () => {
				sseBus.off(`message:${conversationId}`, sendMessage);
				sseBus.off(`close:${conversationId}`, sendClose);
			};
		},
		cancel() {
			cleanup?.();
		}
	});

	return new Response(body, {
		headers: {
			'Content-Type': 'text/event-stream',
			'Cache-Control': 'no-cache',
			Connection: 'keep-alive'
		}
	});
};
