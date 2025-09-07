// ===== GLOBAL APP STATE =====
const API_URL = "http://localhost:3000";

window.App = {
  currentUser: null,
  currentView: 'home',
  
  // ===== AUTHENTICATION =====
  async signup(formData) {
    try {
      const response = await fetch(`${API_URL}/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      const data = await response.json();
      this.showModal(data.message);
      if (data.message === "Signup successful") {
        this.renderView('login');
      }
    } catch (error) {
      this.showModal("Signup failed: " + error.message);
    }
  },

  async login(formData) {
    try {
      const response = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      const data = await response.json();
      
      if (data.token) {
        localStorage.setItem("token", data.token);
        this.currentUser = { name: data.name, token: data.token };
        this.updateHeader();
        this.renderView('donor-dashboard'); // Default to donor dashboard
        this.loadData();
      } else {
        this.showModal(data.message || "Login failed");
      }
    } catch (error) {
      this.showModal("Login failed: " + error.message);
    }
  },

  logout() {
    localStorage.removeItem("token");
    this.currentUser = null;
    this.updateHeader();
    this.renderView('home');
  },

  // ===== UI RENDERING =====
  renderView(viewName) {
    this.currentView = viewName;
    const appDiv = document.getElementById('app');
    
    // Hide home sections when showing app views
    const homeSections = ['home', 'impact', 'contact'];
    homeSections.forEach(id => {
      const element = document.getElementById(id);
      if (element) {
        element.style.display = viewName === 'home' ? 'block' : 'none';
      }
    });

    switch (viewName) {
      case 'home':
        appDiv.innerHTML = '';
        break;
      case 'login':
        appDiv.innerHTML = this.getLoginHTML();
        break;
      case 'signup':
        appDiv.innerHTML = this.getSignupHTML();
        break;
      case 'donor-dashboard':
        appDiv.innerHTML = this.getDonorDashboardHTML();
        this.loadAvailableFood();
        this.loadMyDonations();
        break;
      case 'receiver-dashboard':
        appDiv.innerHTML = this.getReceiverDashboardHTML();
        this.loadAvailableFood();
        this.loadMyClaimedFood();
        break;
    }
  },

  getLoginHTML() {
    return `
      <div class="auth-card">
        <h2>Login to ShareBite</h2>
        <form onsubmit="window.App.handleLogin(event)">
          <div class="field">
            <label>Email</label>
            <input type="email" id="login-email" class="input" required>
          </div>
          <div class="field">
            <label>Password</label>
            <input type="password" id="login-password" class="input" required>
          </div>
          <div class="actions">
            <button type="submit" class="btn">Login</button>
          </div>
        </form>
        <p style="text-align:center;margin-top:1rem;">
          Don't have an account? <a href="#" onclick="window.App.renderView('signup')" style="color:#16a34a;font-weight:600;">Sign up</a>
        </p>
      </div>
    `;
  },

  getSignupHTML() {
    return `
      <div class="auth-card">
        <h2>Join ShareBite</h2>
        <form onsubmit="window.App.handleSignup(event)">
          <div class="field">
            <label>Full Name</label>
            <input type="text" id="signup-name" class="input" required>
          </div>
          <div class="field">
            <label>Email</label>
            <input type="email" id="signup-email" class="input" required>
          </div>
          <div class="field">
            <label>Password</label>
            <input type="password" id="signup-password" class="input" required>
          </div>
          <div class="actions">
            <button type="submit" class="btn">Sign Up</button>
          </div>
        </form>
        <p style="text-align:center;margin-top:1rem;">
          Already have an account? <a href="#" onclick="window.App.renderView('login')" style="color:#16a34a;font-weight:600;">Login</a>
        </p>
      </div>
    `;
  },

  getDonorDashboardHTML() {
    return `
      <div class="panel">
        <div class="row" style="justify-content:space-between;align-items:center;margin-bottom:2rem;">
          <h2>Donor Dashboard</h2>
          <div class="row">
            <button class="btn" onclick="window.App.renderView('receiver-dashboard')">Switch to Receiver</button>
            <button class="btn btn-alt" onclick="window.App.logout()">Logout</button>
          </div>
        </div>

        <div class="grid">
          <!-- Donate Food -->
          <div class="box">
            <h3>Donate Food</h3>
            <form onsubmit="window.App.handleDonateFood(event)">
              <div class="field">
                <label>Food Name</label>
                <input type="text" id="donate-food-name" class="input" placeholder="e.g., Fresh vegetables" required>
              </div>
              <div class="field">
                <label>Quantity</label>
                <input type="text" id="donate-food-quantity" class="input" placeholder="e.g., 5kg, Serves 10" required>
              </div>
              <div class="actions">
                <button type="submit" class="btn">Donate Food</button>
              </div>
            </form>
          </div>

          <!-- My Donations -->
          <div class="box">
            <h3>My Donations</h3>
            <div id="my-donations-list">
              <p class="muted">Loading your donations...</p>
            </div>
          </div>

          <!-- Available Food -->
          <div class="box">
            <h3>All Available Food</h3>
            <div id="available-food-donor">
              <p class="muted">Loading available food...</p>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  getReceiverDashboardHTML() {
    return `
      <div class="panel">
        <div class="row" style="justify-content:space-between;align-items:center;margin-bottom:2rem;">
          <h2>Receiver Dashboard</h2>
          <div class="row">
            <button class="btn" onclick="window.App.renderView('donor-dashboard')">Switch to Donor</button>
            <button class="btn btn-alt" onclick="window.App.logout()">Logout</button>
          </div>
        </div>

        <div class="grid">
          <!-- Available Food -->
          <div class="box">
            <h3>Available Food</h3>
            <div id="available-food-receiver">
              <p class="muted">Loading available food...</p>
            </div>
          </div>

          <!-- My Claimed Food -->
          <div class="box">
            <h3>My Claimed Food</h3>
            <div id="my-claimed-food">
              <p class="muted">Loading your claimed food...</p>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  // ===== EVENT HANDLERS =====
  handleLogin(event) {
    event.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    this.login({ email, password });
  },

  handleSignup(event) {
    event.preventDefault();
    const name = document.getElementById('signup-name').value;
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    this.signup({ name, email, password });
  },

  handleDonateFood(event) {
    event.preventDefault();
    const name = document.getElementById('donate-food-name').value;
    const quantity = document.getElementById('donate-food-quantity').value;
    this.donateFood({ name, quantity });
    document.getElementById('donate-food-name').value = '';
    document.getElementById('donate-food-quantity').value = '';
  },

  // ===== API CALLS =====
  async donateFood(foodData) {
    try {
      const response = await fetch(`${API_URL}/donate`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(foodData)
      });
      const data = await response.json();
      this.showModal(data.message);
      this.loadAvailableFood();
      this.loadMyDonations();
    } catch (error) {
      this.showModal("Error donating food: " + error.message);
    }
  },

  async loadAvailableFood() {
    try {
      const response = await fetch(`${API_URL}/food`);
      const foods = await response.json();
      this.renderAvailableFood(foods);
    } catch (error) {
      console.error("Error loading available food:", error);
    }
  },

  async loadMyDonations() {
    try {
      const response = await fetch(`${API_URL}/food`);
      const allFoods = await response.json();
      // Filter foods donated by current user (you'd need to modify backend to include donor info)
      this.renderMyDonations(allFoods);
    } catch (error) {
      console.error("Error loading donations:", error);
    }
  },

  async loadMyClaimedFood() {
    try {
      const response = await fetch(`${API_URL}/myclaimed`, {
        headers: { "Authorization": `Bearer ${localStorage.getItem('token')}` }
      });
      const foods = await response.json();
      this.renderMyClaimedFood(foods);
    } catch (error) {
      console.error("Error loading claimed food:", error);
    }
  },

  async claimFood(foodId) {
    try {
      const response = await fetch(`${API_URL}/claim`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ food_id: foodId })
      });
      const data = await response.json();
      this.showModal(data.message);
      this.loadAvailableFood();
      this.loadMyClaimedFood();
    } catch (error) {
      this.showModal("Error claiming food: " + error.message);
    }
  },

  // ===== RENDER DATA =====
  renderAvailableFood(foods) {
    const donorContainer = document.getElementById('available-food-donor');
    const receiverContainer = document.getElementById('available-food-receiver');
    
    if (foods.length === 0) {
      const emptyMessage = '<p class="muted">No food available right now.</p>';
      if (donorContainer) donorContainer.innerHTML = emptyMessage;
      if (receiverContainer) receiverContainer.innerHTML = emptyMessage;
      return;
    }

    const foodHTML = foods.map(food => `
      <div class="food-card">
        <div class="row" style="justify-content:space-between;align-items:center;">
          <div>
            <strong>${food.name}</strong>
            <p class="muted">${food.quantity}</p>
          </div>
          ${receiverContainer ? `<button class="btn" onclick="window.App.claimFood(${food.id})">Claim</button>` : ''}
        </div>
      </div>
    `).join('');

    if (donorContainer) donorContainer.innerHTML = foodHTML;
    if (receiverContainer) receiverContainer.innerHTML = foodHTML;
  },

  renderMyDonations(foods) {
    const container = document.getElementById('my-donations-list');
    if (!container) return;

    if (foods.length === 0) {
      container.innerHTML = '<p class="muted">You haven\'t donated any food yet.</p>';
      return;
    }

    const donationsHTML = foods.map(food => `
      <div class="food-card">
        <strong>${food.name}</strong>
        <p class="muted">${food.quantity}</p>
        <span class="chip ${food.claimed_by ? 'status-claimed' : 'status-available'}">
          ${food.claimed_by ? 'Claimed' : 'Available'}
        </span>
      </div>
    `).join('');

    container.innerHTML = donationsHTML;
  },

  renderMyClaimedFood(foods) {
    const container = document.getElementById('my-claimed-food');
    if (!container) return;

    if (foods.length === 0) {
      container.innerHTML = '<p class="muted">You haven\'t claimed any food yet.</p>';
      return;
    }

    const claimedHTML = foods.map(food => `
      <div class="food-card">
        <strong>${food.name}</strong>
        <p class="muted">${food.quantity}</p>
        <span class="chip status-claimed">Claimed</span>
      </div>
    `).join('');

    container.innerHTML = claimedHTML;
  },

  // ===== UTILITY FUNCTIONS =====
  updateHeader() {
    const authButtons = document.getElementById('auth-buttons');
    const roleLinks = document.getElementById('role-links');
    
    if (this.currentUser) {
      authButtons.innerHTML = `
        <span style="color:#374151;font-weight:600;">Welcome, ${this.currentUser.name}</span>
        <button class="btn" onclick="window.App.logout()">Logout</button>
      `;
      roleLinks.innerHTML = `
        <a href="#" onclick="window.App.renderView('donor-dashboard')">Donor</a>
        <a href="#" onclick="window.App.renderView('receiver-dashboard')">Receiver</a>
      `;
    } else {
      authButtons.innerHTML = `
        <button class="btn" onclick="window.App.renderView('login')">Login</button>
        <button class="btn btn-alt" onclick="window.App.renderView('signup')">Signup</button>
      `;
      roleLinks.innerHTML = '';
    }
  },

  showModal(message) {
    document.getElementById('modal-text').textContent = message;
    document.getElementById('modal').style.display = 'flex';
  },

  loadData() {
    this.loadAvailableFood();
    if (this.currentView === 'donor-dashboard') {
      this.loadMyDonations();
    } else if (this.currentView === 'receiver-dashboard') {
      this.loadMyClaimedFood();
    }
  },

  // ===== INITIALIZATION =====
  init() {
    // Check if user is already logged in
    const token = localStorage.getItem('token');
    if (token) {
      this.currentUser = { token };
      this.updateHeader();
      // You might want to validate the token with the backend here
    }
    
    // Set up navigation for home page
    document.addEventListener('click', (e) => {
      if (e.target.matches('nav a[href^="#"]')) {
        e.preventDefault();
        const targetId = e.target.getAttribute('href').slice(1);
        if (targetId === 'home') {
          this.renderView('home');
        } else {
          const targetElement = document.getElementById(targetId);
          if (targetElement) {
            targetElement.scrollIntoView({ behavior: 'smooth' });
          }
        }
      }
    });
  }
};

// ===== INITIALIZE APP WHEN DOM IS LOADED =====
document.addEventListener('DOMContentLoaded', () => {
  window.App.init();
});