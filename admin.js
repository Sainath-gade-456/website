/* ==========================================================================
   MÈWOS Wear - Product Administration Control Logic
   ========================================================================== */

import { 
    db, 
    collection, 
    doc, 
    setDoc, 
    deleteDoc, 
    onSnapshot,
    auth,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    signOut
} from "./firebase-config.js";

// State Management
let PRODUCTS = [];
let unsubscribeRealtime = null;
let eventListenersInitialized = false;

// DOM Elements
const productsGrid = document.getElementById('admin-products-grid');
const openAddModalBtn = document.getElementById('open-add-modal-btn');
const closeCrudModalBtn = document.getElementById('close-crud-modal-btn');
const crudModal = document.getElementById('product-crud-modal');
const crudForm = document.getElementById('product-crud-form');

// Form Inputs
const editDocIdInput = document.getElementById('edit-doc-id');
const editProductIdInput = document.getElementById('edit-product-id');
const prodNameInput = document.getElementById('prod-name');
const prodPriceInput = document.getElementById('prod-price');
const prodRatingInput = document.getElementById('prod-rating');
const prodImageInput = document.getElementById('prod-image');
const prodDescInput = document.getElementById('prod-desc');
const saveBtn = document.getElementById('save-product-btn');
const formTitle = document.getElementById('modal-form-title');
const adminAuthPanel = document.getElementById('admin-auth-panel');
const adminAuthForm = document.getElementById('admin-auth-form');
const adminAuthError = document.getElementById('admin-auth-error');
const adminSignInBtn = document.getElementById('admin-sign-in-btn');
const adminApp = document.getElementById('admin-app');
const adminSessionEmail = document.getElementById('admin-session-email');
const adminSignOutBtn = document.getElementById('admin-sign-out-btn');

// Toast Elements
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toast-message');
const toastIcon = document.getElementById('toast-icon');

// ==========================================================================
// Initialization & Listeners
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
    adminAuthForm.addEventListener('submit', handleAdminSignIn);
    adminSignOutBtn.addEventListener('click', () => signOut(auth));

    onAuthStateChanged(auth, (user) => {
        const isSignedIn = Boolean(user);
        adminAuthPanel.hidden = isSignedIn;
        adminApp.hidden = !isSignedIn;

        if (isSignedIn) {
            adminSessionEmail.textContent = user.email || 'Authorized administrator';
            setupRealtimeListener();
            if (!eventListenersInitialized) {
                setupEventListeners();
                eventListenersInitialized = true;
            }
        } else {
            adminSessionEmail.textContent = '';
            PRODUCTS = [];
            if (unsubscribeRealtime) {
                unsubscribeRealtime();
                unsubscribeRealtime = null;
            }
        }
    });
});

async function handleAdminSignIn(event) {
    event.preventDefault();
    adminAuthError.textContent = '';
    adminSignInBtn.disabled = true;
    adminSignInBtn.textContent = 'SIGNING IN...';

    try {
        await signInWithEmailAndPassword(
            auth,
            document.getElementById('admin-email').value.trim(),
            document.getElementById('admin-password').value
        );
        adminAuthForm.reset();
    } catch (error) {
        console.error('Admin sign-in failed:', error);
        adminAuthError.textContent = 'Sign-in failed. Check your credentials or Firebase Auth configuration.';
    } finally {
        adminSignInBtn.disabled = false;
        adminSignInBtn.textContent = 'SIGN IN';
    }
}

function setupEventListeners() {
    // Open add modal
    openAddModalBtn.addEventListener('click', () => {
        openModalForCreate();
    });

    // Close modal
    closeCrudModalBtn.addEventListener('click', () => {
        closeModal();
    });

    // Form submit
    crudForm.addEventListener('submit', handleFormSubmit);
}

// ==========================================================================
// Real-time Firestore sync
// ==========================================================================
function setupRealtimeListener() {
    const productsRef = collection(db, "products");
    
    unsubscribeRealtime = onSnapshot(productsRef, (querySnapshot) => {
        PRODUCTS = [];
        querySnapshot.forEach((doc) => {
            PRODUCTS.push({ firestoreId: doc.id, ...doc.data() });
        });
        
        // Sort by ID ascending
        PRODUCTS.sort((a, b) => a.id - b.id);
        
        renderDashboard();
    }, (error) => {
        console.error("Firestore sync failed:", error);
        productsGrid.innerHTML = `
            <div class="admin-state-container">
                <i class="fa-solid fa-triangle-exclamation" style="color: #ff4d4d;"></i>
                <p>Database access denied or connection failed. Check your Firestore Security Rules.</p>
            </div>
        `;
    });
}

// ==========================================================================
// Rendering Logic
// ==========================================================================
function renderDashboard() {
    if (PRODUCTS.length === 0) {
        productsGrid.innerHTML = `
            <div class="admin-state-container">
                <i class="fa-solid fa-folder-open"></i>
                <p>No products found in the catalog database. Click "Add Product" to create one.</p>
            </div>
        `;
        return;
    }

    productsGrid.innerHTML = PRODUCTS.map(product => {
        const sizesStr = product.sizes && product.sizes.length > 0 ? product.sizes.join(', ') : 'None';
        return `
            <article class="admin-card" data-firestore-id="${product.firestoreId}">
                <div class="admin-card-img-wrapper">
                    <img src="${product.image}" alt="${product.name}" class="admin-card-img" onerror="this.src='https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=600'">
                </div>
                <div class="admin-card-body">
                    <h3 class="admin-card-title">${product.name}</h3>
                    <div class="admin-card-meta">
                        <span class="admin-card-price">₹${product.price.toLocaleString('en-IN')}</span>
                        <div class="admin-card-rating">
                            <i class="fa-solid fa-star"></i> <span>${product.rating}</span>
                        </div>
                    </div>
                    <div class="admin-card-sizes">
                        <strong>Sizes:</strong> ${sizesStr}
                    </div>
                    <div class="admin-card-actions">
                        <button class="btn-action btn-action-edit" onclick="window.triggerEdit('${product.firestoreId}')">
                            <i class="fa-solid fa-pen"></i> Edit
                        </button>
                        <button class="btn-action btn-action-delete" onclick="window.triggerDelete('${product.firestoreId}', '${product.name.replace(/'/g, "\\'")}')">
                            <i class="fa-solid fa-trash"></i> Delete
                        </button>
                    </div>
                </div>
            </article>
        `;
    }).join('');
}

// ==========================================================================
// CRUD Modals and Submissions
// ==========================================================================
function openModalForCreate() {
    formTitle.textContent = "Add New Product";
    editDocIdInput.value = "";
    editProductIdInput.value = "";
    
    // Reset fields
    crudForm.reset();
    resetValidationErrors();
    
    // Default values
    prodRatingInput.value = "4.8";
    prodImageInput.value = "assets/";

    openModal();
}

window.triggerEdit = function(firestoreId) {
    const product = PRODUCTS.find(p => p.firestoreId === firestoreId);
    if (!product) return;

    formTitle.textContent = "Edit Product Details";
    editDocIdInput.value = product.firestoreId;
    editProductIdInput.value = product.id;
    
    prodNameInput.value = product.name;
    prodPriceInput.value = product.price;
    prodRatingInput.value = product.rating;
    prodImageInput.value = product.image;
    prodDescInput.value = product.description;

    // Check size checkboxes
    const checkboxes = document.querySelectorAll('input[name="prod-sizes"]');
    checkboxes.forEach(cb => {
        cb.checked = product.sizes && product.sizes.includes(cb.value);
    });

    resetValidationErrors();
    openModal();
};

window.triggerDelete = async function(firestoreId, productName) {
    if (confirm(`Are you sure you want to delete "${productName}" from the catalog?`)) {
        try {
            await deleteDoc(doc(db, "products", firestoreId));
            showToast("Product deleted successfully", "fa-solid fa-trash");
        } catch (err) {
            console.error("Delete failed:", err);
            showToast("Failed to delete product. Check Firestore rules.", "fa-solid fa-triangle-exclamation");
        }
    }
};

async function handleFormSubmit(e) {
    e.preventDefault();
    resetValidationErrors();

    let isValid = true;

    // Name Validation
    if (prodNameInput.value.trim().length < 3) {
        invalidateField(prodNameInput, "Product name must be at least 3 characters");
        isValid = false;
    }

    // Price Validation
    const priceVal = parseFloat(prodPriceInput.value);
    if (isNaN(priceVal) || priceVal <= 0) {
        invalidateField(prodPriceInput, "Enter a valid positive price");
        isValid = false;
    }

    // Rating Validation
    const ratingVal = parseFloat(prodRatingInput.value);
    if (isNaN(ratingVal) || ratingVal < 0 || ratingVal > 5) {
        invalidateField(prodRatingInput, "Enter a rating between 0.0 and 5.0");
        isValid = false;
    }

    // Image Validation
    if (prodImageInput.value.trim().length < 5) {
        invalidateField(prodImageInput, "Please enter a valid image URL or path");
        isValid = false;
    }

    // Description Validation
    if (prodDescInput.value.trim().length < 10) {
        invalidateField(prodDescInput, "Description must be at least 10 characters");
        isValid = false;
    }

    // Sizes Validation
    const selectedSizes = [];
    const checkboxes = document.querySelectorAll('input[name="prod-sizes"]:checked');
    checkboxes.forEach(cb => selectedSizes.push(cb.value));
    
    if (selectedSizes.length === 0) {
        const errorSpan = document.getElementById('prod-sizes-error');
        errorSpan.style.display = 'block';
        isValid = false;
    } else {
        document.getElementById('prod-sizes-error').style.display = 'none';
    }

    if (!isValid) {
        return;
    }

    // Success - Save to Firestore
    saveBtn.disabled = true;
    saveBtn.textContent = "SAVING...";

    const isEdit = editDocIdInput.value !== "";
    let targetDocId = editDocIdInput.value;
    let numericId = parseInt(editProductIdInput.value);

    // Auto-generate numeric ID for new products
    if (!isEdit) {
        let maxId = PRODUCTS.reduce((max, p) => p.id > max ? p.id : max, 0);
        numericId = maxId + 1;
        targetDocId = `prod_${numericId}`;
    }

    const payload = {
        id: numericId,
        name: prodNameInput.value.trim(),
        price: priceVal,
        rating: ratingVal,
        image: prodImageInput.value.trim(),
        description: prodDescInput.value.trim(),
        sizes: selectedSizes
    };

    try {
        await setDoc(doc(db, "products", targetDocId), payload);
        closeModal();
        showToast(isEdit ? "Product updated successfully" : "Product added successfully");
    } catch (err) {
        console.error("Firestore save error:", err);
        showToast("Error writing to database. Check Firestore Rules.", "fa-solid fa-triangle-exclamation");
    } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = "SAVE PRODUCT";
    }
}

// ==========================================================================
// UI Helpers
// ==========================================================================
function openModal() {
    crudModal.classList.add('open');
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    crudModal.classList.remove('open');
    document.body.style.overflow = '';
}

function resetValidationErrors() {
    const errorContainers = document.querySelectorAll('.form-group');
    errorContainers.forEach(container => container.classList.remove('invalid'));
    document.getElementById('prod-sizes-error').style.display = 'none';
}

function invalidateField(inputElement, errorMessage) {
    const formGroup = inputElement.closest('.form-group');
    formGroup.classList.add('invalid');
    const errorSpan = formGroup.querySelector('.error-msg');
    if (errorSpan) {
        errorSpan.textContent = errorMessage;
    }
}

function showToast(message, iconClass = "fa-solid fa-circle-check") {
    toastMessage.textContent = message;
    toastIcon.className = `toast-icon ${iconClass}`;
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3500);
}
