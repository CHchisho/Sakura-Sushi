import { getHeader, getFooter } from './utils.js';
import { getMenu } from './api.js';
import { generateMenu, initializeFilterButtons, setMenu } from './menu.js';


async function main() {
  getHeader();
  getFooter();

  const restaurantMenu = await getMenu();
  setMenu(restaurantMenu);
  generateMenu(restaurantMenu);
  initializeFilterButtons();
}

main();
