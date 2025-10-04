import { Menu } from './types.js';

export const getMenu = async (): Promise<Menu> => {
	const response = await fetch('/api/menu');
	return response.json();
};

const fetchData = async <T>(
	url: string,
	options: RequestInit = {}
): Promise<T> => {
	const response = await fetch(url, options);
	if (!response.ok) {
		throw new Error(`Error ${response.status} occured`);
	}
	const json = response.json();
	return json;
};

export { fetchData };
