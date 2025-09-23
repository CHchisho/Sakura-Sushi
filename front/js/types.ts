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
}

export type Menu = MenuItem[];

export type FilterType = MenuItemType | 'All';
