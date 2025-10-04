import { getHeader, getFooter } from './utils.js';
import { getMenu } from './api.js';
import { generateMenu, initializeFilterButtons, setMenu } from './menu.js';
import { cart } from './cart.js';
import { loadTheme, toggleTheme } from './theme.js';
import './user.js';

async function main(): Promise<void> {
	try {
		await getHeader();

		cart.initializeEventListeners();

		await getFooter();

		const restaurantMenu = await getMenu();
		setMenu(restaurantMenu);
		generateMenu(restaurantMenu, null);
		initializeFilterButtons();
		console.log(cart.items);
		
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
