import { getHeader, getFooter } from './utils.js';
import { getMenu } from './api.js';
import { generateMenu, initializeFilterButtons, initializeDayButtons, setMenu, initializeMap } from './menu.js';
import { cart } from './cart.js';
import { loadTheme, toggleTheme } from './theme.js';
import { authManager } from './user.js';

async function main(): Promise<void> {
	try {
		await getHeader();

		// Initialize user button listener after header is loaded
		authManager.initializeUserButtonListener();

		cart.initializeEventListeners();

		await getFooter();

		const restaurantMenu = await getMenu();
		setMenu(restaurantMenu);
		generateMenu(restaurantMenu, null);
		initializeFilterButtons();
		initializeDayButtons();

		// Initialize map for restaurants
		await initializeMap();
		// console.log(cart.items);

		loadTheme();

		const checkbox = document.getElementById('theme-checkbox');
		if (checkbox) {
			checkbox.addEventListener('change', toggleTheme);
		}
	} catch (error) {
		console.error('Error in main function:', error);
	}
}

main();
