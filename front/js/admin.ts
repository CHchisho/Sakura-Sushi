import { Menu, MenuItem, MenuTag } from './types.js';
import { getHeader, getFooter } from './utils.js';
import { cart } from './cart.js';
import { authManager } from './user.js';

let currentMenu: Menu = [];
let editingItem: MenuItem | null = null;

// API functions
async function getAdminMenu(): Promise<Menu> {
	const token = localStorage.getItem('authToken');
	if (!token) {
		throw new Error('No authentication token');
	}

	const response = await fetch('/api/admin/menu', {
		headers: {
			'Authorization': `Bearer ${token}`
		}
	});

	if (!response.ok) {
		throw new Error('Failed to load menu');
	}

	return response.json();
}

async function addMenuItem(item: Omit<MenuItem, 'id'>): Promise<MenuItem> {
	const token = localStorage.getItem('authToken');
	if (!token) {
		throw new Error('No authentication token');
	}

	const response = await fetch('/api/admin/menu', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'Authorization': `Bearer ${token}`
		},
		body: JSON.stringify(item)
	});

	if (!response.ok) {
		throw new Error('Failed to add menu item');
	}

	const result = await response.json();
	return result.item;
}

async function updateMenuItem(id: number, item: Partial<MenuItem>): Promise<MenuItem> {
	const token = localStorage.getItem('authToken');
	if (!token) {
		throw new Error('No authentication token');
	}

	const response = await fetch(`/api/admin/menu/${id}`, {
		method: 'PUT',
		headers: {
			'Content-Type': 'application/json',
			'Authorization': `Bearer ${token}`
		},
		body: JSON.stringify(item)
	});

	if (!response.ok) {
		throw new Error('Failed to update menu item');
	}

	const result = await response.json();
	return result.item;
}

async function deleteMenuItem(id: number): Promise<void> {
	const token = localStorage.getItem('authToken');
	if (!token) {
		throw new Error('No authentication token');
	}

	const response = await fetch(`/api/admin/menu/${id}`, {
		method: 'DELETE',
		headers: {
			'Authorization': `Bearer ${token}`
		}
	});

	if (!response.ok) {
		throw new Error('Failed to delete menu item');
	}
}

// UI functions
function renderMenuItems(): void {
	const container = document.getElementById('menu-items-list');
	if (!container) return;

	container.innerHTML = '';

	currentMenu.forEach(item => {
		const itemElement = document.createElement('div');
		itemElement.className = 'menu-item-card';
		itemElement.innerHTML = `
      <div class="item-info">
        <h3>${item.title}</h3>
        <p class="item-description">${item.description}</p>
        <div class="item-details">
          <span class="item-type">${item.type}</span>
          <span class="item-price">$${item.price}</span>
        </div>
        <div class="item-days">
          Available: ${item.availableDays.map(day => getDayName(day)).join(', ')}
        </div>
        <div class="item-tags">
          ${item.tags.map(tag => `<span class="tag tag-${tag[0]}">${tag[1]}</span>`).join('')}
        </div>
      </div>
      <div class="item-actions">
        <button class="button_secondary edit-btn" data-id="${item.id}">
          <i class="bi bi-pencil"></i>
          Edit
        </button>
        <button class="button_danger delete-btn" data-id="${item.id}">
          <i class="bi bi-trash"></i>
          Delete
        </button>
      </div>
    `;

		container.appendChild(itemElement);
	});

	// Add event listeners
	document.querySelectorAll('.edit-btn').forEach(btn => {
		btn.addEventListener('click', (e) => {
			const id = parseInt((e.target as HTMLElement).closest('.edit-btn')?.getAttribute('data-id') || '0');
			editMenuItem(id);
		});
	});

	document.querySelectorAll('.delete-btn').forEach(btn => {
		btn.addEventListener('click', (e) => {
			const id = parseInt((e.target as HTMLElement).closest('.delete-btn')?.getAttribute('data-id') || '0');
			deleteMenuItemConfirm(id);
		});
	});
}

function getDayName(day: number): string {
	const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
	return days[day - 1] || '';
}

function openModal(title: string): void {
	const modal = document.getElementById('menu-item-modal');
	const modalTitle = document.getElementById('modal-title');

	if (modal && modalTitle) {
		modalTitle.textContent = title;
		modal.style.display = 'flex';
	}
}

function closeModal(): void {
	const modal = document.getElementById('menu-item-modal');
	if (modal) {
		modal.style.display = 'none';
		editingItem = null;
		clearForm();
	}
}

function clearForm(): void {
	const form = document.getElementById('menu-item-form') as HTMLFormElement;
	if (form) {
		form.reset();
		document.getElementById('tags-container')!.innerHTML = '';
	}
}

function populateForm(item: MenuItem): void {
	(document.getElementById('item-id') as HTMLInputElement).value = item.id.toString();
	(document.getElementById('item-title') as HTMLInputElement).value = item.title;
	(document.getElementById('item-description') as HTMLTextAreaElement).value = item.description;
	(document.getElementById('item-type') as HTMLSelectElement).value = item.type;
	(document.getElementById('item-price') as HTMLInputElement).value = item.price.toString();

	// Set available days
	document.querySelectorAll('input[name="availableDays"]').forEach((checkbox) => {
		const input = checkbox as HTMLInputElement;
		input.checked = item.availableDays.includes(parseInt(input.value));
	});

	// Set tags
	const tagsContainer = document.getElementById('tags-container');
	if (tagsContainer) {
		tagsContainer.innerHTML = '';
		item.tags.forEach(tag => {
			addTagToContainer(tag[0], tag[1]);
		});
	}
}

function addTagToContainer(color: string, text: string): void {
	const container = document.getElementById('tags-container');
	if (!container) return;

	const tagElement = document.createElement('div');
	tagElement.className = `tag tag-${color}`;
	tagElement.innerHTML = `
    <span>${text}</span>
    <button type="button" class="remove-tag" onclick="this.parentElement.remove()">
      <i class="bi bi-x"></i>
    </button>
  `;
	container.appendChild(tagElement);
}

function editMenuItem(id: number): void {
	const item = currentMenu.find(item => item.id === id);
	if (!item) return;

	editingItem = item;
	populateForm(item);
	openModal('Edit Menu Item');
}

function deleteMenuItemConfirm(id: number): void {
	if (confirm('Are you sure you want to delete this menu item?')) {
		deleteMenuItem(id).then(() => {
			loadMenu();
		}).catch(error => {
			alert('Error deleting menu item: ' + error.message);
		});
	}
}

async function loadMenu(): Promise<void> {
	try {
		currentMenu = await getAdminMenu();
		renderMenuItems();
	} catch (error) {
		console.error('Error loading menu:', error);
		alert('Error loading menu: ' + (error as Error).message);
	}
}

// Event listeners
function initializeEventListeners(): void {
	// Add menu item button
	document.getElementById('add-menu-item')?.addEventListener('click', () => {
		editingItem = null;
		clearForm();
		openModal('Add Menu Item');
	});

	// Modal close buttons
	document.getElementById('modal-close')?.addEventListener('click', closeModal);
	document.getElementById('cancel-btn')?.addEventListener('click', closeModal);

	// Form submission
	document.getElementById('menu-item-form')?.addEventListener('submit', async (e) => {
		e.preventDefault();

		const formData = new FormData(e.target as HTMLFormElement);
		const availableDays = Array.from(document.querySelectorAll('input[name="availableDays"]:checked'))
			.map((checkbox) => parseInt((checkbox as HTMLInputElement).value));

		const tags: MenuTag[] = [];
		document.querySelectorAll('#tags-container .tag').forEach(tagElement => {
			const text = tagElement.querySelector('span')?.textContent || '';
			const color = tagElement.classList.contains('tag-g') ? 'g' : 'b';
			tags.push([color, text]);
		});

		const itemData = {
			title: formData.get('title') as string,
			description: formData.get('description') as string,
			type: formData.get('type') as 'Rolls' | 'Sushi' | 'Hot Dishes',
			price: parseFloat(formData.get('price') as string),
			availableDays,
			tags
		};

		try {
			if (editingItem) {
				await updateMenuItem(editingItem.id, itemData);
			} else {
				await addMenuItem(itemData);
			}

			closeModal();
			loadMenu();
		} catch (error) {
			alert('Error saving menu item: ' + (error as Error).message);
		}
	});

	// Add tag button
	document.getElementById('add-tag-btn')?.addEventListener('click', () => {
		const colorSelect = document.getElementById('tag-color') as HTMLSelectElement;
		const textInput = document.getElementById('tag-text') as HTMLInputElement;

		if (textInput.value.trim()) {
			addTagToContainer(colorSelect.value, textInput.value.trim());
			textInput.value = '';
		}
	});

	// Logout button
	document.getElementById('logout-btn')?.addEventListener('click', () => {
		localStorage.removeItem('authToken');
		window.location.href = '/';
	});
}

// Initialize admin panel
async function initializeAdmin(): Promise<void> {
	try {
		// Check authentication
		const token = localStorage.getItem('authToken');
		if (!token) {
			window.location.href = '/';
			return;
		}

		await getHeader();
		authManager.initializeUserButtonListener();

		cart.initializeEventListeners();
		await getFooter();
		await loadMenu();
		initializeEventListeners();
	} catch (error) {
		console.error('Error initializing admin:', error);
		alert('Error initializing admin panel: ' + (error as Error).message);
		window.location.href = '/';
	}
}

// Start the admin panel
initializeAdmin();
