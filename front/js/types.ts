export type MenuItemType = 'Rolls' | 'Sushi' | 'Hot Dishes';

export type TagColor = 'g' | 'b'; // green | blue

export type MenuTag = [TagColor, string];

export interface MenuItem {
	id: number;
	type: MenuItemType;
	title: string;
	description: string;
	tags: MenuTag[];
	price: number;
	availableDays: number[]; // Days of the week (1-7, where 1 = Monday, 7 = Sunday)
}

export type Menu = MenuItem[];

export type FilterType = MenuItemType | 'All';

export type DayOfWeek = 1 | 2 | 3 | 4 | 5 | 6 | 7; // 1 = Monday, 7 = Sunday

export interface DayFilter {
	day: DayOfWeek;
	name: string;
	shortName: string;
}
