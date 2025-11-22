import { getHeader, getFooter } from './utils.js'
import { fetchData, getRestaurants } from './api.js'
import { Restaurant } from './types.js'
import { loadTheme, toggleTheme } from './theme.js'

interface OrderItem {
  id: number
  title: string
  price: number
  quantity: number
  subtotal: number
}

interface Order {
  id: number
  userId: number
  restaurantId: number
  deliveryDate: string
  deliveryTime: string
  items: OrderItem[]
  subtotal: number
  deliveryFee: number
  totalPrice: number
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled'
  createdAt: string
  updatedAt: string
}

interface OrdersResponse {
  success: boolean
  orders: Order[]
}

class OrdersManager {
  private restaurants: Restaurant[] = []
  private orders: Order[] = []

  constructor() {
    this.init()
  }

  private async init(): Promise<void> {
    try {
      // Check if user is authenticated
      const token = localStorage.getItem('authToken')
      if (!token) {
        alert('Please login to view your orders')
        window.location.href = '/'
        return
      }

      // Load components
      await getHeader()
      await getFooter()

      // Load theme
      loadTheme()

      // Setup theme toggle
      const checkbox = document.getElementById('theme-checkbox')
      if (checkbox) {
        checkbox.addEventListener('change', toggleTheme)
      }

      // Load restaurants and orders
      await Promise.all([this.loadRestaurants(), this.loadOrders()])

      // Setup event listeners
      this.setupEventListeners()
    } catch (error) {
      console.error('Error initializing orders:', error)
    }
  }

  private async loadRestaurants(): Promise<void> {
    try {
      this.restaurants = await getRestaurants()
    } catch (error) {
      console.error('Error loading restaurants:', error)
    }
  }

  private async loadOrders(): Promise<void> {
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
        this.orders = response.orders
        this.renderOrders()
      } else {
        this.showEmptyState('Failed to load orders')
      }
    } catch (error) {
      console.error('Error loading orders:', error)
      this.showEmptyState('Failed to load orders')
    }
  }

  private getRestaurantName(restaurantId: number): string {
    const restaurant = this.restaurants.find((r) => r.id === restaurantId)
    return restaurant ? restaurant.name : 'Unknown Restaurant'
  }

  private getStatusLabel(status: string): string {
    const statusMap: { [key: string]: string } = {
      pending: 'Pending',
      confirmed: 'Confirmed',
      preparing: 'Preparing',
      ready: 'Ready',
      delivered: 'Delivered',
      cancelled: 'Cancelled',
    }
    return statusMap[status] || status
  }

  private getStatusClass(status: string): string {
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

  private formatDate(dateString: string): string {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  private renderOrders(): void {
    const ordersList = document.getElementById('orders-list')
    if (!ordersList) return

    if (this.orders.length === 0) {
      this.showEmptyState('You have no orders yet')
      return
    }

    ordersList.innerHTML = this.orders
      .map((order) => {
        const restaurantName = this.getRestaurantName(order.restaurantId)
        const remainingCount = order.items.length - 2

        return `
				<div class="order-card">
					<div class="order-card-header">
						<div class="order-info">
							<h3 class="order-number">Order #${order.id}</h3>
							<p class="order-date">${this.formatDate(order.createdAt)}</p>
						</div>
						<div class="order-status ${this.getStatusClass(order.status)}">
							${this.getStatusLabel(order.status)}
						</div>
					</div>
					<div class="order-card-body">
						<div class="order-details">
							<div class="order-detail-item">
								<i class="bi bi-shop"></i>
								<span>${restaurantName}</span>
							</div>
							<div class="order-detail-item">
								<i class="bi bi-calendar"></i>
								<span>${this.formatDate(order.deliveryDate)}</span>
							</div>
							<div class="order-detail-item">
								<i class="bi bi-clock"></i>
								<span>${order.deliveryTime}</span>
							</div>
						</div>
						<div class="order-items-preview">
							${order.items
                .map(
                  (item) => `
								<span class="order-item-preview">${item.title} x${item.quantity}</span>
							`
                )
                .join('')}
							${remainingCount > 0 ? `<span class="order-item-more">+${remainingCount} more</span>` : ''}
						</div>
					</div>
					<div class="order-card-footer">
						<div class="order-total">
							<span>Total:</span>
							<span class="order-total-price">${order.totalPrice} €</span>
						</div>
					</div>
				</div>
			`
      })
      .join('')
  }

  private showEmptyState(message: string): void {
    const ordersList = document.getElementById('orders-list')
    if (!ordersList) return

    ordersList.innerHTML = `
			<div class="empty-state">
				<i class="bi bi-inbox"></i>
				<p>${message}</p>
				<a href="/menu" class="button_primary">Browse Menu</a>
			</div>
		`
  }

  private setupEventListeners(): void {
    const backBtn = document.getElementById('back-to-profile')
    backBtn?.addEventListener('click', () => {
      window.location.href = '/profile'
    })
  }
}

// Initialize orders manager
new OrdersManager()
