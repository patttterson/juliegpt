export interface Model {
	id: string; // slug used in API calls, e.g. "julie"
	displayName: string;
	avatarColor: string;
	forumChannelId: string; // Discord forum channel ID — only read server-side
}

export const models: Model[] = [
	{
		id: 'julie',
		displayName: 'Julie',
		avatarColor: '#9B59B6',
		forumChannelId: '1486297425777000478'
	}
];

export type PublicModel = Pick<Model, 'id' | 'displayName' | 'avatarColor'>;
export const publicModels: PublicModel[] = models.map(({ id, displayName, avatarColor }) => ({
	id,
	displayName,
	avatarColor
}));
