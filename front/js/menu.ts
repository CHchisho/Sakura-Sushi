import { Menu, MenuItem, FilterType, DayOfWeek } from './types.js';
import { cart } from './cart.js';

let selectedType: FilterType = 'All';
let selectedDays: DayOfWeek[] = [1, 2, 3, 4, 5, 6, 7]; // By default all days are selected
let currentMenu: Menu = [];

const DAYS_NAMES = {
	1: 'Mon',
	2: 'Tue',
	3: 'Wed',
	4: 'Thu',
	5: 'Fri',
	6: 'Sat',
	7: 'Sun'
};

export const setMenu = (menu: Menu): void => {
	currentMenu = menu;
};

export const setSelectedType = (type: FilterType): void => {
	selectedType = type;
	const menu_type = document.getElementById('menu_type');
	if (menu_type) {
		menu_type.textContent = type;
	}
	generateMenu(currentMenu, selectedType, selectedDays);
};

export const setSelectedDays = (days: DayOfWeek[]): void => {
	selectedDays = days;
	generateMenu(currentMenu, selectedType, selectedDays);
};


export const initializeFilterButtons = (): void => {
	const menu_filters_buttons = document.querySelectorAll<HTMLButtonElement>('.menu_filters_button');
	menu_filters_buttons.forEach(button => {
		button.addEventListener('click', () => {
			setSelectedType(button.value as FilterType);
		});
	});
};

export const initializeDayButtons = (): void => {
	const menu_day_buttons = document.querySelectorAll<HTMLButtonElement>('.menu_day_button');
	menu_day_buttons.forEach(button => {
		button.addEventListener('click', () => {
			const day = parseInt(button.getAttribute('data-day') || '1') as DayOfWeek;

			button.classList.toggle('active');

			// Update selected days list
			if (button.classList.contains('active')) {
				if (!selectedDays.includes(day)) {
					selectedDays.push(day);
				}
			} else {
				selectedDays = selectedDays.filter(d => d !== day);
			}

			// If no day is selected, select all
			if (selectedDays.length === 0) {
				selectedDays = [1, 2, 3, 4, 5, 6, 7];
				menu_day_buttons.forEach(btn => btn.classList.add('active'));
			}

			setSelectedDays(selectedDays);
		});
	});
};


export const generateMenuItem = (item: MenuItem): string => {
	let html = `
    <div class="menu_item">
        <div class="top">
            <div class="top_info">
                <h4>${item.title}</h4>
                <p>${item.description}</p>
				<p>Available days: ${item.availableDays.map(day => DAYS_NAMES[day as keyof typeof DAYS_NAMES]).join(', ')}</p>
            </div>
            <p class="menu_price">${item.price}$</p>

        </div>
        <div class="bottom">`

	for (const tag of item.tags) {
		if (tag[0] === 'g') {
			html += `<div class="tag tag_green"><p>${tag[1]}</p></div>`
		} else if (tag[0] === 'b') {
			html += `<div class="tag tag_blue"><p>${tag[1]}</p></div>`
		}
	}

	html += `<button class="button_add" data-item-id="${item.id}"><i class="bi bi-plus-lg"></i></button>
        </div>
    </div>
    `;

	return html;
};


export const generateMenu = (menu: Menu, filterType: FilterType | null = null, days: DayOfWeek[] | null = null): void => {
	const menu_items = document.getElementById('menu_items');
	if (!menu_items) return;

	menu_items.innerHTML = '';
	for (const item of menu) {
		// Filter by type
		if (filterType && filterType !== 'All' && item.type !== filterType) {
			continue;
		}

		// Filter by days of the week
		if (days && days.length > 0) {
			const isAvailableOnSelectedDays = days.some(day => item.availableDays.includes(day));
			if (!isAvailableOnSelectedDays) {
				continue;
			}
		}

		menu_items.innerHTML += generateMenuItem(item);
	}

	// Change title
	const menu_type = document.getElementById('menu_type');
	if (menu_type) {
		menu_type.textContent = filterType || 'All';
	}

	// Change active button
	const menu_filters_buttons = document.querySelectorAll<HTMLButtonElement>('.menu_filters_button');
	menu_filters_buttons.forEach(button => {
		button.classList.remove('active');
	});
	const active_button = document.querySelector<HTMLButtonElement>(`.menu_filters_button[value="${filterType || 'All'}"]`);
	if (active_button) {
		active_button.classList.add('active');
	}

	// Add event listeners to add buttons
	const addButtons = document.querySelectorAll<HTMLButtonElement>('.button_add');
	addButtons.forEach(button => {
		button.addEventListener('click', () => {
			const itemId = parseInt(button.getAttribute('data-item-id') || '0');
			const menuItem = currentMenu.find(item => item.id === itemId);
			if (menuItem) {
				cart.addItem(menuItem);
			}
		});
	});
};
