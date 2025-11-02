document.addEventListener('DOMContentLoaded', () => {
    // Safe storage wrapper with error handling
    const storage = {
        get(key) {
            try {
                return JSON.parse(localStorage.getItem(key));
            } catch (e) {
                console.error('Storage get error:', e);
                return null;
            }
        },
        set(key, value) {
            try {
                localStorage.setItem(key, JSON.stringify(value));
                return true;
            } catch (e) {
                console.error('Storage set error:', e);
                return false;
            }
        },
        remove(key) {
            try {
                localStorage.removeItem(key);
                return true;
            } catch (e) {
                console.error('Storage remove error:', e);
                return false;
            }
        }
    };

    let currentUser = storage.get('currentUser') || null;
    let cartItems = storage.get('cartItems') || [];

    const authModal = document.getElementById('authModal');
    const cartModal = document.getElementById('cartModal');
    const rewardsModal = document.getElementById('rewardsModal');
    const loginBtn = document.getElementById('loginBtn');
    const cartBtn = document.getElementById('cartBtn');
    const rewardsBtn = document.getElementById('rewardsBtn');
    const cartCountElement = document.getElementById('cartCount');

    // Toast notification system
    function showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `custom-toast toast-${type}`;
        toast.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'info' ? 'star' : 'exclamation-circle'}"></i>
            <span>${message}</span>
        `;
        document.body.appendChild(toast);
        
        setTimeout(() => toast.classList.add('show'), 100);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    }

    // Loyalty Points System
    function calculateLoyaltyPoints(amount) {
        // 1 point for every ₹100 spent
        return Math.floor(amount / 100);
    }

    function addLoyaltyPoints(points) {
        if (currentUser) {
            currentUser.loyaltyPoints = (currentUser.loyaltyPoints || 0) + points;
            saveUser();
            updateLoyaltyDisplay();
        }
    }

    function deductLoyaltyPoints(points) {
        if (currentUser && currentUser.loyaltyPoints >= points) {
            currentUser.loyaltyPoints -= points;
            saveUser();
            updateLoyaltyDisplay();
            return true;
        }
        return false;
    }

    function updateLoyaltyDisplay() {
        if (currentUser && currentUser.loyaltyPoints) {
            const points = currentUser.loyaltyPoints;
            loginBtn.innerHTML = `<i class="fas fa-user-circle"></i> ${currentUser.name} <span class="loyalty-badge">${points} pts</span>`;
        } else if (currentUser) {
            loginBtn.innerHTML = `<i class="fas fa-user-circle"></i> ${currentUser.name}`;
        }
    }

    function updateCartCount() {
        const count = cartItems.reduce((sum, item) => sum + item.quantity, 0);
        cartCountElement.textContent = count;
        cartCountElement.classList.add('bounce');
        setTimeout(() => cartCountElement.classList.remove('bounce'), 300);
    }

    function saveCart() {
        storage.set('cartItems', cartItems);
    }

    function saveUser() {
        storage.set('currentUser', currentUser);
        if (currentUser) {
            storage.set('user_' + currentUser.email, currentUser);
        }
    }

    function validateEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    updateCartCount();

    // Update login button state
    if (currentUser) {
        updateLoyaltyDisplay();
        loginBtn.classList.add('logged-in');
    }

    // Login/Logout handler
    loginBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (currentUser) {
            const confirmLogout = confirm('Are you sure you want to logout?');
            if (confirmLogout) {
                currentUser = null;
                loginBtn.innerHTML = '<i class="fas fa-user"></i> Login';
                loginBtn.classList.remove('logged-in');
                storage.remove('currentUser');
                showToast('Logged out successfully!', 'success');
            }
        } else {
            authModal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    });

    // Rewards Store Button Handler
    if (rewardsBtn) {
        rewardsBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (!currentUser) {
                showToast('Please login to access Rewards Store', 'error');
                authModal.classList.add('active');
                document.body.style.overflow = 'hidden';
                return;
            }
            openRewardsStore();
        });
    }

    // Close modal handlers
    document.getElementById('closeAuthModal').addEventListener('click', () => {
        authModal.classList.remove('active');
        document.body.style.overflow = '';
    });

    document.getElementById('closeCartModal').addEventListener('click', () => {
        cartModal.classList.remove('active');
        document.body.style.overflow = '';
    });

    document.getElementById('closeRewardsModal').addEventListener('click', () => {
        rewardsModal.classList.remove('active');
        document.body.style.overflow = '';
    });

    // Switch between login/signup
    document.getElementById('showSignup').onclick = (e) => {
        e.preventDefault();
        document.getElementById('loginForm').style.display = 'none';
        document.getElementById('signupForm').style.display = 'block';
    };

    document.getElementById('showLogin').onclick = (e) => {
        e.preventDefault();
        document.getElementById('signupForm').style.display = 'none';
        document.getElementById('loginForm').style.display = 'block';
    };

    // Login form submission
    document.getElementById('loginFormSubmit').onsubmit = (e) => {
        e.preventDefault();
        const email = e.target[0].value.trim();
        const password = e.target[1].value;

        if (!validateEmail(email)) {
            showToast('Please enter a valid email address', 'error');
            return;
        }

        if (password.length < 6) {
            showToast('Password must be at least 6 characters', 'error');
            return;
        }

        // Check if user exists in storage
        const existingUser = storage.get('user_' + email);
        if (existingUser) {
            currentUser = existingUser;
        } else {
            currentUser = { name: email.split('@')[0], email, loyaltyPoints: 0 };
        }
        
        saveUser();
        updateLoyaltyDisplay();
        loginBtn.classList.add('logged-in');
        authModal.classList.remove('active');
        document.body.style.overflow = '';
        
        const pointsMsg = currentUser.loyaltyPoints > 0 ? ` You have ${currentUser.loyaltyPoints} loyalty points!` : '';
        showToast(`Welcome back, ${currentUser.name}!${pointsMsg}`, 'success');
        e.target.reset();
    };

    // Signup form submission
    document.getElementById('signupFormSubmit').onsubmit = (e) => {
        e.preventDefault();
        const name = e.target[0].value.trim();
        const email = e.target[1].value.trim();
        const password = e.target[2].value;

        if (name.length < 2) {
            showToast('Name must be at least 2 characters', 'error');
            return;
        }

        if (!validateEmail(email)) {
            showToast('Please enter a valid email address', 'error');
            return;
        }

        if (password.length < 6) {
            showToast('Password must be at least 6 characters', 'error');
            return;
        }

        currentUser = { name, email, loyaltyPoints: 0 };
        saveUser();
        updateLoyaltyDisplay();
        loginBtn.classList.add('logged-in');
        authModal.classList.remove('active');
        document.body.style.overflow = '';
        showToast(`Account created! Welcome, ${name}! Start shopping to earn loyalty points!`, 'success');
        e.target.reset();
    };

    // Add to cart functionality
    document.querySelectorAll('.add-to-cart').forEach(btn => {
        btn.onclick = function (e) {
            e.preventDefault();
            const name = this.dataset.name;
            const price = parseInt(this.dataset.price);
            const img = this.closest('.product-card').querySelector('img').src;

            const existing = cartItems.find(item => item.name === name);
            if (existing) {
                existing.quantity++;
            } else {
                cartItems.push({ name, price, img, quantity: 1 });
            }

            saveCart();
            updateCartCount();
            showToast(`${name} added to cart!`, 'success');
            
            // Visual feedback
            this.innerHTML = '<i class="fas fa-check"></i> Added!';
            setTimeout(() => {
                this.innerHTML = 'Add to Cart';
            }, 1500);
        };
    });

    // Open cart
    cartBtn.addEventListener('click', (e) => {
        e.preventDefault();
        cartModal.classList.add('active');
        document.body.style.overflow = 'hidden';
        displayCart();
    });

    function displayCart() {
        const emptyCart = document.getElementById('emptyCart');
        const cartItemsContainer = document.getElementById('cartItems');
        const cartFooter = document.getElementById('cartFooter');

        cartItemsContainer.innerHTML = '';

        if (cartItems.length === 0) {
            emptyCart.style.display = 'block';
            cartItemsContainer.classList.remove('active');
            cartFooter.classList.remove('active');
        } else {
            emptyCart.style.display = 'none';
            cartItemsContainer.classList.add('active');
            cartFooter.classList.add('active');

            cartItems.forEach((item, i) => {
                cartItemsContainer.innerHTML += `
                    <div class="cart-item" data-index="${i}">
                        <img src="${item.img}" class="cart-item-image" alt="${item.name}">
                        <div class="cart-item-details">
                            <h4 class="cart-item-name">${item.name}</h4>
                            <p class="cart-item-price">₹${item.price.toLocaleString()}</p>
                        </div>
                        <div class="cart-item-actions">
                            <div class="quantity-controls">
                                <button class="qty-btn" onclick="changeQty(${i}, -1)" aria-label="Decrease quantity">-</button>
                                <span class="qty-display">${item.quantity}</span>
                                <button class="qty-btn" onclick="changeQty(${i}, 1)" aria-label="Increase quantity">+</button>
                            </div>
                            <button class="remove-btn" onclick="removeItem(${i})" aria-label="Remove ${item.name}">
                                <i class="fas fa-trash"></i> Remove
                            </button>
                        </div>
                    </div>
                `;
            });

            updateTotals();
        }
    }

    window.changeQty = (index, change) => {
        cartItems[index].quantity += change;
        if (cartItems[index].quantity < 1) cartItems[index].quantity = 1;
        saveCart();
        updateCartCount();
        displayCart();
    };

    window.removeItem = (index) => {
        const itemName = cartItems[index].name;
        if (confirm(`Remove ${itemName} from cart?`)) {
            cartItems.splice(index, 1);
            saveCart();
            updateCartCount();
            displayCart();
            showToast(`${itemName} removed from cart`, 'success');
        }
    };

    function updateTotals() {
        const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const shipping = subtotal >= 2000 ? 0 : 100;
        const loyaltyPoints = calculateLoyaltyPoints(subtotal + shipping);
        const total = subtotal + shipping;

        document.getElementById('subtotal').textContent = `₹${subtotal.toLocaleString()}`;
        document.getElementById('shipping').textContent = shipping === 0 ? 'FREE' : `₹${shipping}`;
        
        // Display loyalty points to be earned
        const loyaltyInfo = document.getElementById('loyaltyInfo');
        if (loyaltyInfo) {
            loyaltyInfo.innerHTML = `<i class="fas fa-star"></i> You'll earn ${loyaltyPoints} loyalty points`;
        }
        
        document.getElementById('total').textContent = `₹${total.toLocaleString()}`;
    }

    // Checkout handler with loyalty points
    document.getElementById('checkoutBtn').onclick = () => {
        if (!currentUser) {
            showToast('Please login to checkout', 'error');
            cartModal.classList.remove('active');
            authModal.classList.add('active');
            return;
        }

        const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const shipping = subtotal >= 2000 ? 0 : 100;
        const total = subtotal + shipping;
        const pointsEarned = calculateLoyaltyPoints(total);

        const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
        const confirmMsg = `Order Summary:\n\nItems: ${itemCount}\nSubtotal: ₹${subtotal.toLocaleString()}\nShipping: ${shipping === 0 ? 'FREE' : '₹' + shipping}\nTotal: ₹${total.toLocaleString()}\n\n🌟 You'll earn ${pointsEarned} loyalty points!\n\nProceed with payment?`;

        if (confirm(confirmMsg)) {
            const orderId = `ECHO${Date.now()}`;
            
            // Add loyalty points
            addLoyaltyPoints(pointsEarned);
            
            // Show success message with points
            showToast(`Order placed successfully! Order ID: ${orderId}`, 'success');
            setTimeout(() => {
                showToast(`🎉 You earned ${pointsEarned} loyalty points! Total: ${currentUser.loyaltyPoints} points`, 'info');
            }, 2000);
            
            cartItems = [];
            saveCart();
            updateCartCount();
            cartModal.classList.remove('active');
            document.body.style.overflow = '';
        }
    };

    // Rewards Store Functionality
    const rewardItems = [
        { id: 1, name: '₹50 Discount Voucher', points: 100, type: 'voucher', value: 50, icon: 'fa-ticket-alt' },
        { id: 2, name: '₹100 Discount Voucher', points: 200, type: 'voucher', value: 100, icon: 'fa-ticket-alt' },
        { id: 3, name: '₹250 Discount Voucher', points: 500, type: 'voucher', value: 250, icon: 'fa-ticket-alt' },
        { id: 4, name: '₹500 Discount Voucher', points: 1000, type: 'voucher', value: 500, icon: 'fa-ticket-alt' },
        { id: 5, name: 'Free Shipping (1 Month)', points: 150, type: 'benefit', icon: 'fa-shipping-fast' },
        { id: 6, name: 'Early Access to Sales', points: 300, type: 'benefit', icon: 'fa-clock' },
        { id: 7, name: 'Echo Premium Membership', points: 2000, type: 'membership', icon: 'fa-crown' },
        { id: 8, name: 'Mystery Gift Box', points: 800, type: 'gift', icon: 'fa-gift' },
    ];

    function openRewardsStore() {
        rewardsModal.classList.add('active');
        document.body.style.overflow = 'hidden';
        displayRewardsStore();
    }

    function displayRewardsStore() {
        const rewardsGrid = document.getElementById('rewardsGrid');
        const userPointsDisplay = document.getElementById('userPoints');
        
        const userPoints = currentUser ? currentUser.loyaltyPoints || 0 : 0;
        userPointsDisplay.innerHTML = `<i class="fas fa-star"></i> Your Points: <strong>${userPoints}</strong>`;

        rewardsGrid.innerHTML = '';

        rewardItems.forEach(item => {
            const canRedeem = userPoints >= item.points;
            const rewardCard = document.createElement('div');
            rewardCard.className = `reward-card ${!canRedeem ? 'disabled' : ''}`;
            rewardCard.innerHTML = `
                <div class="reward-icon">
                    <i class="fas ${item.icon}"></i>
                </div>
                <h4 class="reward-name">${item.name}</h4>
                <p class="reward-points">
                    <i class="fas fa-star"></i> ${item.points} Points
                </p>
                <button class="btn btn-primary btn-redeem ${!canRedeem ? 'disabled' : ''}" 
                        data-id="${item.id}" 
                        ${!canRedeem ? 'disabled' : ''}>
                    ${canRedeem ? 'Redeem Now' : 'Not Enough Points'}
                </button>
            `;
            rewardsGrid.appendChild(rewardCard);
        });

        // Add event listeners to redeem buttons
        document.querySelectorAll('.btn-redeem:not(.disabled)').forEach(btn => {
            btn.addEventListener('click', function() {
                const itemId = parseInt(this.dataset.id);
                redeemReward(itemId);
            });
        });
    }

    function redeemReward(itemId) {
        const reward = rewardItems.find(r => r.id === itemId);
        if (!reward) return;

        if (currentUser.loyaltyPoints < reward.points) {
            showToast('Not enough points!', 'error');
            return;
        }

        if (confirm(`Redeem ${reward.name} for ${reward.points} points?`)) {
            if (deductLoyaltyPoints(reward.points)) {
                // Save redeemed reward
                const redeemedRewards = storage.get('redeemedRewards') || [];
                redeemedRewards.push({
                    ...reward,
                    redeemedAt: new Date().toISOString(),
                    userId: currentUser.email
                });
                storage.set('redeemedRewards', redeemedRewards);

                showToast(`🎉 ${reward.name} redeemed successfully!`, 'success');
                displayRewardsStore(); // Refresh the store
            } else {
                showToast('Redemption failed. Please try again.', 'error');
            }
        }
    }

    // Newsletter form
    document.querySelector('.newsletter-form').onsubmit = (e) => {
        e.preventDefault();
        const email = e.target[0].value.trim();
        
        if (!validateEmail(email)) {
            showToast('Please enter a valid email address', 'error');
            return;
        }
        
        showToast('Successfully subscribed to newsletter!', 'success');
        e.target.reset();
    };

    // Close modals on overlay click
    authModal.addEventListener('click', (e) => {
        if (e.target === authModal) {
            authModal.classList.remove('active');
            document.body.style.overflow = '';
        }
    });

    cartModal.addEventListener('click', (e) => {
        if (e.target === cartModal) {
            cartModal.classList.remove('active');
            document.body.style.overflow = '';
        }
    });

    rewardsModal.addEventListener('click', (e) => {
        if (e.target === rewardsModal) {
            rewardsModal.classList.remove('active');
            document.body.style.overflow = '';
        }
    });

    // Smooth scroll for navigation
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (href !== '#' && href.length > 1) {
                e.preventDefault();
                const target = document.querySelector(href);
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    // Close mobile menu if open
                    const navCollapse = document.querySelector('.navbar-collapse');
                    if (navCollapse.classList.contains('show')) {
                        navCollapse.classList.remove('show');
                    }
                }
            }
        });
    });

    // Navbar scroll effect
    let lastScroll = 0;
    window.addEventListener('scroll', () => {
        const navbar = document.querySelector('.navbar');
        const currentScroll = window.pageYOffset;

        if (currentScroll > 100) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }

        lastScroll = currentScroll;
    });
});
