import { Menu } from './types.js';

export const getMenu = async (): Promise<Menu> => {
	const response = await fetch('/api/menu');
	return response.json();
};
