import { Menu, MenuItem, FilterType, DayOfWeek, Restaurant, BusStop } from './types.js';
import { cart } from './cart.js';
import { getRestaurants, getBusStops } from './api.js';

// Declare global L for Leaflet
declare const L: any;

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

// Map functionality
let map: L.Map | null = null;

// Функция для вычисления расстояния между двумя точками на плоскости (приближённо, в километрах)
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
	// Приблизительное значение длины одного градуса широты и долготы в километрах
	const latDegreeKm = 111.32;
	const lonDegreeKm = 40075 * Math.cos(((lat1 + lat2) / 2) * Math.PI / 180) / 360;

	const dLat = lat2 - lat1;
	const dLon = lon2 - lon1;

	const dx = dLon * lonDegreeKm;
	const dy = dLat * latDegreeKm;

	return Math.sqrt(dx * dx + dy * dy);
};

// Function to find nearest bus stops for a restaurant
const findNearestBusStops = (restaurant: Restaurant, busStops: BusStop[], limit: number = 5): BusStop[] => {
	const stopsWithDistance = busStops.map(stop => ({
		stop,
		distance: calculateDistance(
			restaurant.coordinates.lat,
			restaurant.coordinates.lng,
			stop.geometry.y, // lat
			stop.geometry.x  // lng
		)
	}));

	// Sort by distance and take the nearest ones
	return stopsWithDistance
		.sort((a, b) => a.distance - b.distance)
		.slice(0, limit)
		.map(item => item.stop);
};

export const initializeMap = async (): Promise<void> => {
	const mapContainer = document.getElementById('restaurants_map');
	if (!mapContainer) return;

	// Initialize map centered on Helsinki
	map = L.map('restaurants_map').setView([60.1699, 24.9384], 10);

	// Add OpenStreetMap tiles
	L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
		attribution: '© OpenStreetMap contributors'
	}).addTo(map);

	// Load and display restaurants and bus stops
	try {
		const [restaurants, busStopsData] = await Promise.all([
			getRestaurants(),
			getBusStops()
		]);

		console.log(busStopsData);
		displayRestaurantsOnMap(restaurants, busStopsData.features);
	} catch (error) {
		console.error('Error loading map data:', error);
	}
};

const displayRestaurantsOnMap = (restaurants: Restaurant[], busStops: BusStop[]): void => {
	if (!map) return;

	// Create custom icons
	const restaurantIcon = L.divIcon({
		className: 'restaurant-marker',
		html: '<div style="background-color: #ec4899; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>',
		iconSize: [20, 20],
		iconAnchor: [10, 10]
	});

	const busStopIcon = L.divIcon({
		className: 'busstop-marker',
		html: '<div style="background-color: #3b82f6; width: 16px; height: 16px; border-radius: 3px; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>',
		iconSize: [16, 16],
		iconAnchor: [8, 8]
	});

	// Display restaurants and their nearest bus stops
	restaurants.forEach(restaurant => {
		// Add restaurant marker
		const restaurantMarker = L.marker([restaurant.coordinates.lat, restaurant.coordinates.lng], {
			icon: restaurantIcon
		}).addTo(map!);

		// Create popup content for restaurant
		const popupContent = `
			<div class="restaurant-popup">
				<h3>${restaurant.name}</h3>
				<p><strong>Address:</strong> ${restaurant.address}</p>
				<p><strong>Working hours:</strong> ${restaurant.workingHours}</p>
			</div>
		`;

		restaurantMarker.bindPopup(popupContent);

		// Find and display nearest bus stops
		const nearestStops = findNearestBusStops(restaurant, busStops, 5);
		console.log(restaurant, nearestStops);
		nearestStops.forEach(stop => {
			const busStopMarker = L.marker([stop.geometry.y, stop.geometry.x], {
				icon: busStopIcon
			}).addTo(map!);

			// Create popup content for bus stop
			const stopPopupContent = `
				<div class="busstop-popup">
					<h4>Bus stop: ${stop.attributes.NIMI1}</h4>
					<p><strong>Stop ID:</strong> ${stop.attributes.LYHYTTUNNU}</p>
					<p><strong>Address:</strong> ${stop.attributes.NIMI2}</p>
				</div>
			`;

			busStopMarker.bindPopup(stopPopupContent);
		});
	});
};
