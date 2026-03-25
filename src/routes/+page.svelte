<script lang="ts">
	import logo from '$lib/assets/logo.svg';
	import logoFull from '$lib/assets/logo_full.svg';
	import { publicModels, type PublicModel } from '$lib/models.config';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	interface Message {
		author: string;
		content: string;
		fromDiscord: boolean;
		timestamp: number;
	}

	interface Conversation {
		id: string;
		modelId: string;
		createdAt: number;
	}

	let dark = $state(true);
	let inputValue = $state('');
	let sidebarOpen = $state(true);
	let activeModel = $state<PublicModel | null>(null);
	let activeConversationId = $state<string | null>(null);
	let messages = $state<Message[]>([]);
	let conversations = $state<Conversation[]>([]);
	let sending = $state(false);
	let conversationClosed = $state(false);

	let eventSource: EventSource | null = null;

	const suggestedPrompts = [
		{ icon: '✦', title: 'Recommend an artist', subtitle: "Find new music you'll like" },
		{ icon: '⟳', title: 'Twitter Drama', subtitle: 'Explain the latest drama in the MCSR community' },
		{ icon: '✎', title: 'Translate a message', subtitle: 'Translate a sentence into another language' },
		{ icon: '◈', title: 'Debug my Minecraft', subtitle: 'be sure to send ONLY the error code, nothing else' }
	];

	function formatDate(ts: number) {
		const d = new Date(ts);
		const now = new Date();
		const isToday = d.toDateString() === now.toDateString();
		const yesterday = new Date(now);
		yesterday.setDate(yesterday.getDate() - 1);
		const isYesterday = d.toDateString() === yesterday.toDateString();
		if (isToday) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
		if (isYesterday) return 'Yesterday';
		return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
	}

	function groupConversations(convos: Conversation[]) {
		const now = new Date();
		const groups: Record<string, Conversation[]> = {};
		for (const c of convos) {
			const d = new Date(c.createdAt);
			const isToday = d.toDateString() === now.toDateString();
			const yesterday = new Date(now);
			yesterday.setDate(yesterday.getDate() - 1);
			const isYesterday = d.toDateString() === yesterday.toDateString();
			const key = isToday ? 'Today' : isYesterday ? 'Yesterday' : 'Previous 7 Days';
			if (!groups[key]) groups[key] = [];
			groups[key].push(c);
		}
		return groups;
	}

	function openSSEStream(conversationId: string) {
		eventSource?.close();
		eventSource = new EventSource(`/api/stream?conversationId=${conversationId}`);
		eventSource.onmessage = (e) => {
			const msg = JSON.parse(e.data);
			messages.push({ author: msg.authorName, content: msg.content, timestamp: msg.timestamp, fromDiscord: true });
		};
		eventSource.addEventListener('close', () => {
			conversationClosed = true;
			eventSource?.close();
			eventSource = null;
		});
	}

	async function loadConversations(modelId: string) {
		const res = await fetch(`/api/conversations?modelId=${modelId}`);
		conversations = await res.json();
	}

	async function loadMessages(conversationId: string) {
		const res = await fetch(`/api/conversations/${conversationId}/messages`);
		messages = await res.json();
	}

	async function selectConversation(conversationId: string) {
		eventSource?.close();
		activeConversationId = conversationId;
		conversationClosed = false;
		messages = [];
		await loadMessages(conversationId);
		openSSEStream(conversationId);
	}

	async function selectModel(model: PublicModel) {
		eventSource?.close();
		activeModel = model;
		activeConversationId = null;
		messages = [];
		await loadConversations(model.id);
	}

	function newChat() {
		eventSource?.close();
		activeConversationId = null;
		messages = [];
	}

	async function startConversation(content: string) {
		if (!activeModel || !content.trim() || conversationClosed) return;
		sending = true;
		try {
			const res = await fetch('/api/conversations', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ modelId: activeModel.id, initialMessage: content })
			});
			const { conversationId } = await res.json();
			activeConversationId = conversationId;
			messages.push({ author: 'You', content, timestamp: Date.now(), fromDiscord: false });
			inputValue = '';
			openSSEStream(conversationId);
			await loadConversations(activeModel.id);
		} finally {
			sending = false;
		}
	}

	async function sendMessage(content: string) {
		if (!activeConversationId || !content.trim()) return;
		sending = true;
		try {
			await fetch('/api/messages', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ conversationId: activeConversationId, content })
			});
			messages.push({ author: 'You', content, timestamp: Date.now(), fromDiscord: false });
			inputValue = '';
		} finally {
			sending = false;
		}
	}

	function handleSend() {
		const content = inputValue.trim();
		if (!content || sending) return;
		if (activeConversationId) sendMessage(content);
		else startConversation(content);
	}

	$effect(() => {
		return () => eventSource?.close();
	});
</script>

<div class="app-shell" class:dark>

	{#if sidebarOpen}
	<aside class="sidebar">

		<div class="sidebar-header">
			{#if activeModel}
				<button class="sidebar-back-btn" onclick={() => { activeModel = null; conversations = []; newChat(); }}>
					<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
						<polyline points="15 18 9 12 15 6"/>
					</svg>
					<span class="sidebar-model-name">{activeModel.displayName}</span>
				</button>
			{:else}
				<img src={logoFull} alt="JulieGPT" class="sidebar-wordmark" />
			{/if}
			<button class="sidebar-icon-btn" onclick={newChat} aria-label="New chat">
				<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
				</svg>
			</button>
		</div>

		<div class="sidebar-search">
			<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
				<circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
			</svg>
			<span>Search</span>
		</div>

		<nav class="sidebar-nav">
			{#if activeModel}
				{#each Object.entries(groupConversations(conversations)) as [group, convos]}
					<div class="conversation-group">
						<p class="nav-section-label">{group}</p>
						{#each convos as convo}
							<button
								class="conversation-item"
								class:active={activeConversationId === convo.id}
								onclick={() => selectConversation(convo.id)}>
								Chat · {formatDate(convo.createdAt)}
							</button>
						{/each}
					</div>
				{/each}
				{#if conversations.length === 0}
					<p class="sidebar-empty-state">No conversations yet.</p>
				{/if}
			{:else}
				<p class="nav-section-label">Models</p>
				{#each publicModels as model}
					<button class="model-item" onclick={() => selectModel(model)}>
						<span class="model-avatar" style="background:{model.avatarColor};">
							{model.displayName[0]}
						</span>
						{model.displayName}
					</button>
				{/each}
			{/if}
		</nav>

		<div class="sidebar-footer">
			<div class="user-profile">
				{#if data.user!.avatar}
					<img
						src="https://cdn.discordapp.com/avatars/{data.user!.id}/{data.user!.avatar}.png?size=64"
						alt={data.user!.discordDisplayName}
						class="user-avatar-img"
					/>
				{:else}
					<div class="user-avatar">{data.user!.discordDisplayName[0]}</div>
				{/if}
				<span class="username">{data.user!.discordDisplayName}</span>
			</div>
			<form method="POST" action="/auth/logout">
				<button class="sidebar-icon-btn" type="submit" aria-label="Sign out">
					<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
						<polyline points="16 17 21 12 16 7"/>
						<line x1="21" y1="12" x2="9" y2="12"/>
					</svg>
				</button>
			</form>
		</div>
	</aside>
	{/if}

	<div class="main-panel">

		<header class="topbar">
			<div class="topbar-left">
				<button class="topbar-icon-btn" onclick={() => (sidebarOpen = !sidebarOpen)} aria-label="Toggle sidebar">
					<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
					</svg>
				</button>
				<button class="model-selector">
					<span>{activeModel ? activeModel.displayName : 'JulieGPT'}</span>
					<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
						<polyline points="6 9 12 15 18 9"/>
					</svg>
				</button>
			</div>
			<div class="topbar-right">
				<button class="topbar-icon-btn" onclick={() => (dark = !dark)} aria-label="Toggle dark mode">
					{#if dark}
						<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
							<circle cx="12" cy="12" r="5"/>
							<line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
							<line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
							<line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
							<line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
						</svg>
					{:else}
						<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
							<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
						</svg>
					{/if}
				</button>
				<button class="share-btn">
					<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
						<line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
					</svg>
					<span>Share</span>
				</button>
			</div>
		</header>

		<main class="chat-area">

			{#if activeModel && messages.length > 0}
				<div class="message-thread">
					{#each messages as message}
						{#if message.fromDiscord}
							<p class="model-message">{message.content}</p>
						{:else}
							<div class="user-message-row">
								<div class="user-bubble">{message.content}</div>
							</div>
						{/if}
					{/each}
					{#if conversationClosed}
						<p class="conversation-closed-notice">This conversation was closed.</p>
					{/if}
				</div>

			{:else}
				<div class="welcome-screen">
					<img src={logo} alt="JulieGPT" class="welcome-logo" />
					<div class="welcome-text">
						<h1 class="welcome-heading">Good afternoon, {data.user!.discordDisplayName}.</h1>
						{#if activeModel}
							<p class="welcome-subtext">Send a message to start chatting with {activeModel.displayName}.</p>
						{:else}
							<p class="welcome-subtext">Pick a model from the sidebar to get started.</p>
						{/if}
					</div>

					{#if !activeModel}
						<div class="prompt-grid">
							{#each suggestedPrompts as prompt}
								<button class="prompt-card">
									<span class="prompt-icon">{prompt.icon}</span>
									<p class="prompt-title">{prompt.title}</p>
									<p class="prompt-subtitle">{prompt.subtitle}</p>
								</button>
							{/each}
						</div>
					{/if}
				</div>
			{/if}

			<div class="input-area">
				<div class="input-box">
					<textarea
						class="message-input"
						bind:value={inputValue}
						placeholder={activeModel ? `Message ${activeModel.displayName}...` : 'Select a model to start chatting...'}
						disabled={!activeModel || sending || conversationClosed}
						rows="3"
						onkeydown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
					></textarea>
					<div class="input-toolbar">
						<div class="input-actions">
							<button class="input-icon-btn" aria-label="Attach file">
								<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
									<path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
								</svg>
							</button>
							<button class="input-icon-btn" aria-label="Voice input">
								<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
									<path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
									<path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/>
								</svg>
							</button>
						</div>
						<button
							class="send-btn"
							class:ready={inputValue.trim() && activeModel && !sending && !conversationClosed}
							onclick={handleSend}
							aria-label="Send message">
							<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
								<line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/>
							</svg>
						</button>
					</div>
				</div>
				<p class="disclaimer">JulieGPT can NEVER make mistakes. Do NOT double check important information.</p>
			</div>
		</main>
	</div>
</div>

<style>
	/* ── Layout ── */
	.app-shell {
		display: flex;
		height: 100vh;
		overflow: hidden;
		background: var(--bg-root);
		color: var(--text-primary);
	}

	/* ── Sidebar ── */
	.sidebar {
		display: flex;
		flex-direction: column;
		width: 16rem;
		flex-shrink: 0;
		height: 100%;
		border-right: 1px solid var(--border-side);
		background: var(--bg-sidebar);
	}

	.sidebar-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.75rem 0.75rem 0.5rem;
	}

	.sidebar-wordmark {
		height: 2rem;
		width: auto;
		padding-left: 0.25rem;
	}

	.sidebar-back-btn {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.25rem 0.5rem 0.25rem 0.25rem;
		border-radius: 0.5rem;
		font-size: 0.875rem;
		color: var(--text-secondary);
		cursor: pointer;
		transition: background 150ms;
	}
	.sidebar-back-btn:hover { background: var(--bg-hover-side); }

	.sidebar-model-name {
		font-weight: 600;
		color: var(--text-primary);
	}

	.sidebar-icon-btn {
		padding: 0.375rem;
		border-radius: 0.5rem;
		color: var(--text-secondary);
		cursor: pointer;
		transition: background 150ms;
	}
	.sidebar-icon-btn:hover { background: var(--bg-hover-side); }

	.sidebar-search {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin: 0 0.75rem 0.5rem;
		padding: 0.5rem 0.75rem;
		border-radius: 0.5rem;
		font-size: 0.875rem;
		background: var(--bg-search);
		color: var(--text-muted);
	}

	.sidebar-nav {
		flex: 1;
		overflow-y: auto;
		padding: 0 0.75rem 0.5rem;
	}

	.nav-section-label {
		padding: 0.25rem 0.5rem;
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--text-muted);
	}

	.conversation-group { margin-bottom: 0.75rem; }

	.conversation-item {
		display: block;
		width: 100%;
		text-align: left;
		padding: 0.5rem 0.75rem;
		border-radius: 0.5rem;
		font-size: 0.875rem;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		color: var(--text-list);
		cursor: pointer;
		transition: background 150ms;
	}
	.conversation-item:not(.active):hover { background: var(--bg-hover-side); }
	.conversation-item.active {
		background: var(--bg-active);
		color: var(--text-primary);
	}

	.model-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		width: 100%;
		text-align: left;
		padding: 0.5rem 0.75rem;
		border-radius: 0.5rem;
		font-size: 0.875rem;
		color: var(--text-list);
		cursor: pointer;
		transition: background 150ms;
	}
	.model-item:hover { background: var(--bg-hover-side); }

	.model-avatar {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 1.25rem;
		height: 1.25rem;
		border-radius: 50%;
		font-size: 0.75rem;
		font-weight: 600;
		color: white;
		flex-shrink: 0;
	}

	.sidebar-empty-state {
		padding: 0.5rem 0.75rem;
		font-size: 0.75rem;
		color: var(--text-muted);
	}

	.sidebar-footer {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.75rem;
		border-top: 1px solid var(--border-side);
	}

	.user-profile {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.username {
		font-size: 0.875rem;
		color: var(--text-secondary);
	}

	.user-avatar {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 1.75rem;
		height: 1.75rem;
		border-radius: 50%;
		font-size: 0.75rem;
		font-weight: 600;
		color: white;
		background: #9B59B6;
	}

	.user-avatar-img {
		width: 1.75rem;
		height: 1.75rem;
		border-radius: 50%;
		object-fit: cover;
	}

	/* ── Main panel ── */
	.main-panel {
		display: flex;
		flex-direction: column;
		flex: 1;
		height: 100%;
		overflow: hidden;
		background: var(--bg-main);
	}

	/* ── Topbar ── */
	.topbar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.75rem 1rem;
		border-bottom: 1px solid var(--border-header);
		flex-shrink: 0;
	}

	.topbar-left, .topbar-right {
		display: flex;
		align-items: center;
		gap: 0.25rem;
	}

	.topbar-icon-btn {
		padding: 0.375rem;
		border-radius: 0.5rem;
		color: var(--text-secondary);
		cursor: pointer;
		transition: background 150ms;
	}
	.topbar-icon-btn:hover { background: var(--bg-hover-main); }

	.model-selector {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.375rem 0.75rem;
		border-radius: 0.5rem;
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--text-primary);
		cursor: pointer;
		transition: background 150ms;
	}
	.model-selector:hover { background: var(--bg-hover-main); }

	.share-btn {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.375rem 0.75rem;
		border-radius: 0.5rem;
		font-size: 0.875rem;
		color: var(--text-secondary);
		cursor: pointer;
		transition: background 150ms;
	}
	.share-btn:hover { background: var(--bg-hover-main); }

	/* ── Chat area ── */
	.chat-area {
		flex: 1;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
		padding: 0 1rem 1rem;
	}

	/* ── Message thread ── */
	.message-thread {
		flex: 1;
		width: 100%;
		max-width: 42rem;
		margin: 0 auto;
		padding: 1.5rem 0;
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.model-message {
		font-size: 0.875rem;
		line-height: 1.625;
		color: var(--text-primary);
	}

	.conversation-closed-notice {
		text-align: center;
		font-size: 0.75rem;
		color: var(--text-muted);
		padding: 0.5rem 0;
		border-top: 1px solid var(--border-side);
		margin-top: 0.5rem;
	}

	.user-message-row {
		display: flex;
		justify-content: flex-end;
	}

	.user-bubble {
		max-width: 32rem;
		padding: 0.625rem 1rem;
		border-radius: 1rem;
		font-size: 0.875rem;
		background: var(--bubble-bg);
		color: var(--bubble-text);
	}

	/* ── Welcome screen ── */
	.welcome-screen {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 1.5rem;
	}

	.welcome-logo { width: 4rem; height: 4rem; }

	.welcome-text { text-align: center; }

	.welcome-heading {
		font-size: 1.875rem;
		font-weight: 600;
		margin-bottom: 0.25rem;
		color: var(--text-primary);
	}

	.welcome-subtext {
		font-size: 1rem;
		color: var(--text-secondary);
	}

	.prompt-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 0.75rem;
		width: 100%;
		max-width: 42rem;
	}

	.prompt-card {
		text-align: left;
		padding: 1rem;
		border-radius: 1rem;
		border: 1px solid var(--border-card);
		background: var(--bg-card);
		cursor: pointer;
		transition: background 150ms, border-color 150ms;
	}
	.prompt-card:hover {
		background: var(--bg-card-hover);
		border-color: var(--border-card-hover);
	}

	.prompt-icon {
		display: block;
		font-size: 1.125rem;
		margin-bottom: 0.5rem;
		color: #9B59B6;
	}

	.prompt-title {
		font-size: 0.875rem;
		font-weight: 600;
		margin-bottom: 0.125rem;
		color: var(--text-primary);
	}

	.prompt-subtitle {
		font-size: 0.75rem;
		color: var(--text-muted);
	}

	/* ── Input area ── */
	.input-area {
		width: 100%;
		max-width: 42rem;
		margin: 1rem auto 0;
	}

	.input-box {
		border-radius: 1rem;
		border: 1px solid var(--border-card);
		background: var(--bg-input);
		overflow: hidden;
		box-shadow: 0 1px 2px rgba(0,0,0,.05);
	}

	.message-input {
		width: 100%;
		padding: 1rem 1rem 0.5rem;
		font-size: 0.875rem;
		font-family: 'Comfortaa', cursive;
		resize: none;
		outline: none;
		background: transparent;
		color: var(--text-primary);
	}
	.message-input:disabled { opacity: 0.5; }

	.input-toolbar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0 0.75rem 0.75rem;
	}

	.input-actions {
		display: flex;
		align-items: center;
		gap: 0.25rem;
	}

	.input-icon-btn {
		padding: 0.5rem;
		border-radius: 0.5rem;
		color: var(--text-muted);
		cursor: pointer;
		transition: background 150ms;
	}
	.input-icon-btn:hover { background: var(--bg-hover-icon); }

	.send-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 2rem;
		height: 2rem;
		border-radius: 50%;
		cursor: pointer;
		transition: background 150ms, color 150ms;
		background: var(--send-off-bg);
		color: var(--send-off-color);
	}
	.send-btn.ready {
		background: #9B59B6;
		color: white;
	}

	.disclaimer {
		font-size: 0.75rem;
		text-align: center;
		margin-top: 0.75rem;
		color: var(--text-footer);
	}
</style>
