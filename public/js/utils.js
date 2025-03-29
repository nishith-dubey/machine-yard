// Toast notifications
function showToast(message, type = "success") {
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// Loading spinner
function showLoading(elementId) {
  const element = document.getElementById(elementId);
  const spinner = document.createElement("div");
  spinner.className = "loading-spinner";
  element.appendChild(spinner);
  return spinner;
}

function hideLoading(spinner) {
  spinner.remove();
}

// Format date
function formatDate(date) {
  return new Date(date).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Format currency
function formatCurrency(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(amount);
}

// Rating stars
function getRatingStars(rating) {
  const fullStar = "★";
  const emptyStar = "☆";
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    stars.push(i <= rating ? fullStar : emptyStar);
  }
  return stars.join("");
}

// Form validation
function validateForm(formData, rules) {
  const errors = {};
  for (const [field, rule] of Object.entries(rules)) {
    const value = formData.get(field);
    if (rule.required && !value) {
      errors[field] = `${field} is required`;
    }
    if (rule.minLength && value.length < rule.minLength) {
      errors[field] = `${field} must be at least ${rule.minLength} characters`;
    }
    if (rule.pattern && !rule.pattern.test(value)) {
      errors[field] = `${field} format is invalid`;
    }
  }
  return errors;
}

// Export functions
window.utils = {
  showToast,
  showLoading,
  hideLoading,
  formatDate,
  formatCurrency,
  getRatingStars,
  validateForm,
};
// utils.js
function injectNavbar() {
  const token = localStorage.getItem("token");
  let role = "";
  if (token) {
    try {
      const decoded = JSON.parse(atob(token.split(".")[1]));
      role = decoded.role;
    } catch (error) {
      console.error("Error decoding token:", error);
    }
  }

  const navbar = `
    <!-- Navbar Container -->
    <nav class="h-16 sticky top-0 z-20 bg-[#fcfaf8] shadow-sm border-b border-[#e2e0de] overflow-hidden">
        <div class="px-6 flex items-center justify-between">
            <!-- Logo -->
            <a href="/" class="sm:w-20 h-16 bg-contain bg-center bg-no-repeat flex items-center justify-center">
                <img src="logo.jpeg" class="w-30" alt="MY">
            </a>

            <!-- Desktop Links -->
            

            <!-- Search and Icons -->
            <div class="flex items-center gap-10 mr-[0.5vh]">
                <div class="ml-[20vh] md:ml-[10vh] sm:ml-[5vh] hidden md:flex gap-10">
                <a class="text-[#3c532f] font-bold text-[16px] relative hover:after:scale-x-100 after:content-[''] after:absolute after:left-0 after:bottom-0 after:w-full after:h-[2px] after:bg-[#3c532f] after:scale-x-0 after:origin-right after:transition-transform after:duration-300 py-1">
                    <button onclick="window.history.back()">Home</button>
                </a>
                <a href="/policies.html" class="text-[#3c532f] font-bold text-[16px] relative hover:after:scale-x-100 after:content-[''] after:absolute after:left-0 after:bottom-0 after:w-full after:h-[2px] after:bg-[#3c532f] after:scale-x-0 after:origin-right after:transition-transform after:duration-300 py-1">
                    Our Policies
                </a>
            </div>
                ${
                    !token ? `
                    <a href="/login.html" id="login-btn" class="hidden lg:inline-block p-2 text-black font-bold transition duration-200 rounded-full bg-gray-200 cursor-pointer border-[#3c532f] border mr-1">
                        <i class="fas fa-user text-2xl"></i>Logout
                    </a>` : `
                    <button onclick="logout()" class="hidden lg:inline-block p-2 text-black font-semibold transition duration-200 rounded-full bg-red-200 cursor-pointer border-[#3c532f] border mr-1 flex items-center justify-center border-2 border-red-700 hover:bg-red-300">
                        <span class="m-1 mb-5 relative">Logout</span>
                    </button>`
                }
                <button id="menu-btn" class="md:hidden text-2xl text-gray-700">
                    <i class="fas fa-bars"></i>
                </button>
            </div>
        </div>

        <!-- Mobile Menu -->
        <div id="mobile-menu" class="hidden md:hidden bg-white border-t border-gray-200">
            <div class="flex flex-col items-start px-4 py-2">
                <a href="/" class="py-2 text-[#3c532f] font-bold">Home</a>
                ${role === 'user' || role === 'owner' ? `<a href="/" class="py-2 text-[#3c532f] font-bold">Need a Machine?</a>` : ''}
                ${role === 'owner' ? `<a href="/MachineOwner" class="py-2 text-[#3c532f] font-bold">Have a machine?</a>` : ''}
                <a href="/" class="py-2 text-[#3c532f] font-bold">Our Policies</a>
                ${role === 'user' ? `
                    <a href="/user-dashboard.html" class="py-2 text-[#3c532f] font-bold">User Dashboard</a>
                    <a href="/user-booking.html" class="py-2 text-[#3c532f] font-bold">Book Machine</a>
                ` : ''}
                ${role === 'owner' ? `
                    <a href="/owner-dashboard.html" class="py-2 text-[#3c532f] font-bold">Owner Dashboard</a>
                    <a href="/owner-add-machine.html" class="py-2 text-[#3c532f] font-bold">Add Machine</a>
                ` : ''}
                ${role === 'admin' ? `
                    <a href="/admin-dashboard.html" class="py-2 text-[#3c532f] font-bold">Admin Dashboard</a>
                ` : ''}
                ${!token ? `<a href="/login.html" id="mobile-login" class="py-2 text-[#3c532f] font-bold">Login</a>` : 
                          `<button onclick="logout()" class="py-2 text-[#3c532f] font-bold">Logout</button>`}
            </div>
        </div>
    </nav>

    <!-- Login Modal -->
    <div id="login-modal" class="hidden fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
        <div class="bg-white p-6 rounded-lg">
            <h2 class="text-xl font-bold mb-4">Login</h2>
            <!-- Add your login form here -->
            <button id="close-modal" class="mt-4 px-4 py-2 bg-[#3c532f] text-white rounded">Close</button>
        </div>
    </div>
`;
  document.body.insertAdjacentHTML("afterbegin", navbar);
}

function logout() {
  localStorage.removeItem("token");
  window.location.href = "/login.html";
}

// Ensure showToast and other utils are still here
function showToast(message, type) {
  const toast = document.createElement("div");
  toast.className = `fixed bottom-4 right-4 p-4 rounded-lg shadow-lg text-white ${
    type === "success" ? "bg-green-500" : "bg-red-500"
  }`;
  toast.innerText = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

function formatCurrency(amount) {
  return `₹${amount.toFixed(2)}`;
}

function getRatingStars(rating) {
  return Array(5)
    .fill()
    .map((_, i) => (i < rating ? "★" : "☆"))
    .join("");
}
