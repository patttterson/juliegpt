<script>
	import logo from '$lib/assets/logo_full_white.svg';
</script>

<div class="login-page">
	<div class="login-card">
		<img src={logo} alt="JulieGPT" class="login-logo" />
		<p class="login-subtitle">Sign in to start chatting.</p>
		<a href="/auth/discord" class="discord-btn">
			<svg width="20" height="20" viewBox="0 0 127.14 96.36" fill="currentColor">
				<path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z"/>
			</svg>
			Sign in with Discord
		</a>
	</div>
</div>

<style>
	:global(body) {
		margin: 0;
	}

	.login-page {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 100vh;
		background: #1c1c1c;
		font-family: 'Comfortaa', cursive;
	}

	.login-card {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
		padding: 2.5rem 3rem;
		border-radius: 1.5rem;
		border: 1px solid #2e2e2e;
		background: #141414;
	}

	.login-logo {
		height: 3.5rem;
	}

	.login-title {
		font-size: 1.5rem;
		font-weight: 700;
		color: #ececec;
		margin: 0;
	}

	.login-subtitle {
		font-size: 0.9rem;
		color: #888;
		margin: 0;
	}

	.discord-btn {
		display: flex;
		align-items: center;
		gap: 0.625rem;
		margin-top: 0.5rem;
		padding: 0.625rem 1.25rem;
		border-radius: 0.625rem;
		background: #5865f2;
		color: white;
		font-size: 0.9rem;
		font-weight: 600;
		font-family: 'Comfortaa', cursive;
		text-decoration: none;
		transition: background 150ms;
	}
	.discord-btn:hover { background: #4752c4; }
</style>
