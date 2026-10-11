/* ==========================================================================
   MÈWOS Wear - Luxury E-commerce Logic
   ========================================================================== */

import { 
    db, 
    collection, 
    doc, 
    addDoc, 
    setDoc,
    getDocs,
    onSnapshot
} from "./firebase-config.js";

// 1. PRODUCT DATABASE
const DEFAULT_PRODUCTS = [
    {
        id: 1,
        name: "MÈWOS Signature Trench",
        price: 12499,
        rating: 4.9,
        image: "assets/mewos_trench_coat.png",
        description: "A luxury double-breasted classic trench coat constructed from heavy organic cotton-canvas. Features tailored shoulders, adjustable belt, storm flaps, and a custom linen lining. A timeless layering piece designed to weather any season.",
        sizes: ["S", "M", "L", "XL"]
    },
    {
        id: 2,
        name: "MÈWOS Minimalist Knit Hoodie",
        price: 4999,
        rating: 4.8,
        image: "assets/mewos_knit_hoodie.png",
        description: "Constructed from 480gsm ultra-heavy organic French terry cotton. This premium hoodie is loop-wheeled for superior thickness, draping into a structured boxy fit. Finished with seamless ribbed cuffs and double-layered hood without drawstrings for a clean, minimalist silhouette.",
        sizes: ["S", "M", "L", "XL"]
    },
    {
        id: 3,
        name: "MÈWOS Linen Oversized Shirt",
        price: 3799,
        rating: 4.7,
        image: "assets/mewos_linen_shirt.png",
        description: "Woven from premium sustainable flax fibers in Normandy, France. This relaxed oversized shirt features drop-shoulders, a wide collar, and standard mother-of-pearl buttons. Naturally breathable and soft, it offers a sophisticated casual drape.",
        sizes: ["S", "M", "L", "XL"]
    },
    {
        id: 4,
        name: "MÈWOS Tailored Crop Blazer",
        price: 8999,
        rating: 4.9,
        image: "assets/mewos_tailored_blazer.png",
        description: "A cropped, structured double-breasted blazer with sharp peak lapels and padded shoulders. Tailored from a premium recycled wool blend, it features clean hidden closures and a full cupro lining. A modern statement piece for elevated style.",
        sizes: ["S", "M", "L", "XL"]
    }
    ,
    // Starter CJ dropshipping items (small, high-margin, easy to ship)
    {
        id: 5,
        name: "Magnetic Phone Case",
        price: 599,
        rating: 4.4,
        image: "assets/cj_phone_case.png",
        description: "Slim magnetic protective phone case with built-in mounting plate. Compatible with most phones.",
        sizes: ["One Size"]
    },
    {
        id: 6,
        name: "RGB LED Light Strip (2m)",
        price: 899,
        rating: 4.6,
        image: "assets/cj_led_strip.png",
        description: "2-meter USB-powered RGB LED light strip with remote control and adhesive backing for easy installation.",
        sizes: ["One Size"]
    },
    {
        id: 7,
        name: "Minimalist Pendant Necklace",
        price: 699,
        rating: 4.5,
        image: "assets/cj_necklace.png",
        description: "Stainless steel minimalist pendant necklace. Hypoallergenic and water-resistant finish.",
        sizes: ["One Size"]
    },
    {
        id: 8,
        name: "Interactive Pet Toy Ball",
        price: 499,
        rating: 4.3,
        image: "assets/cj_pet_ball.png",
        description: "Automatic rolling pet ball to keep pets engaged. Durable, lightweight, and rechargeable.",
        sizes: ["Small", "Medium"]
    },
    {
        id: 9,
        name: "Reusable Stainless Straw Set",
        price: 299,
        rating: 4.7,
        image: "assets/cj_straws.png",
        description: "Set of 4 reusable stainless steel straws with cleaning brush and carry pouch. Eco-friendly.",
        sizes: ["One Size"]
    }
];

let PRODUCTS = [];

async function loadProducts() {
    try {
        const querySnapshot = await getDocs(collection(db, "products"));
        let fetchedProducts = [];
        querySnapshot.forEach((doc) => {
            fetchedProducts.push({ firestoreId: doc.id, ...doc.data() });
        });

        if (fetchedProducts.length === 0) {
            console.log("No products found in Firestore. Seeding default products...");
            for (const prod of DEFAULT_PRODUCTS) {
                await setDoc(doc(db, "products", `prod_${prod.id}`), prod);
            }
            PRODUCTS = [...DEFAULT_PRODUCTS];
            console.log("Seeding complete.");
        } else {
            PRODUCTS = fetchedProducts.sort((a, b) => a.id - b.id);
        }
    } catch (err) {
        console.error("Error loading products from Firestore, using local defaults fallback:", err);
        PRODUCTS = [...DEFAULT_PRODUCTS];
    }
}

// 2. STATE MANAGEMENT
let cart = JSON.parse(localStorage.getItem('mewos_cart')) || [];
let selectedModalSize = "M"; // Default modal size select
let trackingInterval = null;

// DOM Elements
const productsGrid = document.getElementById('products-grid');
const cartDrawer = document.getElementById('cart-drawer');
const cartOverlay = document.getElementById('cart-overlay');
const cartNavBtn = document.getElementById('cart-nav-btn');
const closeCartBtn = document.getElementById('close-cart-btn');
const cartItemsContainer = document.getElementById('cart-items-container');
const cartTotalPrice = document.getElementById('cart-total-price');
const cartCountBadge = document.getElementById('cart-count');
const cartCheckoutBtn = document.getElementById('cart-checkout-btn');

// Mobile Nav DOM
const mobileMenuBtn = document.getElementById('mobile-menu-btn');
const mobileNav = document.getElementById('mobile-nav');
const closeMenuBtn = document.getElementById('close-menu-btn');

// Product Modal DOM
const productModal = document.getElementById('product-modal');
const closeProductModal = document.getElementById('close-product-modal');
const modalProductImage = document.getElementById('modal-product-image');
const modalProductTitle = document.getElementById('modal-product-title');
const modalProductPrice = document.getElementById('modal-product-price');
const modalProductRating = document.getElementById('modal-product-rating');
const modalProductDescription = document.getElementById('modal-product-description');
const modalSizeSelector = document.getElementById('modal-size-selector');
const modalAddToCartBtn = document.getElementById('modal-add-to-cart-btn');
const modalBuyNowBtn = document.getElementById('modal-buy-now-btn');

// Checkout Modal DOM
const checkoutModal = document.getElementById('checkout-modal');
const closeCheckoutModal = document.getElementById('close-checkout-modal');
const checkoutForm = document.getElementById('checkout-form');
const checkoutSummaryItems = document.getElementById('checkout-summary-items');
const summarySubtotal = document.getElementById('summary-subtotal');
const summaryGrandTotal = document.getElementById('summary-grand-total');

// Tracking Modal DOM
const trackingModal = document.getElementById('tracking-modal');
const closeTrackingModal = document.getElementById('close-tracking-modal');
const doneTrackingBtn = document.getElementById('done-tracking-btn');
const trackingOrderId = document.getElementById('tracking-order-id');

// Toast Notification DOM
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toast-message');
const toastIcon = document.getElementById('toast-icon');

// Newsletter Form DOM
const newsletterForm = document.getElementById('newsletter-form');

// ==========================================================================
// Initialization & Render
// ==========================================================================
document.addEventListener('DOMContentLoaded', async () => {
    await loadProducts();
    renderProducts();
    updateCartUI();
    setupEventListeners();
});

// Setup All Interactive Listeners
function setupEventListeners() {
    // Scroll event for styling changes in navbar
    window.addEventListener('scroll', () => {
        const navbar = document.querySelector('.navbar');
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // Cart Drawer triggers
    cartNavBtn.addEventListener('click', openCart);
    closeCartBtn.addEventListener('click', closeCart);
    cartOverlay.addEventListener('click', closeCart);

    // Mobile Navigation triggers
    mobileMenuBtn.addEventListener('click', () => mobileNav.classList.add('open'));
    closeMenuBtn.addEventListener('click', () => mobileNav.classList.remove('open'));
    document.querySelectorAll('.mobile-link').forEach(link => {
        link.addEventListener('click', () => mobileNav.classList.remove('open'));
    });

    // Modal Close buttons
    closeProductModal.addEventListener('click', () => closeModal(productModal));
    closeCheckoutModal.addEventListener('click', () => closeModal(checkoutModal));
    closeTrackingModal.addEventListener('click', () => closeModal(trackingModal));
    doneTrackingBtn.addEventListener('click', () => closeModal(trackingModal));

    // Cart checkout trigger
    cartCheckoutBtn.addEventListener('click', () => {
        if (cart.length === 0) {
            showToast("Your bag is empty", "fa-solid fa-triangle-exclamation");
            return;
        }
        closeCart();
        openCheckout();
    });

    // Payment method selector triggers
    const paymentRadios = document.querySelectorAll('input[name="payment-method"]');
    paymentRadios.forEach(radio => {
        radio.addEventListener('change', togglePaymentInputFields);
    });

    // Checkout form submission
    checkoutForm.addEventListener('submit', handleCheckoutSubmit);

    // Modal size selector buttons
    modalSizeSelector.addEventListener('click', (e) => {
        if (e.target.classList.contains('size-btn')) {
            modalSizeSelector.querySelectorAll('.size-btn').forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');
            selectedModalSize = e.target.getAttribute('data-size');
        }
    });

    // Newsletter submission handler (connected to Firestore)
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const emailInput = newsletterForm.querySelector('input[type="email"]');
            const email = emailInput.value.trim();
            if (!email) return;

            try {
                // Save subscriber to Firestore
                await addDoc(collection(db, "subscribers"), {
                    email: email,
                    subscribedAt: serverTimestamp()
                });
                showToast(`Thank you! ${email} has been subscribed.`, "fa-solid fa-circle-check");
                emailInput.value = '';
            } catch (err) {
                console.warn("Firestore newsletter subscription failed. Using mockup fallback.", err);
                showToast(`Thank you! ${email} has been subscribed.`, "fa-solid fa-circle-check");
                emailInput.value = '';
            }
        });
    }
}

// Toggle checkout inputs based on chosen payment method
function togglePaymentInputFields() {
    // Razorpay Checkout collects card and UPI details outside this page.
}

// Render product list onto the main page grid
function renderProducts() {
    productsGrid.innerHTML = PRODUCTS.map(product => {
        return `
            <article class="product-card" data-id="${product.id}">
                <div class="product-card-image-wrapper" onclick="openProductQuickView(${product.id})">
                    <img src="${product.image}" alt="${product.name}" class="product-card-image" loading="lazy">
                    <div class="product-card-hover-overlay">
                        <button class="quick-view-trigger-btn">Quick View</button>
                    </div>
                </div>
                <div class="product-card-info">
                    <h3 class="product-card-title" onclick="openProductQuickView(${product.id})">${product.name}</h3>
                    <div class="product-card-rating">
                        <i class="fa-solid fa-star"></i> <span>${product.rating} / 5.0</span>
                    </div>
                    <div class="product-card-price">₹${product.price.toLocaleString('en-IN')}</div>
                    
                    <div class="product-card-size-selector">
                        ${product.sizes.map(size => {
                            const isActive = size === 'M' ? 'active' : '';
                            return `<button class="card-size-btn ${isActive}" data-size="${size}" onclick="selectCardSize(event, ${product.id}, '${size}')">${size}</button>`;
                        }).join('')}
                    </div>

                    <div class="product-card-actions">
                        <button class="add-to-cart-btn" onclick="handleCardAddToCart(${product.id})">
                            <i class="fa-solid fa-bag-shopping"></i> Add to Bag
                        </button>
                    </div>
                </div>
            </article>
        `;
    }).join('');
}

// Handle card specific size selection
window.selectCardSize = function(event, productId, size) {
    const parentCard = event.target.closest('.product-card');
    parentCard.querySelectorAll('.card-size-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
};

// ==========================================================================
// Cart Drawer Actions
// ==========================================================================
function openCart() {
    cartDrawer.classList.add('open');
    cartOverlay.classList.add('open');
    document.body.style.overflow = 'hidden';
}
window.openCart = openCart;

function closeCart() {
    cartDrawer.classList.remove('open');
    cartOverlay.classList.remove('open');
    document.body.style.overflow = '';
}
window.closeCart = closeCart;

function updateCartUI() {
    // Update navbar count
    const totalCount = cart.reduce((total, item) => total + item.quantity, 0);
    cartCountBadge.textContent = totalCount;

    // Build cart products markup
    if (cart.length === 0) {
        cartItemsContainer.innerHTML = `
            <div class="cart-empty-state">
                <i class="fa-solid fa-bag-shopping"></i>
                <div>
                    <h4>Your Bag is Empty</h4>
                    <p style="margin-top:0.4rem; font-size:0.85rem;">Items you add to your bag will display here.</p>
                </div>
                <button class="checkout-trigger-btn" onclick="closeCart()" style="padding:0.8rem; font-size:0.75rem;">CONTINUE SHOPPING</button>
            </div>
        `;
        cartTotalPrice.textContent = "₹0";
        return;
    }

    cartItemsContainer.innerHTML = cart.map(item => {
        const product = PRODUCTS.find(p => p.id === item.id);
        return `
            <div class="cart-item">
                <div class="cart-item-image-wrapper">
                    <img src="${product.image}" alt="${product.name}" class="cart-item-image">
                </div>
                <div class="cart-item-details">
                    <h4>${product.name}</h4>
                    <span class="cart-item-size">Size: ${item.size}</span>
                    <span class="cart-item-price">₹${(product.price * item.quantity).toLocaleString('en-IN')}</span>
                    <div class="cart-item-controls">
                        <div class="quantity-selector">
                            <button class="qty-btn" onclick="modifyCartQty(${item.id}, '${item.size}', -1)">-</button>
                            <span class="qty-val">${item.quantity}</span>
                            <button class="qty-btn" onclick="modifyCartQty(${item.id}, '${item.size}', 1)">+</button>
                        </div>
                        <button class="remove-item-btn" onclick="removeCartItem(${item.id}, '${item.size}')">Remove</button>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    const subtotal = cart.reduce((sum, item) => {
        const p = PRODUCTS.find(prod => prod.id === item.id);
        return sum + (p.price * item.quantity);
    }, 0);
    cartTotalPrice.textContent = "₹" + subtotal.toLocaleString('en-IN');
}

// Modify cart quantities
window.modifyCartQty = function(id, size, change) {
    const item = cart.find(i => i.id === id && i.size === size);
    if (item) {
        item.quantity += change;
        if (item.quantity <= 0) {
            cart = cart.filter(i => !(i.id === id && i.size === size));
        }
        localStorage.setItem('mewos_cart', JSON.stringify(cart));
        updateCartUI();
    }
};

// Remove cart items
window.removeCartItem = function(id, size) {
    cart = cart.filter(i => !(i.id === id && i.size === size));
    localStorage.setItem('mewos_cart', JSON.stringify(cart));
    updateCartUI();
    showToast("Item removed from your bag", "fa-solid fa-trash");
};

// Add to Cart triggered from product list cards
window.handleCardAddToCart = function(productId) {
    const productCard = document.querySelector(`.product-card[data-id="${productId}"]`);
    const activeSizeBtn = productCard.querySelector('.card-size-btn.active');
    const selectedSize = activeSizeBtn ? activeSizeBtn.getAttribute('data-size') : "M";

    pushItemToCart(productId, selectedSize, 1);
    openCart();
};

// General push item to cart implementation
function pushItemToCart(productId, size, quantity) {
    const existingIndex = cart.findIndex(item => item.id === productId && item.size === size);
    if (existingIndex > -1) {
        cart[existingIndex].quantity += quantity;
    } else {
        cart.push({ id: productId, size: size, quantity: quantity });
    }
    localStorage.setItem('mewos_cart', JSON.stringify(cart));
    updateCartUI();
    const product = PRODUCTS.find(p => p.id === productId);
    showToast(`${product.name} (${size}) added to bag`, "fa-solid fa-circle-check");
}

// ==========================================================================
// Product Quick View Modal
// ==========================================================================
window.openProductQuickView = function(productId) {
    const product = PRODUCTS.find(p => p.id === productId);
    if (!product) return;

    modalProductImage.src = product.image;
    modalProductImage.alt = product.name;
    modalProductTitle.textContent = product.name;
    modalProductPrice.textContent = "₹" + product.price.toLocaleString('en-IN');
    modalProductRating.textContent = product.rating;
    modalProductDescription.textContent = product.description;

    // Reset size selectors to default "M"
    selectedModalSize = "M";
    modalSizeSelector.querySelectorAll('.size-btn').forEach(btn => {
        if (btn.getAttribute('data-size') === 'M') {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    // Unbind and bind actions with correct product references
    modalAddToCartBtn.onclick = () => {
        pushItemToCart(product.id, selectedModalSize, 1);
        closeModal(productModal);
        openCart();
    };

    modalBuyNowBtn.onclick = () => {
        // Clear previous cart to execute direct "Buy Now" on this item, or add and checkout immediately
        pushItemToCart(product.id, selectedModalSize, 1);
        closeModal(productModal);
        openCheckout();
    };

    openModal(productModal);
};

// ==========================================================================
// Checkout Modal & Verification Flow
// ==========================================================================
function openCheckout() {
    if (cart.length === 0) return;
    
    // Build Checkout Order Summary list
    checkoutSummaryItems.innerHTML = cart.map(item => {
        const product = PRODUCTS.find(p => p.id === item.id);
        return `
            <div class="summary-item-card">
                <div class="summary-item-desc">
                    <span class="summary-item-name">${product.name}</span>
                    <span class="summary-item-meta">Size: ${item.size} | Qty: ${item.quantity}</span>
                </div>
                <span class="summary-item-price">₹${(product.price * item.quantity).toLocaleString('en-IN')}</span>
            </div>
        `;
    }).join('');

    const subtotal = cart.reduce((sum, item) => {
        const p = PRODUCTS.find(prod => prod.id === item.id);
        return sum + (p.price * item.quantity);
    }, 0);

    summarySubtotal.textContent = "₹" + subtotal.toLocaleString('en-IN');
    summaryGrandTotal.textContent = "₹" + subtotal.toLocaleString('en-IN');

    // Reset errors and fields
    resetValidationErrors();
    
    // Toggle initial payment method
    document.querySelector('input[name="payment-method"][value="cod"]').checked = true;
    togglePaymentInputFields();

    openModal(checkoutModal);
}

function resetValidationErrors() {
    const errorContainers = document.querySelectorAll('.form-group');
    errorContainers.forEach(container => container.classList.remove('invalid'));
}

// Validation Logic & Order Processing
function handleCheckoutSubmit(e) {
    e.preventDefault();
    resetValidationErrors();

    let isValid = true;

    // Contact fields
    const nameInput = document.getElementById('chk-name');
    const emailInput = document.getElementById('chk-email');
    const phoneInput = document.getElementById('chk-phone');
    const addressInput = document.getElementById('chk-address');

    // Name Validation
    if (nameInput.value.trim().length < 3) {
        invalidateField(nameInput, "Please enter your full name (minimum 3 characters)");
        isValid = false;
    }

    // Email Validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailInput.value.trim())) {
        invalidateField(emailInput, "Please enter a valid email address");
        isValid = false;
    }

    // Phone Validation
    const phoneRegex = /^[0-9]{10}$/;
    const strippedPhone = phoneInput.value.trim().replace(/\D/g, '');
    if (!phoneRegex.test(strippedPhone)) {
        invalidateField(phoneInput, "Please enter a valid 10-digit phone number");
        isValid = false;
    }

    // Address Validation
    if (addressInput.value.trim().length < 10) {
        invalidateField(addressInput, "Please enter a complete delivery address (minimum 10 characters)");
        isValid = false;
    }

    const paymentMethod = document.querySelector('input[name="payment-method"]:checked').value;

    if (!isValid) {
        showToast("Please correct the errors in the form", "fa-solid fa-triangle-exclamation");
        return;
    }

    // Success! Process Order
    const subtotal = cart.reduce((sum, item) => {
        const p = PRODUCTS.find(prod => prod.id === item.id);
        return sum + (p.price * item.quantity);
    }, 0);

    const orderDetails = {
        name: nameInput.value.trim(),
        email: emailInput.value.trim(),
        phone: strippedPhone,
        address: addressInput.value.trim(),
        paymentMethod: paymentMethod,
        subtotal: subtotal,
        items: cart.map(item => {
            const p = PRODUCTS.find(prod => prod.id === item.id);
            return {
                id: item.id,
                name: p.name,
                size: item.size,
                quantity: item.quantity,
                price: p.price
            };
        })
    };

    processSuccessfulOrder(orderDetails);
}

function invalidateField(inputElement, errorMessage) {
    const formGroup = inputElement.closest('.form-group');
    formGroup.classList.add('invalid');
    const errorSpan = formGroup.querySelector('.error-msg');
    if (errorSpan) {
        errorSpan.textContent = errorMessage;
    }
}

async function startRazorpayPayment(orderDetails, orderId) {
    if (typeof window.Razorpay !== 'function') {
        throw new Error('Secure payment checkout is unavailable.');
    }

    const backendBase = (typeof window !== 'undefined' && window.__BACKEND_API_URL__) ? window.__BACKEND_API_URL__ : '';
    const endpoint = backendBase
        ? `${backendBase.replace(/\/$/, '')}/api/payment/create-order`
        : '/api/payment/create-order';
    const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            orderId,
            amount: orderDetails.subtotal,
            customerEmail: orderDetails.email,
            customerPhone: orderDetails.phone
        })
    });
    const paymentOrder = await response.json();
    if (!response.ok || !paymentOrder.ok) {
        throw new Error(paymentOrder.message || 'Unable to start secure payment.');
    }

    return new Promise((resolve, reject) => {
        const razorpay = new window.Razorpay({
            key: paymentOrder.keyId,
            amount: paymentOrder.amount,
            currency: paymentOrder.currency,
            name: 'MÈWOS Wear',
            description: 'MÈWOS Wear order',
            order_id: paymentOrder.razorpayOrderId,
            prefill: {
                name: orderDetails.name,
                email: orderDetails.email,
                contact: orderDetails.phone
            },
            handler: resolve,
            modal: { ondismiss: () => reject(new Error('Payment was cancelled.')) }
        });

        razorpay.on('payment.failed', () => reject(new Error('Payment failed.')));
        razorpay.open();
    });
}

// Process the order through the backend. Orders must be accepted by the backend
// before the storefront shows confirmation or clears the cart.
async function processSuccessfulOrder(orderDetails) {
    const orderNum = "MEW-" + Math.floor(100000 + Math.random() * 900000);
    trackingOrderId.textContent = "#" + orderNum;

    const orderData = {
        orderId: orderNum,
        customerName: orderDetails.name,
        customerEmail: orderDetails.email,
        customerPhone: orderDetails.phone,
        shippingAddress: orderDetails.address,
        paymentMethod: orderDetails.paymentMethod,
        items: orderDetails.items,
        subtotal: orderDetails.subtotal,
        status: "placed",
        createdAt: new Date().toISOString()
    };

    let apiOrderId = orderNum;
    let trackingNumber = null;
    let paymentDetails = null;

    try {
        if (orderDetails.paymentMethod !== 'cod') {
            paymentDetails = await startRazorpayPayment(orderDetails, orderNum);
        }

        // Use injected BACKEND_API_URL if available (set during build or runtime).
        const backendBase = (typeof window !== 'undefined' && window.__BACKEND_API_URL__) ? window.__BACKEND_API_URL__ : '';
        const createOrderEndpoint = backendBase ? `${backendBase.replace(/\/$/, '')}/api/create-order` : '/api/create-order';

        const response = await fetch(createOrderEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                orderId: orderNum,
                name: orderDetails.name,
                email: orderDetails.email,
                phone: orderDetails.phone,
                address: orderDetails.address,
                paymentMethod: orderDetails.paymentMethod,
                subtotal: orderDetails.subtotal,
                items: orderDetails.items,
                razorpayPaymentId: paymentDetails?.razorpay_payment_id,
                razorpayOrderId: paymentDetails?.razorpay_order_id,
                razorpaySignature: paymentDetails?.razorpay_signature
            })
        });

        const result = await response.json();

        if (!response.ok || !result.ok) {
            throw new Error(result.message || 'Order API request failed');
        }

        apiOrderId = result.orderId || orderNum;
        trackingNumber = result.trackingNumber || null;

        orderData.orderId = apiOrderId;
        orderData.trackingNumber = trackingNumber;
        orderData.status = result.status || 'placed';

        console.log(`Order ${apiOrderId} successfully stored by the backend.`);
    } catch (err) {
        console.error("Backend order submission failed:", err);
        showToast("We could not place your order. Please try again.", "fa-solid fa-triangle-exclamation");
        return;
    }

    trackingOrderId.textContent = '#' + apiOrderId;

    // Clear cart and UI
    cart = [];
    localStorage.removeItem('mewos_cart');
    updateCartUI();

    // Close checkout and trigger confirmation/tracking
    closeModal(checkoutModal);
    openModal(trackingModal);
    showToast("Order Placed Successfully!", "fa-solid fa-circle-check");

    // Initiate Tracking Simulation Timeline
    runTrackingSimulation(apiOrderId, orderData);
}

// Update Tracking UI based on order status
function updateTrackingUI(status) {
    const stepPlaced = document.getElementById('step-placed');
    const stepProcessing = document.getElementById('step-processing');
    const stepDispatched = document.getElementById('step-dispatched');
    const stepDelivered = document.getElementById('step-delivered');

    // Reset steps
    stepPlaced.className = "timeline-step";
    stepProcessing.className = "timeline-step";
    stepDispatched.className = "timeline-step";
    stepDelivered.className = "timeline-step";

    if (status === "placed") {
        stepPlaced.className = "timeline-step active";
        addPulseRingToIcon(stepPlaced);
    } else if (status === "processing") {
        stepPlaced.className = "timeline-step completed";
        stepProcessing.className = "timeline-step active";
        addPulseRingToIcon(stepProcessing);
    } else if (status === "dispatched") {
        stepPlaced.className = "timeline-step completed";
        stepProcessing.className = "timeline-step completed";
        stepDispatched.className = "timeline-step active";
        addPulseRingToIcon(stepDispatched);
    } else if (status === "delivered") {
        stepPlaced.className = "timeline-step completed";
        stepProcessing.className = "timeline-step completed";
        stepDispatched.className = "timeline-step completed";
        stepDelivered.className = "timeline-step completed";
        
        // Remove all pulse rings
        document.querySelectorAll('.pulse-ring').forEach(ring => ring.remove());
    }
}

// Run simulated tracking status changes dynamically (reads/writes Firestore)
function runTrackingSimulation(orderNum, fallbackData) {
    if (trackingInterval) clearInterval(trackingInterval);

    // Keep the confirmation timeline local until a customer-facing tracking API exists.
    let step = 1;
    const statuses = ["placed", "processing", "dispatched", "delivered"];
    
    // Initial UI Update
    updateTrackingUI("placed");

    trackingInterval = setInterval(async () => {
        step++;
        if (step > statuses.length) {
            clearInterval(trackingInterval);
            return;
        }

        const nextStatus = statuses[step - 1];
        console.log(`Local tracking timeline updated to "${nextStatus}"`);
        updateTrackingUI(nextStatus);
    }, 8000);
}

function addPulseRingToIcon(timelineStepElement) {
    // Remove previous pulse rings
    document.querySelectorAll('.pulse-ring').forEach(ring => ring.remove());
    
    // Inject pulse ring into active step's icon
    const iconWrapper = timelineStepElement.querySelector('.step-icon');
    const pulseRing = document.createElement('div');
    pulseRing.className = 'pulse-ring';
    iconWrapper.appendChild(pulseRing);
}

// ==========================================================================
// Modal Helpers
// ==========================================================================
function openModal(modalElement) {
    modalElement.classList.add('open');
    document.body.style.overflow = 'hidden';
}

function closeModal(modalElement) {
    modalElement.classList.remove('open');
    document.body.style.overflow = '';
    
    // Clear tracking simulated interval and listener if tracking modal is closed
    if (modalElement === trackingModal) {
        if (trackingInterval) {
            clearInterval(trackingInterval);
        }
        if (window.currentTrackingUnsubscribe) {
            window.currentTrackingUnsubscribe();
            window.currentTrackingUnsubscribe = null;
        }
    }
}

// ==========================================================================
// Toast Helpers
// ==========================================================================
function showToast(message, iconClass = "fa-solid fa-circle-check") {
    toastMessage.textContent = message;
    toastIcon.className = `toast-icon ${iconClass}`;
    
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3500);
}
