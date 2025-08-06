// PWA Registration and Management Script
class PWAManager {
  constructor() {
    this.swRegistration = null;
    this.updateAvailable = false;
    this.init();
  }

  async init() {
    if ('serviceWorker' in navigator) {
      try {
        await this.registerServiceWorker();
        this.setupUpdateListener();
        this.checkForUpdates();
      } catch (error) {
        console.error('PWA initialization failed:', error);
      }
    } else {
      console.log('Service Worker not supported');
    }
  }

  async registerServiceWorker() {
    try {
      this.swRegistration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });

      console.log('Service Worker registered successfully:', this.swRegistration);

      // Handle service worker updates
      this.swRegistration.addEventListener('updatefound', () => {
        const newWorker = this.swRegistration.installing;
        console.log('Service Worker update found');

        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            this.updateAvailable = true;
            this.showUpdateNotification();
          }
        });
      });

      // Handle service worker controller change
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('Service Worker controller changed');
        window.location.reload();
      });

    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  }

  setupUpdateListener() {
    // Listen for messages from service worker
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'UPDATE_AVAILABLE') {
        this.updateAvailable = true;
        this.showUpdateNotification();
      }
    });
  }

  async checkForUpdates() {
    if (this.swRegistration) {
      try {
        await this.swRegistration.update();
      } catch (error) {
        console.error('Update check failed:', error);
      }
    }
  }

  showUpdateNotification() {
    // Create update notification
    const notification = document.createElement('div');
    notification.id = 'pwa-update-notification';
    notification.innerHTML = `
      <div class="pwa-update-container">
        <div class="pwa-update-content">
          <div class="pwa-update-icon">🔄</div>
          <div class="pwa-update-text">
            <h3>Update Available</h3>
            <p>A new version of Haven Bible App is available.</p>
          </div>
          <div class="pwa-update-actions">
            <button class="pwa-update-btn" onclick="pwaManager.applyUpdate()">
              Update Now
            </button>
            <button class="pwa-dismiss-btn" onclick="pwaManager.dismissUpdate()">
              Later
            </button>
          </div>
        </div>
      </div>
    `;

    // Add styles
    const style = document.createElement('style');
    style.textContent = `
      #pwa-update-notification {
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        max-width: 400px;
        animation: slideIn 0.3s ease-out;
      }

      .pwa-update-container {
        background: #f7f4ef;
        border-radius: 16px;
        box-shadow: 0 8px 32px 0 rgba(158,145,136,0.15);
        border: 2px solid #e5dcd3;
        overflow: hidden;
      }

      .pwa-update-content {
        padding: 20px;
        display: flex;
        align-items: center;
        gap: 16px;
      }

      .pwa-update-icon {
        font-size: 2rem;
        color: #6b5c4a;
      }

      .pwa-update-text h3 {
        margin: 0 0 8px 0;
        color: #6b5c4a;
        font-family: 'Lora', Georgia, serif;
        font-size: 1.1rem;
      }

      .pwa-update-text p {
        margin: 0;
        color: #b0a597;
        font-family: 'Lora', Georgia, serif;
        font-size: 0.9rem;
      }

      .pwa-update-actions {
        display: flex;
        gap: 8px;
        margin-left: auto;
      }

      .pwa-update-btn, .pwa-dismiss-btn {
        padding: 8px 16px;
        border-radius: 8px;
        border: none;
        font-family: 'Lora', Georgia, serif;
        font-size: 0.9rem;
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .pwa-update-btn {
        background: #b0a597;
        color: white;
        font-weight: 600;
      }

      .pwa-update-btn:hover {
        background: #6b5c4a;
        transform: translateY(-1px);
      }

      .pwa-dismiss-btn {
        background: transparent;
        color: #b0a597;
        border: 1px solid #b0a597;
      }

      .pwa-dismiss-btn:hover {
        background: #b0a597;
        color: white;
      }

      @keyframes slideIn {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }

      @media (max-width: 480px) {
        #pwa-update-notification {
          top: 10px;
          right: 10px;
          left: 10px;
          max-width: none;
        }
        
        .pwa-update-content {
          flex-direction: column;
          text-align: center;
        }
        
        .pwa-update-actions {
          margin-left: 0;
          margin-top: 16px;
        }
      }
    `;

    document.head.appendChild(style);
    document.body.appendChild(notification);

    // Auto-dismiss after 10 seconds
    setTimeout(() => {
      this.dismissUpdate();
    }, 10000);
  }

  dismissUpdate() {
    const notification = document.getElementById('pwa-update-notification');
    if (notification) {
      notification.style.animation = 'slideOut 0.3s ease-in';
      setTimeout(() => {
        notification.remove();
      }, 300);
    }
  }

  async applyUpdate() {
    if (this.swRegistration && this.swRegistration.waiting) {
      // Send message to service worker to skip waiting
      this.swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
      
      // Show loading state
      const btn = document.querySelector('.pwa-update-btn');
      if (btn) {
        btn.textContent = 'Updating...';
        btn.disabled = true;
      }
    }
  }

  // Install prompt handling
  async showInstallPrompt() {
    if (this.deferredPrompt) {
      this.deferredPrompt.prompt();
      const { outcome } = await this.deferredPrompt.userChoice;
      console.log(`User response to install prompt: ${outcome}`);
      this.deferredPrompt = null;
    }
  }

  // Check if app is installed
  isInstalled() {
    return window.matchMedia('(display-mode: standalone)').matches ||
           window.navigator.standalone === true;
  }

  // Get app version
  async getAppVersion() {
    if (this.swRegistration && this.swRegistration.active) {
      return new Promise((resolve) => {
        const channel = new MessageChannel();
        channel.port1.onmessage = (event) => {
          resolve(event.data.version);
        };
        this.swRegistration.active.postMessage(
          { type: 'GET_VERSION' },
          [channel.port2]
        );
      });
    }
    return 'unknown';
  }
}

// Initialize PWA Manager
let pwaManager;

// Wait for DOM to be ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    pwaManager = new PWAManager();
  });
} else {
  pwaManager = new PWAManager();
}

// Handle install prompt
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  pwaManager.deferredPrompt = e;
  
  // Show install button if not already installed
  if (!pwaManager.isInstalled()) {
    showInstallButton();
  }
});

// Handle app installed
window.addEventListener('appinstalled', () => {
  console.log('Haven Bible App was installed');
  hideInstallButton();
});

// Install button functions
function showInstallButton() {
  // Create install button if it doesn't exist
  if (!document.getElementById('pwa-install-btn')) {
    const installBtn = document.createElement('button');
    installBtn.id = 'pwa-install-btn';
    installBtn.innerHTML = '📱 Install App';
    installBtn.className = 'pwa-install-button';
    installBtn.onclick = () => pwaManager.showInstallPrompt();
    
    // Add styles
    const style = document.createElement('style');
    style.textContent = `
      .pwa-install-button {
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: linear-gradient(135deg, #b0a597 0%, #cfc2b5 100%);
        color: white;
        border: none;
        padding: 12px 20px;
        border-radius: 25px;
        font-family: 'Lora', Georgia, serif;
        font-size: 0.9rem;
        font-weight: 600;
        cursor: pointer;
        box-shadow: 0 4px 16px 0 rgba(158,145,136,0.15);
        transition: all 0.3s ease;
        z-index: 1000;
      }

      .pwa-install-button:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px 0 rgba(158,145,136,0.2);
      }

      @media (max-width: 480px) {
        .pwa-install-button {
          bottom: 10px;
          right: 10px;
          padding: 10px 16px;
          font-size: 0.8rem;
        }
      }
    `;
    
    document.head.appendChild(style);
    document.body.appendChild(installBtn);
  }
}

function hideInstallButton() {
  const installBtn = document.getElementById('pwa-install-btn');
  if (installBtn) {
    installBtn.remove();
  }
}

// Export for global access
window.PWAManager = PWAManager; 