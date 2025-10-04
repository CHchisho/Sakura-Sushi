import { fetchData } from './api.js';

// interface User {
//   email: string;
//   password: string;
// }

interface AuthResponse {
	success: boolean;
	message: string;
	token?: string;
	user?: {
		email: string;
	};
}

class AuthManager {
	private modal: HTMLElement | null = null;
	private loginForm: HTMLFormElement | null = null;
	private registerForm: HTMLFormElement | null = null;
	private currentUser: { email: string } | null = null;

	constructor() {
		this.init();
	}

	private async init(): Promise<void> {
		// Load modal
		await this.loadModal();

		// Initialize elements
		this.modal = document.getElementById('auth-modal');
		this.loginForm = document.getElementById('login-form') as HTMLFormElement;
		this.registerForm = document.getElementById('register-form') as HTMLFormElement;

		// Check existing token
		this.checkExistingAuth();

		// Setup event listeners
		this.setupEventListeners();
	}

	private async loadModal(): Promise<void> {
		try {
			const response = await fetch('Components/Modal/modal.html');
			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}
			const html = await response.text();

			// Create container for modal if it doesn't exist
			let modalContainer = document.getElementById('modal');
			if (!modalContainer) {
				modalContainer = document.createElement('div');
				modalContainer.id = 'modal';
				document.body.appendChild(modalContainer);
			}

			modalContainer.innerHTML = html;
		} catch (error) {
			console.error('Error loading modal:', error);
		}
	}

	private checkExistingAuth(): void {
		const token = localStorage.getItem('authToken');
		if (token) {
			// Check token validity
			this.validateToken(token);
		}
	}

	private async validateToken(token: string): Promise<void> {
		try {
			const response = await fetchData<AuthResponse>('/api/auth/validate', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${token}`
				}
			});

			if (response.success && response.user) {
				this.currentUser = response.user;
				this.updateUI();
			} else {
				localStorage.removeItem('authToken');
			}
		} catch (error) {
			console.error('Error validating token:', error);
			localStorage.removeItem('authToken');
		}
	}

	private setupEventListeners(): void {
		// Close modal button
		const closeBtn = document.getElementById('modal-close');
		closeBtn?.addEventListener('click', () => this.closeModal());

		// Click outside modal
		this.modal?.addEventListener('click', (e) => {
			if (e.target === this.modal) {
				this.closeModal();
			}
		});

		// Switch between forms
		const switchToRegister = document.getElementById('switch-to-register');
		const switchToLogin = document.getElementById('switch-to-login');

		switchToRegister?.addEventListener('click', (e) => {
			e.preventDefault();
			this.showRegisterForm();
		});

		switchToLogin?.addEventListener('click', (e) => {
			e.preventDefault();
			this.showLoginForm();
		});

		// Form handlers
		this.loginForm?.addEventListener('submit', (e) => this.handleLogin(e));
		this.registerForm?.addEventListener('submit', (e) => this.handleRegister(e));


	}

	private setupUserButtonListener(): void {
		// Wait for header loading and find user button
		const findUserButton = () => {
			const userBtn = document.querySelector('.header_control_button .bi-person')?.parentElement as HTMLButtonElement;
			if (userBtn) {
				userBtn.addEventListener('click', () => this.handleUserButtonClick());
				console.log('User button handler added');
			} else {
				// If button is not loaded, try again through a small delay
				setTimeout(findUserButton, 100);
			}
		};

		findUserButton();
	}

	// Public method to initialize user button listener after header is loaded
	public initializeUserButtonListener(): void {
		this.setupUserButtonListener();
	}

	private handleUserButtonClick(): void {
		if (this.currentUser) {
			// User is authenticated - redirect to profile page
			window.location.href = '/profile';
		} else {
			// User is not authenticated - open login modal
			this.openModal();
		}
	}

	private showLoginForm(): void {
		const loginForm = document.getElementById('login-form');
		const registerForm = document.getElementById('register-form');
		const modalTitle = document.getElementById('modal-title');

		loginForm!.style.display = 'block';
		registerForm!.style.display = 'none';
		modalTitle!.textContent = 'Login';
	}

	private showRegisterForm(): void {
		const loginForm = document.getElementById('login-form');
		const registerForm = document.getElementById('register-form');
		const modalTitle = document.getElementById('modal-title');

		loginForm!.style.display = 'none';
		registerForm!.style.display = 'block';
		modalTitle!.textContent = 'Register';
	}

	private async handleLogin(e: Event): Promise<void> {
		e.preventDefault();

		const formData = new FormData(this.loginForm!);
		const email = formData.get('email') as string;
		const password = formData.get('password') as string;

		try {
			const response = await fetchData<AuthResponse>('/api/auth/login', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ email, password })
			});

			if (response.success && response.token) {
				localStorage.setItem('authToken', response.token);
				this.currentUser = response.user!;
				this.updateUI();
				this.closeModal();
				this.showMessage('Successful login!', 'success');
			} else {
				this.showMessage(response.message, 'error');
			}
		} catch (error) {
			console.error('Error logging in:', error);
			this.showMessage('Error logging in. Please try again.', 'error');
		}
	}

	private async handleRegister(e: Event): Promise<void> {
		e.preventDefault();

		const formData = new FormData(this.registerForm!);
		const email = formData.get('email') as string;
		const password = formData.get('password') as string;
		const confirmPassword = formData.get('confirmPassword') as string;

		if (password !== confirmPassword) {
			this.showMessage('Passwords do not match', 'error');
			return;
		}

		try {
			const response = await fetchData<AuthResponse>('/api/auth/register', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ email, password })
			});

			if (response.success) {
				this.showMessage('Registration successful! Now login to the system.', 'success');
				this.showLoginForm();
				this.registerForm!.reset();
			} else {
				this.showMessage(response.message, 'error');
			}
		} catch (error) {
			console.error('Error registering:', error);
			this.showMessage('Error registering. Please try again.', 'error');
		}
	}


	private updateUI(): void {
		const userBtn = document.querySelector('.header_control_button .bi-person')?.parentElement;

		if (this.currentUser) {
			// User is authenticated - update button icon
			if (userBtn) {
				userBtn.innerHTML = '<i class="bi bi-person-fill"></i>';
			}
		} else {
			// User is not authenticated - update button icon
			if (userBtn) {
				userBtn.innerHTML = '<i class="bi bi-person"></i>';
			}

			// Show login form in modal
			this.showLoginForm();
		}
	}

	private openModal(): void {
		this.modal?.classList.add('show');
		document.body.style.overflow = 'hidden';
	}

	private closeModal(): void {
		this.modal?.classList.remove('show');
		document.body.style.overflow = '';
		this.clearMessages();
	}

	private showMessage(message: string, type: 'success' | 'error'): void {
		this.clearMessages();

		const messageDiv = document.createElement('div');
		messageDiv.className = `auth-message ${type}`;
		messageDiv.textContent = message;

		const modalBody = document.querySelector('.modal-body');
		modalBody?.insertBefore(messageDiv, modalBody.firstChild);

		// Automatically hide message through 5 seconds
		setTimeout(() => {
			messageDiv.remove();
		}, 5000);
	}

	private clearMessages(): void {
		const messages = document.querySelectorAll('.auth-message');
		messages.forEach(msg => msg.remove());
	}

	// Public methods for use in other parts of the application
	public isAuthenticated(): boolean {
		return this.currentUser !== null;
	}

	public getCurrentUser(): { email: string } | null {
		return this.currentUser;
	}

	public getAuthToken(): string | null {
		return localStorage.getItem('authToken');
	}
}

// Create instance of authentication manager
export const authManager = new AuthManager();
