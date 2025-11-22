import { getHeader, getFooter } from './utils.js'
import { cart } from './cart.js'
import { getRestaurants } from './api.js'
import { Restaurant } from './types.js'
import { fetchData } from './api.js'
import { loadTheme, toggleTheme } from './theme.js'

interface OrderItem {
  id: number
  title: string
  price: number
  quantity: number
}

interface CreateOrderRequest {
  restaurantId: number
  deliveryDate: string
  deliveryTime: string
  items: OrderItem[]
}

interface CreateOrderResponse {
  success: boolean
  message: string
  orderId?: number
}

class CheckoutManager {
  private restaurants: Restaurant[] = []

  constructor() {
    this.init()
  }

  private async init(): Promise<void> {
    try {
      // Check if user is authenticated
      const token = localStorage.getItem('authToken')
      if (!token) {
        alert('Please login to place an order')
        window.location.href = '/'
        return
      }

      // Check if cart is empty
      if (cart.items.length === 0) {
        alert('Your cart is empty!')
        window.location.href = '/menu'
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

      // Load restaurants
      await this.loadRestaurants()

      // Initialize checkout
      this.initializeCheckout()
      this.setupEventListeners()
      this.populateTimeSlots()
      this.setupYearOptions()
    } catch (error) {
      console.error('Error initializing checkout:', error)
    }
  }

  private async loadRestaurants(): Promise<void> {
    try {
      this.restaurants = await getRestaurants()
      this.populateRestaurantSelect()
    } catch (error) {
      console.error('Error loading restaurants:', error)
    }
  }

  private populateRestaurantSelect(): void {
    const select = document.getElementById('restaurant-select') as HTMLSelectElement
    if (!select) return

    select.innerHTML = '<option value="">Choose pickup location</option>'
    this.restaurants.forEach((restaurant) => {
      const option = document.createElement('option')
      option.value = restaurant.id.toString()
      option.textContent = restaurant.name
      select.appendChild(option)
    })
  }

  private setupYearOptions(): void {
    const yearSelect = document.getElementById('card-year') as HTMLSelectElement
    if (!yearSelect) return

    const currentYear = new Date().getFullYear()
    for (let i = 0; i < 10; i++) {
      const year = currentYear + i
      const option = document.createElement('option')
      option.value = year.toString()
      option.textContent = year.toString()
      yearSelect.appendChild(option)
    }
  }

  private populateTimeSlots(): void {
    const timeSelect = document.getElementById('delivery-time') as HTMLSelectElement
    if (!timeSelect) return

    timeSelect.innerHTML = '<option value="">Select time slot</option>'

    // Generate time slots from 10:00 to 22:00 every 30 minutes
    for (let hour = 10; hour < 22; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute
          .toString()
          .padStart(2, '0')}`
        const option = document.createElement('option')
        option.value = timeString
        option.textContent = timeString
        timeSelect.appendChild(option)
      }
    }
  }

  private initializeCheckout(): void {
    this.updateOrderSummary()
    this.updateTotals()
  }

  private updateOrderSummary(): void {
    const orderItemsContainer = document.getElementById('order-items')
    if (!orderItemsContainer) return

    if (cart.items.length === 0) {
      orderItemsContainer.innerHTML = '<p>Your cart is empty</p>'
      return
    }

    orderItemsContainer.innerHTML = cart.items
      .map(
        (item) => `
			<div class="order-item">
				<div class="order-item-info">
					<span class="order-item-name">${item.title}</span>
					<span class="order-item-price">${item.price} €</span>
				</div>
				<div class="order-item-quantity">
					<span class="order-item-qty">x ${item.quantity}</span>
					<span class="order-item-subtotal">${item.price * item.quantity} €</span>
				</div>
			</div>
		`
      )
      .join('')
  }

  private updateTotals(): void {
    const total = cart.getTotalPrice()

    const subtotalEl = document.getElementById('order-subtotal')
    const totalEl = document.getElementById('order-total')
    const placeOrderTotalEl = document.getElementById('place-order-total')

    if (subtotalEl) subtotalEl.textContent = `${total} €`
    if (totalEl) totalEl.textContent = `${total} €`
    if (placeOrderTotalEl) placeOrderTotalEl.textContent = `${total} €`
  }

  private setupEventListeners(): void {
    // Cancel button
    const cancelBtn = document.getElementById('cancel-checkout')
    cancelBtn?.addEventListener('click', () => {
      window.location.href = '/menu'
    })

    // Place order button
    const placeOrderBtn = document.getElementById('place-order')
    placeOrderBtn?.addEventListener('click', () => this.handlePlaceOrder())

    // Set minimum date to today
    const dateInput = document.getElementById('delivery-date') as HTMLInputElement
    if (dateInput) {
      const today = new Date().toISOString().split('T')[0]
      dateInput.min = today
    }
  }

  private async handlePlaceOrder(): Promise<void> {
    try {
      // Validate form
      const restaurantSelect = document.getElementById(
        'restaurant-select'
      ) as HTMLSelectElement
      const deliveryDate = document.getElementById('delivery-date') as HTMLInputElement
      const deliveryTime = document.getElementById('delivery-time') as HTMLSelectElement

      if (!restaurantSelect?.value) {
        alert('Please select a restaurant')
        return
      }

      if (!deliveryDate?.value) {
        alert('Please select a delivery date')
        return
      }

      if (!deliveryTime?.value) {
        alert('Please select a delivery time')
        return
      }

      // Prepare order data
      const orderData: CreateOrderRequest = {
        restaurantId: parseInt(restaurantSelect.value),
        deliveryDate: deliveryDate.value,
        deliveryTime: deliveryTime.value,
        items: cart.items.map((item) => ({
          id: item.id,
          title: item.title,
          price: item.price,
          quantity: item.quantity,
        })),
      }

      // Get auth token
      const token = localStorage.getItem('authToken')
      if (!token) {
        alert('Please login to place an order')
        window.location.href = '/'
        return
      }

      // Create order
      const response = await fetchData<CreateOrderResponse>('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(orderData),
      })

      if (response.success) {
        // Clear cart
        cart.clear()

        // Show success message
        alert('Order placed successfully!')

        // Redirect to orders page
        window.location.href = '/orders'
      } else {
        alert(response.message || 'Failed to place order')
      }
    } catch (error) {
      console.error('Error placing order:', error)
      alert('Failed to place order. Please try again.')
    }
  }
}

// Initialize checkout manager
new CheckoutManager()
