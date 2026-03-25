declare global {
	namespace App {
		interface Locals {
			user: {
				id: string;
				discordUsername: string;
				discordDisplayName: string;
				avatar: string | null;
			} | null;
			session: { id: string; expiresAt: number } | null;
		}
	}
}

export {};
