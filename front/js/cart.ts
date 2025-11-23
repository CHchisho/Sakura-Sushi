import { MenuItem } from './types.js'
import { showNotification } from './utils.js'

export interface CartItem {
  id: number
  title: string
  price: number
  quantity: number
}

export class Cart {
  public items: CartItem[] = []
  private readonly STORAGE_KEY = 'sakura-sushi-cart'

  constructor() {
    this.loadFromStorage()
    this.updateCartDisplay()
  }

  public initializeEventListeners(): void {
    // Cart button click
    const cartButton = document.getElementById('cart-button')
    if (cartButton) {
      console.log('initializeEventListeners cartButton')
      cartButton.addEventListener('click', () => this.toggleCart())
    }

    // Cart close button
    const cartClose = document.getElementById('cart-close')
    if (cartClose) {
      cartClose.addEventListener('click', () => this.closeCart())
    }

    // Cart overlay click
    const cartOverlay = document.getElementById('cart-overlay')
    if (cartOverlay) {
      cartOverlay.addEventListener('click', () => this.closeCart())
    }

    // Checkout button
    const checkoutButton = document.getElementById('cart-checkout')
    if (checkoutButton) {
      checkoutButton.addEventListener('click', () => this.proceedToCheckout())
    }
    this.updateCartDisplay()
  }

  public addItem(menuItem: MenuItem): void {
    const existingItem = this.items.find((item) => item.id === menuItem.id)

    if (existingItem) {
      existingItem.quantity += 1
      showNotification(`🍣 ${menuItem.title} added to cart (${existingItem.quantity} items)`)
    } else {
      this.items.push({
        id: menuItem.id,
        title: menuItem.title,
        price: menuItem.price,
        quantity: 1,
      })
      showNotification(`🍣 ${menuItem.title} added to cart`)
    }

    this.saveToStorage()
    this.updateCartDisplay()
  }

  public removeItem(itemId: number): void {
    this.items = this.items.filter((item) => item.id !== itemId)
    this.saveToStorage()
    this.updateCartDisplay()
  }

  public updateQuantity(itemId: number, newQuantity: number): void {
    const item = this.items.find((item) => item.id === itemId)
    if (item) {
      if (newQuantity <= 0) {
        this.removeItem(itemId)
      } else {
        item.quantity = newQuantity
        this.saveToStorage()
        this.updateCartDisplay()
      }
    }
  }

  public getTotalItems(): number {
    return this.items.reduce((total, item) => total + item.quantity, 0)
  }

  public getTotalPrice(): number {
    return this.items.reduce((total, item) => total + item.price * item.quantity, 0)
  }

  public clear(): void {
    this.items = []
    this.saveToStorage()
    this.updateCartDisplay()
  }

  public toggleCart(): void {
    const cartSidebar = document.getElementById('cart-sidebar')
    const cartOverlay = document.getElementById('cart-overlay')

    if (cartSidebar && cartOverlay) {
      const isActive = cartSidebar.classList.contains('active')

      if (isActive) {
        this.closeCart()
      } else {
        this.openCart()
      }
    }
  }

  public openCart(): void {
    const cartSidebar = document.getElementById('cart-sidebar')
    const cartOverlay = document.getElementById('cart-overlay')

    if (cartSidebar && cartOverlay) {
      cartSidebar.classList.add('active')
      cartOverlay.classList.add('active')
      document.body.style.overflow = 'hidden'
    }
  }

  public closeCart(): void {
    const cartSidebar = document.getElementById('cart-sidebar')
    const cartOverlay = document.getElementById('cart-overlay')

    if (cartSidebar && cartOverlay) {
      cartSidebar.classList.remove('active')
      cartOverlay.classList.remove('active')
      document.body.style.overflow = ''
    }
  }

  public updateCartDisplay(): void {
    this.updateCartCount()
    this.updateCartItems()
    this.updateCartTotal()
  }

  public updateCartCount(): void {
    const cartCount = document.getElementById('cart-count')
    if (cartCount) {
      const totalItems = this.getTotalItems()
      cartCount.textContent = totalItems.toString()
      cartCount.style.display = totalItems > 0 ? 'flex' : 'none'
    }
  }

  public updateCartItems(): void {
    const cartItemsContainer = document.getElementById('cart-items')

    if (!cartItemsContainer) return

    if (this.items.length === 0) {
      cartItemsContainer.innerHTML = `
        <div class="cart-empty">
          <i class="bi bi-cart-x"></i>
          <p>Your cart is empty</p>
        </div>
      `
      return
    }

    cartItemsContainer.innerHTML = this.items
      .map(
        (item) => `
      <div class="cart-item" data-item-id="${item.id}">
        <div class="cart-item-header">
          <h4 class="cart-item-title">${item.title}</h4>
          <p class="cart-item-price">${item.price}$ each</p>
        </div>
        <div class="cart-item-controls">
          <div class="cart-quantity-controls">
            <button class="cart-quantity-btn cart-decrease-btn" data-item-id="${item.id}">
              <i class="bi bi-dash"></i>
            </button>
            <span class="cart-quantity">${item.quantity}</span>
            <button class="cart-quantity-btn cart-increase-btn" data-item-id="${item.id}">
              <i class="bi bi-plus"></i>
            </button>
          </div>
          <div class="cart-item-total">
            ${(item.price * item.quantity).toFixed(0)}$
          </div>
          <button class="cart-remove-btn" data-item-id="${item.id}" title="Remove item">
            <i class="bi bi-trash"></i>
          </button>
        </div>
      </div>
    `
      )
      .join('')

    // Add event listeners to the newly created buttons
    this.addCartItemEventListeners()
  }

  public addCartItemEventListeners(): void {
    const cartItemsContainer = document.getElementById('cart-items')
    if (!cartItemsContainer) return

    // Add event listeners for decrease buttons
    const decreaseButtons = cartItemsContainer.querySelectorAll('.cart-decrease-btn')
    decreaseButtons.forEach((button) => {
      button.addEventListener('click', (e) => {
        const itemId = parseInt(
          (e.target as HTMLElement).closest('[data-item-id]')?.getAttribute('data-item-id') ||
            '0'
        )
        const item = this.items.find((item) => item.id === itemId)
        if (item) {
          this.updateQuantity(itemId, item.quantity - 1)
        }
      })
    })

    // Add event listeners for increase buttons
    const increaseButtons = cartItemsContainer.querySelectorAll('.cart-increase-btn')
    increaseButtons.forEach((button) => {
      button.addEventListener('click', (e) => {
        const itemId = parseInt(
          (e.target as HTMLElement).closest('[data-item-id]')?.getAttribute('data-item-id') ||
            '0'
        )
        const item = this.items.find((item) => item.id === itemId)
        if (item) {
          this.updateQuantity(itemId, item.quantity + 1)
        }
      })
    })

    // Add event listeners for remove buttons
    const removeButtons = cartItemsContainer.querySelectorAll('.cart-remove-btn')
    removeButtons.forEach((button) => {
      button.addEventListener('click', (e) => {
        const itemId = parseInt(
          (e.target as HTMLElement).closest('[data-item-id]')?.getAttribute('data-item-id') ||
            '0'
        )
        this.removeItem(itemId)
      })
    })
  }

  public updateCartTotal(): void {
    const cartTotalPrice = document.getElementById('cart-total-price')
    if (cartTotalPrice) {
      cartTotalPrice.textContent = `${this.getTotalPrice().toFixed(0)}$`
    }
  }

  public saveToStorage(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.items))
    } catch (error) {
      console.error('Error saving cart to localStorage:', error)
    }
  }

  public loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY)
      if (stored) {
        this.items = JSON.parse(stored)
      }
    } catch (error) {
      console.error('Error loading cart from localStorage:', error)
      this.items = []
    }
  }

  public proceedToCheckout(): void {
    if (this.items.length === 0) {
      alert('Your cart is empty!')
      return
    }

    // Check if user is authenticated
    const token = localStorage.getItem('authToken')
    if (!token) {
      alert('Please login to proceed to checkout')
      this.closeCart()
      return
    }

    // Redirect to checkout page
    this.closeCart()
    window.location.href = '/checkout'
  }
}

// Create global cart instance
export const cart = new Cart()
