import { Menu, MenuItem, MenuTag, Restaurant } from './types.js'
import { getHeader, getFooter } from './utils.js'
import { cart } from './cart.js'
import { authManager } from './user.js'
import { getRestaurants } from './api.js'
import { fetchData } from './api.js'

let currentMenu: Menu = []
let editingItem: MenuItem | null = null
let restaurants: Restaurant[] = []

// API functions
async function getAdminMenu(): Promise<Menu> {
  const token = localStorage.getItem('authToken')
  if (!token) {
    throw new Error('No authentication token')
  }

  const response = await fetch('/api/admin/menu', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    throw new Error('Failed to load menu')
  }

  return response.json()
}

async function addMenuItem(item: Omit<MenuItem, 'id'>): Promise<MenuItem> {
  const token = localStorage.getItem('authToken')
  if (!token) {
    throw new Error('No authentication token')
  }

  const response = await fetch('/api/admin/menu', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(item),
  })

  if (!response.ok) {
    throw new Error('Failed to add menu item')
  }

  const result = await response.json()
  return result.item
}

async function updateMenuItem(id: number, item: Partial<MenuItem>): Promise<MenuItem> {
  const token = localStorage.getItem('authToken')
  if (!token) {
    throw new Error('No authentication token')
  }

  const response = await fetch(`/api/admin/menu/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(item),
  })

  if (!response.ok) {
    throw new Error('Failed to update menu item')
  }

  const result = await response.json()
  return result.item
}

async function deleteMenuItem(id: number): Promise<void> {
  const token = localStorage.getItem('authToken')
  if (!token) {
    throw new Error('No authentication token')
  }

  const response = await fetch(`/api/admin/menu/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    throw new Error('Failed to delete menu item')
  }
}

// UI functions
function renderMenuItems(): void {
  const container = document.getElementById('menu-items-list')
  if (!container) return

  container.innerHTML = ''

  currentMenu.forEach((item) => {
    const itemElement = document.createElement('div')
    itemElement.className = 'menu-item-card'
    itemElement.innerHTML = `
      <div class="item-info">
        <h3>${item.title}</h3>
        <p class="item-description">${item.description}</p>
        <div class="item-details">
          <span class="item-type">${item.type}</span>
          <span class="item-price">$${item.price}</span>
        </div>
        <div class="item-days">
          Available: ${item.availableDays.map((day) => getDayName(day)).join(', ')}
        </div>
        <div class="item-tags">
          ${item.tags
            .map((tag) => `<span class="tag tag-${tag[0]}">${tag[1]}</span>`)
            .join('')}
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
    `

    container.appendChild(itemElement)
  })

  // Add event listeners
  document.querySelectorAll('.edit-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const id = parseInt(
        (e.target as HTMLElement).closest('.edit-btn')?.getAttribute('data-id') || '0'
      )
      editMenuItem(id)
    })
  })

  document.querySelectorAll('.delete-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const id = parseInt(
        (e.target as HTMLElement).closest('.delete-btn')?.getAttribute('data-id') || '0'
      )
      deleteMenuItemConfirm(id)
    })
  })
}

function getDayName(day: number): string {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  return days[day - 1] || ''
}

function openModal(title: string): void {
  const modal = document.getElementById('menu-item-modal')
  const modalTitle = document.getElementById('modal-title')

  if (modal && modalTitle) {
    modalTitle.textContent = title
    modal.style.display = 'flex'
  }
}

function closeModal(): void {
  const modal = document.getElementById('menu-item-modal')
  if (modal) {
    modal.style.display = 'none'
    editingItem = null
    clearForm()
  }
}

function clearForm(): void {
  const form = document.getElementById('menu-item-form') as HTMLFormElement
  if (form) {
    form.reset()
    document.getElementById('tags-container')!.innerHTML = ''
  }
}

function populateForm(item: MenuItem): void {
  ;(document.getElementById('item-id') as HTMLInputElement).value = item.id.toString()
  ;(document.getElementById('item-title') as HTMLInputElement).value = item.title
  ;(document.getElementById('item-description') as HTMLTextAreaElement).value =
    item.description
  ;(document.getElementById('item-type') as HTMLSelectElement).value = item.type
  ;(document.getElementById('item-price') as HTMLInputElement).value = item.price.toString()

  // Set available days
  document.querySelectorAll('input[name="availableDays"]').forEach((checkbox) => {
    const input = checkbox as HTMLInputElement
    input.checked = item.availableDays.includes(parseInt(input.value))
  })

  // Set tags
  const tagsContainer = document.getElementById('tags-container')
  if (tagsContainer) {
    tagsContainer.innerHTML = ''
    item.tags.forEach((tag) => {
      addTagToContainer(tag[0], tag[1])
    })
  }
}

function addTagToContainer(color: string, text: string): void {
  const container = document.getElementById('tags-container')
  if (!container) return

  const tagElement = document.createElement('div')
  tagElement.className = `tag tag-${color}`
  tagElement.innerHTML = `
    <span>${text}</span>
    <button type="button" class="remove-tag" onclick="this.parentElement.remove()">
      <i class="bi bi-x"></i>
    </button>
  `
  container.appendChild(tagElement)
}

function editMenuItem(id: number): void {
  const item = currentMenu.find((item) => item.id === id)
  if (!item) return

  editingItem = item
  populateForm(item)
  openModal('Edit Menu Item')
}

function deleteMenuItemConfirm(id: number): void {
  if (confirm('Are you sure you want to delete this menu item?')) {
    deleteMenuItem(id)
      .then(() => {
        loadMenu()
      })
      .catch((error) => {
        alert('Error deleting menu item: ' + error.message)
      })
  }
}

async function loadMenu(): Promise<void> {
  try {
    currentMenu = await getAdminMenu()
    renderMenuItems()
  } catch (error) {
    console.error('Error loading menu:', error)
    alert('Error loading menu: ' + (error as Error).message)
  }
}

// Orders functions
interface AdminOrder {
  id: number
  userId: number
  restaurantId: number
  deliveryDate: string
  deliveryTime: string
  items: Array<{
    id: number
    title: string
    price: number
    quantity: number
    subtotal: number
  }>
  subtotal: number
  totalPrice: number
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled'
  createdAt: string
  updatedAt: string
  userEmail?: string
}

interface OrdersResponse {
  success: boolean
  orders: AdminOrder[]
}

async function loadAdminOrders(): Promise<void> {
  try {
    const token = localStorage.getItem('authToken')
    if (!token) return

    const response = await fetchData<OrdersResponse>('/api/orders', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (response.success) {
      renderOrders(response.orders)
    } else {
      showOrdersError('Failed to load orders')
    }
  } catch (error) {
    console.error('Error loading orders:', error)
    showOrdersError('Failed to load orders')
  }
}

function getRestaurantName(restaurantId: number): string {
  const restaurant = restaurants.find((r) => r.id === restaurantId)
  return restaurant ? restaurant.name : 'Unknown Restaurant'
}

function getStatusClass(status: string): string {
  const classMap: { [key: string]: string } = {
    pending: 'status-pending',
    confirmed: 'status-confirmed',
    preparing: 'status-preparing',
    ready: 'status-ready',
    delivered: 'status-delivered',
    cancelled: 'status-cancelled',
  }
  return classMap[status] || ''
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function formatDateTime(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function renderOrders(orders: AdminOrder[]): void {
  const container = document.getElementById('admin-orders-list')
  if (!container) return

  if (orders.length === 0) {
    container.innerHTML = '<div class="empty-state"><p>No orders found</p></div>'
    return
  }

  container.innerHTML = orders
    .map((order) => {
      const restaurantName = getRestaurantName(order.restaurantId)
      const firstItems = order.items.slice(0, 3)
      const remainingCount = order.items.length - 3

      return `
			<div class="admin-order-card">
				<div class="admin-order-header">
					<div class="admin-order-info">
						<h3>Order #${order.id}</h3>
						<p class="order-user">User: ${order.userEmail || 'Unknown'}</p>
						<p class="order-date">${formatDateTime(order.createdAt)}</p>
					</div>
					<div class="admin-order-status">
						<select class="status-select ${getStatusClass(order.status)}" data-order-id="${order.id}">
							<option value="pending" ${order.status === 'pending' ? 'selected' : ''}>Pending</option>
							<option value="confirmed" ${order.status === 'confirmed' ? 'selected' : ''}>Confirmed</option>
							<option value="preparing" ${order.status === 'preparing' ? 'selected' : ''}>Preparing</option>
							<option value="ready" ${order.status === 'ready' ? 'selected' : ''}>Ready</option>
							<option value="delivered" ${order.status === 'delivered' ? 'selected' : ''}>Delivered</option>
							<option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
						</select>
					</div>
				</div>
				<div class="admin-order-body">
					<div class="admin-order-details">
						<div class="order-detail-item">
							<i class="bi bi-shop"></i>
							<span>${restaurantName}</span>
						</div>
						<div class="order-detail-item">
							<i class="bi bi-calendar"></i>
							<span>${formatDate(order.deliveryDate)}</span>
						</div>
						<div class="order-detail-item">
							<i class="bi bi-clock"></i>
							<span>${order.deliveryTime}</span>
						</div>
					</div>
					<div class="admin-order-items">
						${firstItems
              .map(
                (item) => `
							<span class="order-item-badge">${item.title} x${item.quantity}</span>
						`
              )
              .join('')}
						${remainingCount > 0 ? `<span class="order-item-more">+${remainingCount} more</span>` : ''}
					</div>
					<div class="admin-order-footer">
						<div class="order-total">
							<span>Total:</span>
							<span class="order-total-price">${order.totalPrice} €</span>
						</div>
						<button class="button_danger delete-order-btn" data-order-id="${order.id}">
							<i class="bi bi-trash"></i>
							Delete
						</button>
					</div>
				</div>
			</div>
		`
    })
    .join('')

  // Add event listeners for status changes
  container.querySelectorAll('.status-select').forEach((select) => {
    select.addEventListener('change', async (e) => {
      const orderId = parseInt(
        (e.target as HTMLSelectElement).getAttribute('data-order-id') || '0'
      )
      const newStatus = (e.target as HTMLSelectElement).value
      await updateOrderStatus(orderId, newStatus)
    })
  })

  // Add event listeners for delete buttons
  container.querySelectorAll('.delete-order-btn').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      const orderId = parseInt(
        (e.target as HTMLElement)
          .closest('.delete-order-btn')
          ?.getAttribute('data-order-id') || '0'
      )
      if (confirm('Are you sure you want to delete this order?')) {
        await deleteOrder(orderId)
      }
    })
  })
}

function showOrdersError(message: string): void {
  const container = document.getElementById('admin-orders-list')
  if (!container) return
  container.innerHTML = `<div class="empty-state"><p>${message}</p></div>`
}

async function updateOrderStatus(orderId: number, status: string): Promise<void> {
  try {
    const token = localStorage.getItem('authToken')
    if (!token) return

    const response = await fetchData<{ success: boolean; message: string }>(
      `/api/admin/orders/${orderId}/status`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      }
    )

    if (response.success) {
      await loadAdminOrders()
    } else {
      alert('Failed to update order status: ' + response.message)
    }
  } catch (error) {
    console.error('Error updating order status:', error)
    alert('Failed to update order status')
  }
}

async function deleteOrder(orderId: number): Promise<void> {
  try {
    const token = localStorage.getItem('authToken')
    if (!token) return

    const response = await fetchData<{ success: boolean; message: string }>(
      `/api/admin/orders/${orderId}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    )

    if (response.success) {
      await loadAdminOrders()
    } else {
      alert('Failed to delete order: ' + response.message)
    }
  } catch (error) {
    console.error('Error deleting order:', error)
    alert('Failed to delete order')
  }
}

function switchTab(tab: 'menu' | 'orders'): void {
  // Update tab buttons
  document.querySelectorAll('.admin-tab').forEach((btn) => {
    if (btn.getAttribute('data-tab') === tab) {
      btn.classList.add('active')
    } else {
      btn.classList.remove('active')
    }
  })

  // Update tab content
  document.querySelectorAll('.tab-content').forEach((content) => {
    if (content.id === `${tab}-tab`) {
      content.classList.add('active')
    } else {
      content.classList.remove('active')
    }
  })

  // Load data for active tab
  if (tab === 'orders') {
    loadAdminOrders()
  }
}

// Event listeners
function initializeEventListeners(): void {
  // Tab switching
  document.querySelectorAll('.admin-tab').forEach((btn) => {
    btn.addEventListener('click', () => {
      const tab = btn.getAttribute('data-tab') as 'menu' | 'orders'
      switchTab(tab)
    })
  })

  // Add menu item button
  document.getElementById('add-menu-item')?.addEventListener('click', () => {
    editingItem = null
    clearForm()
    openModal('Add Menu Item')
  })

  // Modal close buttons
  document.getElementById('modal-close')?.addEventListener('click', closeModal)
  document.getElementById('cancel-btn')?.addEventListener('click', closeModal)

  // Form submission
  document.getElementById('menu-item-form')?.addEventListener('submit', async (e) => {
    e.preventDefault()

    const formData = new FormData(e.target as HTMLFormElement)
    const availableDays = Array.from(
      document.querySelectorAll('input[name="availableDays"]:checked')
    ).map((checkbox) => parseInt((checkbox as HTMLInputElement).value))

    const tags: MenuTag[] = []
    document.querySelectorAll('#tags-container .tag').forEach((tagElement) => {
      const text = tagElement.querySelector('span')?.textContent || ''
      const color = tagElement.classList.contains('tag-g') ? 'g' : 'b'
      tags.push([color, text])
    })

    const itemData = {
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      type: formData.get('type') as 'Rolls' | 'Sushi' | 'Hot Dishes',
      price: parseFloat(formData.get('price') as string),
      availableDays,
      tags,
    }

    try {
      if (editingItem) {
        await updateMenuItem(editingItem.id, itemData)
      } else {
        await addMenuItem(itemData)
      }

      closeModal()
      loadMenu()
    } catch (error) {
      alert('Error saving menu item: ' + (error as Error).message)
    }
  })

  // Add tag button
  document.getElementById('add-tag-btn')?.addEventListener('click', () => {
    const colorSelect = document.getElementById('tag-color') as HTMLSelectElement
    const textInput = document.getElementById('tag-text') as HTMLInputElement

    if (textInput.value.trim()) {
      addTagToContainer(colorSelect.value, textInput.value.trim())
      textInput.value = ''
    }
  })

  // Logout button
  document.getElementById('logout-btn')?.addEventListener('click', () => {
    localStorage.removeItem('authToken')
    window.location.href = '/'
  })
}

// Initialize admin panel
async function initializeAdmin(): Promise<void> {
  try {
    // Check authentication
    const token = localStorage.getItem('authToken')
    if (!token) {
      window.location.href = '/'
      return
    }

    await getHeader()
    authManager.initializeUserButtonListener()

    cart.initializeEventListeners()
    await getFooter()

    // Load restaurants for orders
    restaurants = await getRestaurants()

    await loadMenu()
    initializeEventListeners()

    // Set default tab
    switchTab('menu')
  } catch (error) {
    console.error('Error initializing admin:', error)
    alert('Error initializing admin panel: ' + (error as Error).message)
    window.location.href = '/'
  }
}

// Start the admin panel
initializeAdmin()
