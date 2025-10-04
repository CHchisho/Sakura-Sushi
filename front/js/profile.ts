import { fetchData } from './api.js';
import { getHeader, getFooter } from './utils.js';
import { loadTheme, toggleTheme } from './theme.js';

interface AuthResponse {
  success: boolean;
  message: string;
  user?: {
    email: string;
  };
}

class ProfileManager {
  private currentUser: { email: string } | null = null;

  constructor() {
    this.init();
  }

  private async init(): Promise<void> {
    try {
      // Load basic components (header, footer)
      await getHeader();
      await getFooter();
      
      // Load theme
      loadTheme();
      
      // Setup theme toggle
      const checkbox = document.getElementById('theme-checkbox');
      if (checkbox) {
        checkbox.addEventListener('change', toggleTheme);
      }
      
      // Check authentication on page load
      await this.checkAuthentication();
      
      // Setup event listeners
      this.setupEventListeners();
      
    } catch (error) {
      console.error('Error initializing profile:', error);
    }
  }

  private async checkAuthentication(): Promise<void> {
    const token = localStorage.getItem('authToken');
    
    if (!token) {
      // If no token, redirect to main page
      window.location.href = '/';
      return;
    }
    
    try {
      // Check token validity
      const response = await fetchData<AuthResponse>('/api/auth/validate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.success || !response.user) {
        // Token is invalid, redirect to main page
        localStorage.removeItem('authToken');
        window.location.href = '/';
        return;
      }
      
      // Save user information
      this.currentUser = response.user;
      
      // Update user information on page
      this.updateUserInfo();
      
    } catch (error) {
      console.error('Error checking token:', error);
      localStorage.removeItem('authToken');
      window.location.href = '/';
    }
  }

  private updateUserInfo(): void {
    if (this.currentUser) {
      const userEmailElement = document.getElementById('user-email');
      if (userEmailElement) {
        userEmailElement.textContent = this.currentUser.email;
      }
    }
  }

  private setupEventListeners(): void {
    // Logout button handler
    const logoutBtn = document.getElementById('logout-btn');
    logoutBtn?.addEventListener('click', () => this.handleLogout());
  }

  private async handleLogout(): Promise<void> {
    try {
      const token = localStorage.getItem('authToken');
      if (token) {
        await fetchData('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      }
    } catch (error) {
      console.error('Error logging out:', error);
    } finally {
      localStorage.removeItem('authToken');
      this.currentUser = null;
      
      // Show logout message
      this.showMessage('You have been logged out', 'success');
      
      // Redirect to main page through 1 second
      setTimeout(() => {
        window.location.href = '/';
      }, 1000);
    }
  }

  private showMessage(message: string, type: 'success' | 'error'): void {
    // Create message element
    const messageDiv = document.createElement('div');
    messageDiv.className = `profile-message ${type}`;
    messageDiv.textContent = message;
    
    if (type === 'success') {
      messageDiv.style.backgroundColor = '#16a34a';
    } else {
      messageDiv.style.backgroundColor = '#dc2626';
    }
    
    // Add animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideIn {
        from {
          opacity: 0;
          transform: translateX(100%);
        }
        to {
          opacity: 1;
          transform: translateX(0);
        }
      }
    `;
    document.head.appendChild(style);
    
    // Add message to page
    document.body.appendChild(messageDiv);
    
    // Automatically hide message through 3 seconds
    setTimeout(() => {
      messageDiv.remove();
      style.remove();
    }, 3000);
  }

  // Public methods for use in other parts of the application
  public isAuthenticated(): boolean {
    return this.currentUser !== null;
  }

  public getCurrentUser(): { email: string } | null {
    return this.currentUser;
  }
}

// Create instance of profile manager
export const profileManager = new ProfileManager();
