/* ==========================================================================
   MÈWOS Wear - Store Administration Control Logic
   Real-time Catalog, User Management, Payment Tracking & Failed Transactions
   ========================================================================== */

import { 
    db, 
    collection, 
    doc, 
    setDoc, 
    updateDoc,
    deleteDoc, 
    getDocs,
    onSnapshot,
    auth,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    signOut
} from "./firebase-config.js";

// ==========================================================================
// In-Memory State
// ==========================================================================
let PRODUCTS = [];
let USERS = [];
let ORDERS = [];
let FAILED_TX = [];
let unsubscribeRealtime = null;
let eventListenersInitialized = false;
let currentSelectedUserId = null;
let currentSelectedOrderId = null;

// ==========================================================================
// DOM Elements
// ==========================================================================
const adminAuthPanel = document.getElementById('admin-auth-panel');
const adminAuthForm = document.getElementById('admin-auth-form');
const adminAuthError = document.getElementById('admin-auth-error');
const adminSignInBtn = document.getElementById('admin-sign-in-btn');
const adminApp = document.getElementById('admin-app');
const adminSessionEmail = document.getElementById('admin-session-email');
const adminSignOutBtn = document.getElementById('admin-sign-out-btn');

// Badges
const badgeProductsCount = document.getElementById('badge-products-count');
const badgeUsersCount = document.getElementById('badge-users-count');
const badgeOrdersCount = document.getElementById('badge-orders-count');
const badgeFailedCount = document.getElementById('badge-failed-count');

// Product Dashboard Elements
const productsGrid = document.getElementById('admin-products-grid');
const openAddModalBtn = document.getElementById('open-add-modal-btn');
const closeCrudModalBtn = document.getElementById('close-crud-modal-btn');
const crudModal = document.getElementById('product-crud-modal');
const crudForm = document.getElementById('product-crud-form');
const editDocIdInput = document.getElementById('edit-doc-id');
const editProductIdInput = document.getElementById('edit-product-id');
const prodNameInput = document.getElementById('prod-name');
const prodPriceInput = document.getElementById('prod-price');
const prodRatingInput = document.getElementById('prod-rating');
const prodImageInput = document.getElementById('prod-image');
const prodDescInput = document.getElementById('prod-desc');
const saveBtn = document.getElementById('save-product-btn');
const formTitle = document.getElementById('modal-form-title');

// User Management Elements
const userSearchInput = document.getElementById('user-search-input');
const userFilterStatus = document.getElementById('user-filter-status');
const refreshUsersBtn = document.getElementById('refresh-users-btn');
const openAddUserBtn = document.getElementById('open-add-user-btn');
const usersTableBody = document.getElementById('admin-users-table-body');
const statTotalUsers = document.getElementById('stat-total-users');
const statVerifiedUsers = document.getElementById('stat-verified-users');
const statActiveUsers = document.getElementById('stat-active-users');
const statBlockedUsers = document.getElementById('stat-blocked-users');

// User Management Modals
const userManageModal = document.getElementById('user-manage-modal');
const closeUserManageModalBtn = document.getElementById('close-user-manage-modal-btn');
const userAdminNotes = document.getElementById('user-admin-notes');
const saveUserNotesBtn = document.getElementById('save-user-notes-btn');
const userModalToggleBlockBtn = document.getElementById('user-modal-toggle-block-btn');
const userModalToggleVerifyBtn = document.getElementById('user-modal-toggle-verify-btn');
const userModalEmailBtn = document.getElementById('user-modal-email-btn');

const addUserModal = document.getElementById('add-user-modal');
const closeAddUserModalBtn = document.getElementById('close-add-user-modal-btn');
const addUserForm = document.getElementById('add-user-form');
const saveNewUserBtn = document.getElementById('save-new-user-btn');

// Payments & Orders Elements
const txSearchInput = document.getElementById('tx-search-input');
const txFilterStatus = document.getElementById('tx-filter-status');
const txFilterMethod = document.getElementById('tx-filter-method');
const refreshTxBtn = document.getElementById('refresh-tx-btn');
const txTableBody = document.getElementById('admin-tx-table-body');
const statTotalRevenue = document.getElementById('stat-total-revenue');
const statTotalOrdersCount = document.getElementById('stat-total-orders-count');
const statPaidOrders = document.getElementById('stat-paid-orders');
const statCodOrders = document.getElementById('stat-cod-orders');
const statShippedOrders = document.getElementById('stat-shipped-orders');

// Order Details Modal
const orderDetailsModal = document.getElementById('order-details-modal');
const closeOrderModalBtn = document.getElementById('close-order-modal-btn');
const orderFulfillmentForm = document.getElementById('order-fulfillment-form');
const orderUpdateId = document.getElementById('order-update-id');
const orderStatusSelect = document.getElementById('order-status-select');
const orderTrackingInput = document.getElementById('order-tracking-input');
const orderCarrierInput = document.getElementById('order-carrier-input');
const saveOrderStatusBtn = document.getElementById('save-order-status-btn');

// Failed Transactions Elements
const failedSearchInput = document.getElementById('failed-search-input');
const refreshFailedBtn = document.getElementById('refresh-failed-btn');
const failedTableBody = document.getElementById('admin-failed-table-body');
const statFailedCount = document.getElementById('stat-failed-count');
const statFailedAmount = document.getElementById('stat-failed-amount');
const statFailedReason = document.getElementById('stat-failed-reason');

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
            loadAllAdminData();
            if (!eventListenersInitialized) {
                setupEventListeners();
                eventListenersInitialized = true;
            }
        } else {
            adminSessionEmail.textContent = '';
            PRODUCTS = [];
            USERS = [];
            ORDERS = [];
            FAILED_TX = [];
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
    // Tab switching
    const tabButtons = document.querySelectorAll('.admin-tab-btn');
    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabName = btn.dataset.tab;
            switchTab(tabName);
        });
    });

    // Product CRUD Modals
    openAddModalBtn.addEventListener('click', openModalForCreate);
    closeCrudModalBtn.addEventListener('click', closeModal);
    crudForm.addEventListener('submit', handleFormSubmit);

    // User Management Events
    if (userSearchInput) userSearchInput.addEventListener('input', renderUsers);
    if (userFilterStatus) userFilterStatus.addEventListener('change', renderUsers);
    if (refreshUsersBtn) refreshUsersBtn.addEventListener('click', loadUsers);
    if (openAddUserBtn) openAddUserBtn.addEventListener('click', openAddCustomerModal);
    if (closeAddUserModalBtn) closeAddUserModalBtn.addEventListener('click', closeAddCustomerModal);
    if (addUserForm) addUserForm.addEventListener('submit', handleAddCustomerSubmit);

    if (closeUserManageModalBtn) closeUserManageModalBtn.addEventListener('click', closeUserManageModal);
    if (saveUserNotesBtn) saveUserNotesBtn.addEventListener('click', handleSaveUserNotes);
    if (userModalToggleBlockBtn) {
        userModalToggleBlockBtn.addEventListener('click', () => {
            if (currentSelectedUserId) {
                const user = USERS.find(u => u.id === currentSelectedUserId);
                if (user) window.triggerToggleBlock(user.id, user.status);
            }
        });
    }
    if (userModalToggleVerifyBtn) {
        userModalToggleVerifyBtn.addEventListener('click', () => {
            if (currentSelectedUserId) {
                const user = USERS.find(u => u.id === currentSelectedUserId);
                if (user) window.triggerToggleVerify(user.id, user.verified);
            }
        });
    }

    // Payment & Transaction Events
    if (txSearchInput) txSearchInput.addEventListener('input', renderTransactions);
    if (txFilterStatus) txFilterStatus.addEventListener('change', renderTransactions);
    if (txFilterMethod) txFilterMethod.addEventListener('change', renderTransactions);
    if (refreshTxBtn) refreshTxBtn.addEventListener('click', loadTransactions);

    if (closeOrderModalBtn) closeOrderModalBtn.addEventListener('click', closeOrderModal);
    if (orderFulfillmentForm) orderFulfillmentForm.addEventListener('submit', handleOrderStatusSubmit);

    // Failed Transactions Events
    if (failedSearchInput) failedSearchInput.addEventListener('input', renderFailedTransactions);
    if (refreshFailedBtn) refreshFailedBtn.addEventListener('click', loadFailedTransactions);

    // Outside modal clicks to dismiss
    window.addEventListener('click', (e) => {
        if (e.target === crudModal) closeModal();
        if (e.target === userManageModal) closeUserManageModal();
        if (e.target === addUserModal) closeAddCustomerModal();
        if (e.target === orderDetailsModal) closeOrderModal();
    });
}

function switchTab(tabName) {
    document.querySelectorAll('.admin-tab-btn').forEach(btn => {
        const isActive = btn.dataset.tab === tabName;
        btn.classList.toggle('active', isActive);
        btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });

    document.querySelectorAll('.tab-content').forEach(panel => {
        panel.classList.toggle('active', panel.id === `tab-content-${tabName}`);
    });

    if (tabName === 'users') {
        loadUsers();
    } else if (tabName === 'payments') {
        loadTransactions();
    } else if (tabName === 'failed-tx') {
        loadFailedTransactions();
    }
}

async function loadAllAdminData() {
    loadUsers();
    loadTransactions();
    loadFailedTransactions();
}

// ==========================================================================
// Tab 1: Real-time Products Sync
// ==========================================================================
function setupRealtimeListener() {
    const productsRef = collection(db, "products");
    
    unsubscribeRealtime = onSnapshot(productsRef, (querySnapshot) => {
        PRODUCTS = [];
        querySnapshot.forEach((doc) => {
            PRODUCTS.push({ firestoreId: doc.id, ...doc.data() });
        });
        
        PRODUCTS.sort((a, b) => a.id - b.id);
        if (badgeProductsCount) badgeProductsCount.textContent = PRODUCTS.length;
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
            <article class="admin-card" data-firestore-id="${escapeHtml(product.firestoreId)}">
                <div class="admin-card-img-wrapper">
                    <img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.name)}" class="admin-card-img" onerror="this.src='https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=600'">
                </div>
                <div class="admin-card-body">
                    <h3 class="admin-card-title">${escapeHtml(product.name)}</h3>
                    <div class="admin-card-meta">
                        <span class="admin-card-price">₹${Number(product.price).toLocaleString('en-IN')}</span>
                        <div class="admin-card-rating">
                            <i class="fa-solid fa-star"></i> <span>${escapeHtml(String(product.rating))}</span>
                        </div>
                    </div>
                    <div class="admin-card-sizes">
                        <strong>Sizes:</strong> ${escapeHtml(sizesStr)}
                    </div>
                    <div class="admin-card-actions">
                        <button class="btn-action btn-action-edit" onclick="window.triggerEdit('${escapeHtml(product.firestoreId)}')">
                            <i class="fa-solid fa-pen"></i> Edit
                        </button>
                        <button class="btn-action btn-action-delete" onclick="window.triggerDelete('${escapeHtml(product.firestoreId)}', '${escapeHtml(product.name)}')">
                            <i class="fa-solid fa-trash"></i> Delete
                        </button>
                    </div>
                </div>
            </article>
        `;
    }).join('');
}

// ==========================================================================
// Product CRUD Modals and Actions
// ==========================================================================
function openModalForCreate() {
    formTitle.textContent = "Add New Product";
    editDocIdInput.value = "";
    editProductIdInput.value = "";
    crudForm.reset();
    resetValidationErrors();
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
    if (prodNameInput.value.trim().length < 3) {
        invalidateField(prodNameInput, "Product name must be at least 3 characters");
        isValid = false;
    }
    const priceVal = parseFloat(prodPriceInput.value);
    if (isNaN(priceVal) || priceVal <= 0) {
        invalidateField(prodPriceInput, "Enter a valid positive price");
        isValid = false;
    }
    const ratingVal = parseFloat(prodRatingInput.value);
    if (isNaN(ratingVal) || ratingVal < 0 || ratingVal > 5) {
        invalidateField(prodRatingInput, "Enter a rating between 0.0 and 5.0");
        isValid = false;
    }
    if (prodImageInput.value.trim().length < 5) {
        invalidateField(prodImageInput, "Please enter a valid image URL or path");
        isValid = false;
    }
    if (prodDescInput.value.trim().length < 10) {
        invalidateField(prodDescInput, "Description must be at least 10 characters");
        isValid = false;
    }

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

    if (!isValid) return;

    saveBtn.disabled = true;
    saveBtn.textContent = "SAVING...";

    const isEdit = editDocIdInput.value !== "";
    let targetDocId = editDocIdInput.value;
    let numericId = parseInt(editProductIdInput.value);

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
// Tab 2: User Management (View, Verify, Block, Notes, Create)
// ==========================================================================
async function loadUsers() {
    try {
        if (usersTableBody) {
            usersTableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="table-empty-cell">
                        <i class="fa-solid fa-spinner fa-spin"></i>
                        Updating customer database...
                    </td>
                </tr>
            `;
        }

        // Try API endpoint first
        let loaded = false;
        try {
            const res = await fetch('/api/admin/customers');
            if (res.ok) {
                const data = await res.json();
                if (data.ok && Array.isArray(data.customers)) {
                    USERS = data.customers;
                    loaded = true;
                }
            }
        } catch (apiErr) {
            console.warn('API customers fetch notice, trying Firestore:', apiErr.message);
        }

        // Fallback to Firestore if needed
        if (!loaded) {
            const snap = await getDocs(collection(db, "customers"));
            const fsUsers = [];
            snap.forEach(docSnap => fsUsers.push({ id: docSnap.id, ...docSnap.data() }));
            USERS = fsUsers;
        }

        updateUserStats();
        renderUsers();
    } catch (err) {
        console.error('Failed to load customers:', err);
        if (usersTableBody) {
            usersTableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="table-empty-cell">
                        <i class="fa-solid fa-triangle-exclamation" style="color: #f87171;"></i>
                        Error loading customers. Please refresh or verify permissions.
                    </td>
                </tr>
            `;
        }
    }
}

function updateUserStats() {
    const total = USERS.length;
    const verified = USERS.filter(u => u.verified).length;
    const blocked = USERS.filter(u => u.status === 'blocked').length;
    const active = total - blocked;

    if (statTotalUsers) statTotalUsers.textContent = total;
    if (statVerifiedUsers) statVerifiedUsers.textContent = verified;
    if (statActiveUsers) statActiveUsers.textContent = active;
    if (statBlockedUsers) statBlockedUsers.textContent = blocked;
    if (badgeUsersCount) badgeUsersCount.textContent = total;
}

function renderUsers() {
    if (!usersTableBody) return;

    const searchTerm = (userSearchInput?.value || '').toLowerCase().trim();
    const filterVal = userFilterStatus?.value || 'all';

    let filtered = USERS.filter(u => {
        // Status filter
        if (filterVal === 'active' && u.status === 'blocked') return false;
        if (filterVal === 'blocked' && u.status !== 'blocked') return false;
        if (filterVal === 'verified' && !u.verified) return false;

        // Search term filter
        if (!searchTerm) return true;
        const name = (u.name || '').toLowerCase();
        const email = (u.email || '').toLowerCase();
        const phone = (u.phone || '').toLowerCase();
        const address = (u.shippingAddress || '').toLowerCase();
        return name.includes(searchTerm) || email.includes(searchTerm) || phone.includes(searchTerm) || address.includes(searchTerm);
    });

    if (filtered.length === 0) {
        usersTableBody.innerHTML = `
            <tr>
                <td colspan="6" class="table-empty-cell">
                    <i class="fa-solid fa-user-slash"></i>
                    No customers found matching the search or filters.
                </td>
            </tr>
        `;
        return;
    }

    usersTableBody.innerHTML = filtered.map(u => {
        const initials = getInitials(u.name || u.email || 'CU');
        const isBlocked = u.status === 'blocked';
        const isVerified = Boolean(u.verified);
        const spendStr = Number(u.totalSpent || 0).toLocaleString('en-IN');
        const ordersCount = u.ordersCount || 0;
        const createdDate = formatDate(u.createdAt);
        const city = extractCity(u.shippingAddress) || 'Not provided';

        return `
            <tr>
                <td>
                    <div class="user-cell">
                        <div class="user-avatar">${escapeHtml(initials)}</div>
                        <div class="user-name-group">
                            <span class="user-name">${escapeHtml(u.name || 'Anonymous Client')}</span>
                            <span class="user-subtext">${escapeHtml(u.email || '')}</span>
                        </div>
                    </div>
                </td>
                <td>
                    <div style="font-size:0.85rem; color:#fff;">${escapeHtml(u.phone || 'No phone recorded')}</div>
                    <div style="font-size:0.75rem; color:#888;">${escapeHtml(city)}</div>
                </td>
                <td>
                    <span class="badge ${isBlocked ? 'badge-blocked' : 'badge-active'}">
                        ${isBlocked ? '<i class="fa-solid fa-ban"></i> Blocked' : '<i class="fa-solid fa-circle-check"></i> Active'}
                    </span>
                    ${isVerified ? '<span class="badge badge-verified" style="margin-left:0.3rem;"><i class="fa-solid fa-certificate"></i> Verified</span>' : ''}
                </td>
                <td>
                    <div style="font-weight:600; color:#d4af37;">₹${spendStr}</div>
                    <div style="font-size:0.75rem; color:#888;">${ordersCount} order${ordersCount === 1 ? '' : 's'}</div>
                </td>
                <td>
                    <div style="font-size:0.85rem; color:#e5e5e5;">${createdDate}</div>
                    <div style="font-size:0.75rem; color:#888;">${u.lastOrderAt ? 'Last: ' + formatDate(u.lastOrderAt) : 'No orders yet'}</div>
                </td>
                <td>
                    <div style="display:flex; gap:0.4rem; flex-wrap:wrap;">
                        <button class="btn-table-action" onclick="window.triggerManageUser('${escapeHtml(u.id)}')">
                            <i class="fa-solid fa-address-card"></i> Manage
                        </button>
                        <button class="btn-table-action ${isBlocked ? 'success' : 'warning'}" onclick="window.triggerToggleBlock('${escapeHtml(u.id)}', '${isBlocked ? 'blocked' : 'active'}')">
                            ${isBlocked ? '<i class="fa-solid fa-lock-open"></i> Unblock' : '<i class="fa-solid fa-ban"></i> Block'}
                        </button>
                        <button class="btn-table-action ${isVerified ? 'warning' : 'success'}" onclick="window.triggerToggleVerify('${escapeHtml(u.id)}', ${isVerified})">
                            ${isVerified ? '<i class="fa-solid fa-circle-xmark"></i> Unverify' : '<i class="fa-solid fa-badge-check"></i> Verify'}
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// Toggle Customer Block
window.triggerToggleBlock = async function(userId, currentStatus) {
    const isBlocking = currentStatus !== 'blocked';
    const actionWord = isBlocking ? 'block' : 'unblock';
    
    if (!confirm(`Are you sure you want to ${actionWord} this customer account? ${isBlocking ? 'They will not be allowed to place orders.' : 'Their ordering access will be restored.'}`)) {
        return;
    }

    try {
        const res = await fetch(`/api/admin/customers/${encodeURIComponent(userId)}/toggle-block`, {
            method: 'POST'
        });
        const data = await res.json();
        if (data.ok) {
            showToast(`Customer account ${isBlocking ? 'blocked' : 'unblocked'} successfully`);
            // Update in memory
            const idx = USERS.findIndex(u => u.id === userId);
            if (idx !== -1) {
                USERS[idx].status = data.status;
            }
            updateUserStats();
            renderUsers();
            if (currentSelectedUserId === userId) {
                populateUserManageModal(USERS[idx]);
            }
        } else {
            throw new Error(data.message || 'Server error');
        }
    } catch (err) {
        console.error('Failed to toggle block:', err);
        // Fallback: direct firestore update
        try {
            const nextStatus = isBlocking ? 'blocked' : 'active';
            await setDoc(doc(db, "customers", userId), { status: nextStatus }, { merge: true });
            const idx = USERS.findIndex(u => u.id === userId);
            if (idx !== -1) USERS[idx].status = nextStatus;
            showToast(`Customer ${isBlocking ? 'blocked' : 'unblocked'} in Firestore`);
            updateUserStats();
            renderUsers();
        } catch (fsErr) {
            showToast('Failed to update customer status: ' + err.message, 'fa-solid fa-triangle-exclamation');
        }
    }
};

// Toggle Customer Verify
window.triggerToggleVerify = async function(userId, currentVerify) {
    const nextVerify = !currentVerify;
    try {
        const res = await fetch(`/api/admin/customers/${encodeURIComponent(userId)}/toggle-verify`, {
            method: 'POST'
        });
        const data = await res.json();
        if (data.ok) {
            showToast(`Customer ${nextVerify ? 'verified' : 'unverified'} successfully`);
            const idx = USERS.findIndex(u => u.id === userId);
            if (idx !== -1) {
                USERS[idx].verified = data.verified;
            }
            updateUserStats();
            renderUsers();
            if (currentSelectedUserId === userId) {
                populateUserManageModal(USERS[idx]);
            }
        } else {
            throw new Error(data.message || 'Server error');
        }
    } catch (err) {
        console.error('Failed to toggle verify:', err);
        try {
            await setDoc(doc(db, "customers", userId), { verified: nextVerify }, { merge: true });
            const idx = USERS.findIndex(u => u.id === userId);
            if (idx !== -1) USERS[idx].verified = nextVerify;
            showToast(`Customer verification updated in Firestore`);
            updateUserStats();
            renderUsers();
        } catch (fsErr) {
            showToast('Failed to update verification: ' + err.message, 'fa-solid fa-triangle-exclamation');
        }
    }
};

// Manage Customer Modal
window.triggerManageUser = function(userId) {
    const user = USERS.find(u => u.id === userId);
    if (!user) return;
    currentSelectedUserId = userId;
    populateUserManageModal(user);
    userManageModal.classList.add('open');
    document.body.style.overflow = 'hidden';
};

function populateUserManageModal(user) {
    document.getElementById('user-modal-title').textContent = user.name || 'Customer Profile';
    document.getElementById('user-modal-subtitle').textContent = `Account ID: ${user.id}`;
    
    const isBlocked = user.status === 'blocked';
    const isVerified = Boolean(user.verified);

    document.getElementById('user-modal-status-badge').innerHTML = `
        <span class="badge ${isBlocked ? 'badge-blocked' : 'badge-active'}">
            ${isBlocked ? '<i class="fa-solid fa-ban"></i> Blocked' : '<i class="fa-solid fa-circle-check"></i> Active'}
        </span>
    `;

    document.getElementById('user-modal-verify-badge').innerHTML = `
        <span class="badge ${isVerified ? 'badge-verified' : ''}" style="${!isVerified ? 'background:#333; color:#aaa;' : ''}">
            ${isVerified ? '<i class="fa-solid fa-certificate"></i> Verified Buyer' : 'Unverified'}
        </span>
    `;

    document.getElementById('user-modal-orders-count').textContent = user.ordersCount || 0;
    document.getElementById('user-modal-total-spend').textContent = `₹${Number(user.totalSpent || 0).toLocaleString('en-IN')}`;

    document.getElementById('user-modal-name').textContent = user.name || '-';
    document.getElementById('user-modal-email').textContent = user.email || '-';
    document.getElementById('user-modal-phone').textContent = user.phone || 'Not recorded';
    document.getElementById('user-modal-address').textContent = user.shippingAddress || 'No shipping address recorded yet';
    document.getElementById('user-modal-created').textContent = formatDate(user.createdAt);

    userAdminNotes.value = user.notes || '';

    // Action buttons in modal
    if (userModalToggleBlockBtn) {
        userModalToggleBlockBtn.innerHTML = isBlocked 
            ? '<i class="fa-solid fa-lock-open"></i> Unblock Account' 
            : '<i class="fa-solid fa-ban"></i> Block Account';
        userModalToggleBlockBtn.className = `btn-table-action ${isBlocked ? 'success' : 'warning'}`;
    }

    if (userModalToggleVerifyBtn) {
        userModalToggleVerifyBtn.innerHTML = isVerified
            ? '<i class="fa-solid fa-circle-xmark"></i> Remove Verification'
            : '<i class="fa-solid fa-circle-check"></i> Verify Customer';
        userModalToggleVerifyBtn.className = `btn-table-action ${isVerified ? 'warning' : 'success'}`;
    }

    if (userModalEmailBtn && user.email) {
        userModalEmailBtn.href = `mailto:${encodeURIComponent(user.email)}?subject=${encodeURIComponent('MÈWOS Wear - Regarding Your Account')}`;
    }
}

async function handleSaveUserNotes() {
    if (!currentSelectedUserId) return;
    const notes = userAdminNotes.value.trim();

    saveUserNotesBtn.disabled = true;
    saveUserNotesBtn.textContent = 'Saving...';

    try {
        const res = await fetch(`/api/admin/customers/${encodeURIComponent(currentSelectedUserId)}/notes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ notes })
        });
        const data = await res.json();
        if (data.ok) {
            showToast('Internal notes saved successfully');
            const idx = USERS.findIndex(u => u.id === currentSelectedUserId);
            if (idx !== -1) USERS[idx].notes = notes;
        } else {
            throw new Error(data.message || 'Error saving notes');
        }
    } catch (err) {
        console.error('Notes save error:', err);
        try {
            await setDoc(doc(db, "customers", currentSelectedUserId), { notes }, { merge: true });
            const idx = USERS.findIndex(u => u.id === currentSelectedUserId);
            if (idx !== -1) USERS[idx].notes = notes;
            showToast('Notes saved to Firestore');
        } catch (fsErr) {
            showToast('Failed to save notes: ' + err.message, 'fa-solid fa-triangle-exclamation');
        }
    } finally {
        saveUserNotesBtn.disabled = false;
        saveUserNotesBtn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Save Notes';
    }
}

function closeUserManageModal() {
    userManageModal.classList.remove('open');
    document.body.style.overflow = '';
    currentSelectedUserId = null;
}

// Add Customer Modal
function openAddCustomerModal() {
    addUserForm.reset();
    addUserModal.classList.add('open');
    document.body.style.overflow = 'hidden';
}

function closeAddCustomerModal() {
    addUserModal.classList.remove('open');
    document.body.style.overflow = '';
}

async function handleAddCustomerSubmit(e) {
    e.preventDefault();
    const name = document.getElementById('new-user-name').value.trim();
    const email = document.getElementById('new-user-email').value.trim();
    const phone = document.getElementById('new-user-phone').value.trim();
    const status = document.getElementById('new-user-status').value;
    const shippingAddress = document.getElementById('new-user-address').value.trim();
    const verified = document.getElementById('new-user-verified').checked;
    const notes = document.getElementById('new-user-notes').value.trim();

    if (!name || !email) {
        showToast('Please provide both name and email', 'fa-solid fa-triangle-exclamation');
        return;
    }

    saveNewUserBtn.disabled = true;
    saveNewUserBtn.textContent = 'CREATING...';

    try {
        const res = await fetch('/api/admin/customers', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, phone, status, shippingAddress, verified, notes })
        });
        const data = await res.json();
        if (data.ok) {
            showToast('Customer account created successfully');
            closeAddCustomerModal();
            loadUsers();
        } else {
            throw new Error(data.message || 'Failed to create customer');
        }
    } catch (err) {
        console.error('Customer create error:', err);
        showToast('Error creating customer: ' + err.message, 'fa-solid fa-triangle-exclamation');
    } finally {
        saveNewUserBtn.disabled = false;
        saveNewUserBtn.textContent = 'CREATE CUSTOMER';
    }
}

// ==========================================================================
// Tab 3: Payments & Order Tracking
// ==========================================================================
async function loadTransactions() {
    try {
        if (txTableBody) {
            txTableBody.innerHTML = `
                <tr>
                    <td colspan="7" class="table-empty-cell">
                        <i class="fa-solid fa-spinner fa-spin"></i>
                        Updating transaction & fulfillment records...
                    </td>
                </tr>
            `;
        }

        let loaded = false;
        try {
            const res = await fetch('/api/admin/transactions');
            if (res.ok) {
                const data = await res.json();
                if (data.ok && Array.isArray(data.orders)) {
                    ORDERS = data.orders;
                    loaded = true;
                }
            }
        } catch (apiErr) {
            console.warn('API transactions fetch notice, trying Firestore:', apiErr.message);
        }

        if (!loaded) {
            const snap = await getDocs(collection(db, "orders"));
            const fsOrders = [];
            snap.forEach(docSnap => fsOrders.push({ id: docSnap.id, ...docSnap.data() }));
            ORDERS = fsOrders;
        }

        // Sort descending by creation date
        ORDERS.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

        updatePaymentStats();
        renderTransactions();
    } catch (err) {
        console.error('Failed to load transactions:', err);
        if (txTableBody) {
            txTableBody.innerHTML = `
                <tr>
                    <td colspan="7" class="table-empty-cell">
                        <i class="fa-solid fa-triangle-exclamation" style="color:#f87171;"></i>
                        Error loading transactions. Please check database permissions.
                    </td>
                </tr>
            `;
        }
    }
}

function updatePaymentStats() {
    let totalRev = 0;
    let paidCount = 0;
    let codCount = 0;
    let shippedCount = 0;

    ORDERS.forEach(o => {
        const isPaid = (o.status === 'paid' || o.paymentMethod === 'razorpay' || o.status === 'delivered');
        if (isPaid && o.status !== 'cancelled') {
            totalRev += Number(o.subtotal || o.amount || 0);
        }
        if (o.status === 'paid' || o.paymentMethod === 'razorpay') {
            paidCount += 1;
        }
        if (o.paymentMethod === 'cod') {
            codCount += 1;
        }
        if (o.status === 'shipped' || o.status === 'delivered') {
            shippedCount += 1;
        }
    });

    if (statTotalRevenue) statTotalRevenue.textContent = `₹${totalRev.toLocaleString('en-IN')}`;
    if (statTotalOrdersCount) statTotalOrdersCount.textContent = `${ORDERS.length} orders total`;
    if (statPaidOrders) statPaidOrders.textContent = paidCount;
    if (statCodOrders) statCodOrders.textContent = codCount;
    if (statShippedOrders) statShippedOrders.textContent = shippedCount;
    if (badgeOrdersCount) badgeOrdersCount.textContent = ORDERS.length;
}

function renderTransactions() {
    if (!txTableBody) return;

    const searchTerm = (txSearchInput?.value || '').toLowerCase().trim();
    const filterStatus = txFilterStatus?.value || 'all';
    const filterMethod = txFilterMethod?.value || 'all';

    let filtered = ORDERS.filter(o => {
        // Status filter
        if (filterStatus !== 'all' && (o.status || '').toLowerCase() !== filterStatus.toLowerCase()) {
            return false;
        }
        // Method filter
        if (filterMethod !== 'all' && (o.paymentMethod || '').toLowerCase() !== filterMethod.toLowerCase()) {
            return false;
        }
        // Search filter
        if (!searchTerm) return true;
        const id = (o.id || '').toLowerCase();
        const email = (o.customerEmail || '').toLowerCase();
        const name = (o.customerName || '').toLowerCase();
        const payId = (o.razorpayPaymentId || '').toLowerCase();
        const trk = (o.trackingNumber || '').toLowerCase();
        return id.includes(searchTerm) || email.includes(searchTerm) || name.includes(searchTerm) || payId.includes(searchTerm) || trk.includes(searchTerm);
    });

    if (filtered.length === 0) {
        txTableBody.innerHTML = `
            <tr>
                <td colspan="7" class="table-empty-cell">
                    <i class="fa-solid fa-receipt"></i>
                    No orders or transactions matching criteria.
                </td>
            </tr>
        `;
        return;
    }

    txTableBody.innerHTML = filtered.map(o => {
        const orderId = o.id || 'N/A';
        const dateStr = formatDate(o.createdAt);
        const amountStr = Number(o.subtotal || o.amount || 0).toLocaleString('en-IN');
        const itemCount = Array.isArray(o.items) ? o.items.reduce((s, it) => s + (it.quantity || 1), 0) : 1;
        const isRazorpay = o.paymentMethod === 'razorpay';
        const status = o.status || 'pending';
        const tracking = o.trackingNumber || 'Unassigned';
        const carrier = o.carrier || 'Delhivery';

        return `
            <tr>
                <td>
                    <div style="font-weight:600; color:#fff; font-family:monospace; font-size:0.9rem;">${escapeHtml(orderId)}</div>
                    <div style="font-size:0.75rem; color:#888;">${dateStr}</div>
                </td>
                <td>
                    <div style="font-weight:500; color:#fff;">${escapeHtml(o.customerName || 'Anonymous')}</div>
                    <div style="font-size:0.75rem; color:#888;">${escapeHtml(o.customerEmail || 'No email')}</div>
                </td>
                <td>
                    <div style="font-weight:600; color:#d4af37;">₹${amountStr}</div>
                    <div style="font-size:0.75rem; color:#888;">${itemCount} item${itemCount === 1 ? '' : 's'}</div>
                </td>
                <td>
                    <span class="badge ${isRazorpay ? 'badge-verified' : ''}" style="${!isRazorpay ? 'background:rgba(251,191,36,0.15); color:#fbbf24; border:1px solid rgba(251,191,36,0.3);' : ''}">
                        ${isRazorpay ? '<i class="fa-solid fa-bolt"></i> Razorpay UPI/Card' : '<i class="fa-solid fa-hand-holding-dollar"></i> COD'}
                    </span>
                    ${o.razorpayPaymentId ? `<div style="font-size:0.7rem; font-family:monospace; color:#888; margin-top:0.25rem;">ID: ${escapeHtml(o.razorpayPaymentId)}</div>` : ''}
                </td>
                <td>
                    ${renderOrderStatusBadge(status)}
                </td>
                <td>
                    <div style="font-size:0.85rem; font-family:monospace; color:#60a5fa;">${escapeHtml(tracking)}</div>
                    <div style="font-size:0.75rem; color:#888;">Carrier: ${escapeHtml(carrier)}</div>
                </td>
                <td>
                    <button class="btn-table-action" onclick="window.triggerViewOrder('${escapeHtml(orderId)}')">
                        <i class="fa-solid fa-eye"></i> View & Track
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

function renderOrderStatusBadge(status) {
    const s = (status || '').toLowerCase();
    switch (s) {
        case 'paid':
        case 'captured':
            return '<span class="badge badge-verified"><i class="fa-solid fa-circle-check"></i> Paid</span>';
        case 'shipped':
            return '<span class="badge" style="background:rgba(96,165,250,0.2); color:#60a5fa; border:1px solid rgba(96,165,250,0.4);"><i class="fa-solid fa-truck"></i> Shipped</span>';
        case 'delivered':
            return '<span class="badge badge-active"><i class="fa-solid fa-box-check"></i> Delivered</span>';
        case 'processing':
            return '<span class="badge" style="background:rgba(168,85,247,0.2); color:#c084fc; border:1px solid rgba(168,85,247,0.4);"><i class="fa-solid fa-gears"></i> Processing</span>';
        case 'cancelled':
            return '<span class="badge badge-blocked"><i class="fa-solid fa-circle-xmark"></i> Cancelled</span>';
        case 'pending':
        default:
            return '<span class="badge" style="background:rgba(251,191,36,0.2); color:#fbbf24; border:1px solid rgba(251,191,36,0.4);"><i class="fa-solid fa-clock"></i> Pending</span>';
    }
}

// Order View & Tracking Modal
window.triggerViewOrder = function(orderId) {
    const order = ORDERS.find(o => o.id === orderId);
    if (!order) return;

    currentSelectedOrderId = orderId;
    document.getElementById('order-modal-title').textContent = `Order #${order.id}`;
    document.getElementById('order-modal-date').textContent = `Placed on ${formatDate(order.createdAt)}`;
    document.getElementById('order-modal-customer').textContent = `${order.customerName || 'Client'} (${order.customerEmail || ''})`;
    document.getElementById('order-modal-amount').textContent = `₹${Number(order.subtotal || order.amount || 0).toLocaleString('en-IN')}`;
    document.getElementById('order-modal-payment').textContent = order.paymentMethod === 'razorpay' ? 'Razorpay (Card/UPI)' : 'Cash on Delivery (COD)';
    document.getElementById('order-modal-status-badge').innerHTML = renderOrderStatusBadge(order.status);
    document.getElementById('order-modal-address').textContent = order.shippingAddress || 'No shipping address provided.';

    // Populate Items
    const itemsList = document.getElementById('order-modal-items-list');
    if (Array.isArray(order.items) && order.items.length > 0) {
        itemsList.innerHTML = order.items.map(it => `
            <div style="display:flex; align-items:center; justify-content:space-between; padding:0.75rem 1rem; border-bottom:1px solid #222;">
                <div>
                    <strong style="color:#fff; font-size:0.9rem;">${escapeHtml(it.name || 'Product')}</strong>
                    <div style="font-size:0.78rem; color:#888;">Size: ${escapeHtml(it.size || 'M')} | Qty: ${it.quantity || 1}</div>
                </div>
                <div style="color:#d4af37; font-weight:600; font-size:0.9rem;">
                    ₹${Number((it.price || 0) * (it.quantity || 1)).toLocaleString('en-IN')}
                </div>
            </div>
        `).join('');
    } else {
        itemsList.innerHTML = '<div style="padding:1rem; color:#888; font-size:0.85rem; text-align:center;">No line items detailed</div>';
    }

    // Populate Tracking Form
    orderUpdateId.value = order.id;
    orderStatusSelect.value = (order.status || 'pending').toLowerCase();
    orderTrackingInput.value = order.trackingNumber || '';
    orderCarrierInput.value = order.carrier || 'Delhivery';

    orderDetailsModal.classList.add('open');
    document.body.style.overflow = 'hidden';
};

async function handleOrderStatusSubmit(e) {
    e.preventDefault();
    if (!currentSelectedOrderId) return;

    const status = orderStatusSelect.value;
    const trackingNumber = orderTrackingInput.value.trim();
    const carrier = orderCarrierInput.value.trim() || 'Delhivery';

    saveOrderStatusBtn.disabled = true;
    saveOrderStatusBtn.textContent = 'SAVING...';

    try {
        const res = await fetch(`/api/admin/orders/${encodeURIComponent(currentSelectedOrderId)}/status`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status, trackingNumber, carrier })
        });
        const data = await res.json();
        if (data.ok) {
            showToast('Order status and tracking updated successfully');
            closeOrderModal();
            loadTransactions();
        } else {
            throw new Error(data.message || 'Server error');
        }
    } catch (err) {
        console.error('Order status update error:', err);
        // Fallback direct to Firestore
        try {
            await setDoc(doc(db, "orders", currentSelectedOrderId), {
                status,
                trackingNumber,
                carrier,
                updatedAt: new Date().toISOString()
            }, { merge: true });
            showToast('Order updated in Firestore');
            closeOrderModal();
            loadTransactions();
        } catch (fsErr) {
            showToast('Failed to update order: ' + err.message, 'fa-solid fa-triangle-exclamation');
        }
    } finally {
        saveOrderStatusBtn.disabled = false;
        saveOrderStatusBtn.textContent = 'SAVE STATUS & TRACKING';
    }
}

function closeOrderModal() {
    orderDetailsModal.classList.remove('open');
    document.body.style.overflow = '';
    currentSelectedOrderId = null;
}

// ==========================================================================
// Tab 4: Failed Transactions Tracking
// ==========================================================================
async function loadFailedTransactions() {
    try {
        if (failedTableBody) {
            failedTableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="table-empty-cell">
                        <i class="fa-solid fa-spinner fa-spin"></i>
                        Fetching payment decline and failure logs...
                    </td>
                </tr>
            `;
        }

        let loaded = false;
        try {
            const res = await fetch('/api/admin/failed-transactions');
            if (res.ok) {
                const data = await res.json();
                if (data.ok && Array.isArray(data.failedTransactions)) {
                    FAILED_TX = data.failedTransactions;
                    loaded = true;
                }
            }
        } catch (apiErr) {
            console.warn('API failed transactions fetch notice:', apiErr.message);
        }

        if (!loaded) {
            const snap = await getDocs(collection(db, "failedTransactions"));
            const fsFailed = [];
            snap.forEach(docSnap => fsFailed.push({ id: docSnap.id, ...docSnap.data() }));
            FAILED_TX = fsFailed;
        }

        // Sort descending by timestamp
        FAILED_TX.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

        updateFailedStats();
        renderFailedTransactions();
    } catch (err) {
        console.error('Failed to load failed transactions:', err);
        if (failedTableBody) {
            failedTableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="table-empty-cell">
                        <i class="fa-solid fa-triangle-exclamation" style="color:#f87171;"></i>
                        Error loading failed transaction logs.
                    </td>
                </tr>
            `;
        }
    }
}

function updateFailedStats() {
    const totalCount = FAILED_TX.length;
    let totalAmt = 0;
    const reasonCounts = {};

    FAILED_TX.forEach(tx => {
        totalAmt += Number(tx.amount || tx.subtotal || 0);
        const reason = tx.reason || tx.error_description || tx.step || 'Card / UPI Authentication Failure';
        reasonCounts[reason] = (reasonCounts[reason] || 0) + 1;
    });

    let topReason = 'None logged yet';
    let maxCount = 0;
    for (const [r, cnt] of Object.entries(reasonCounts)) {
        if (cnt > maxCount) {
            maxCount = cnt;
            topReason = r;
        }
    }

    if (statFailedCount) statFailedCount.textContent = totalCount;
    if (statFailedAmount) statFailedAmount.textContent = `₹${totalAmt.toLocaleString('en-IN')}`;
    if (statFailedReason) statFailedReason.textContent = totalCount > 0 ? `${topReason} (${maxCount}x)` : 'No failed transactions';
    if (badgeFailedCount) badgeFailedCount.textContent = totalCount;
}

function renderFailedTransactions() {
    if (!failedTableBody) return;

    const searchTerm = (failedSearchInput?.value || '').toLowerCase().trim();

    let filtered = FAILED_TX.filter(tx => {
        if (!searchTerm) return true;
        const id = (tx.id || '').toLowerCase();
        const email = (tx.customerEmail || '').toLowerCase();
        const reason = (tx.reason || tx.error_description || '').toLowerCase();
        const name = (tx.customerName || '').toLowerCase();
        return id.includes(searchTerm) || email.includes(searchTerm) || reason.includes(searchTerm) || name.includes(searchTerm);
    });

    if (filtered.length === 0) {
        failedTableBody.innerHTML = `
            <tr>
                <td colspan="6" class="table-empty-cell">
                    <i class="fa-solid fa-shield-check" style="color: #4ade80;"></i>
                    No failed transactions logged.
                </td>
            </tr>
        `;
        return;
    }

    failedTableBody.innerHTML = filtered.map(tx => {
        const txId = tx.id || 'tx_unknown';
        const dateStr = formatDate(tx.createdAt);
        const amtStr = Number(tx.amount || tx.subtotal || 0).toLocaleString('en-IN');
        const reason = tx.reason || tx.error_description || tx.step || 'Payment authorization declined';
        const email = tx.customerEmail || 'No email';
        const name = tx.customerName || 'Anonymous Customer';

        // Pre-fill recovery email
        const mailtoSubject = encodeURIComponent('MÈWOS Wear - Complete Your Luxury Order');
        const mailtoBody = encodeURIComponent(
            `Dear ${name},\n\nWe noticed your recent payment of ₹${amtStr} on MEWOS Wear was not completed due to: "${reason}".\n\nIf you experienced any network interruption or bank verification timeout, our client support team is here to help you complete your order smoothly.\n\nWarm regards,\nMÈWOS Concierge`
        );
        const mailtoLink = `mailto:${encodeURIComponent(email)}?subject=${mailtoSubject}&body=${mailtoBody}`;

        return `
            <tr>
                <td>
                    <div style="font-weight:600; color:#fff; font-family:monospace; font-size:0.85rem;">${escapeHtml(txId)}</div>
                    <div style="font-size:0.75rem; color:#888;">${dateStr}</div>
                </td>
                <td>
                    <div style="font-weight:500; color:#fff;">${escapeHtml(name)}</div>
                    <div style="font-size:0.75rem; color:#888;">${escapeHtml(email)}</div>
                </td>
                <td>
                    <div style="font-weight:600; color:#f87171;">₹${amtStr}</div>
                    <div style="font-size:0.72rem; color:#888;">Attempted</div>
                </td>
                <td>
                    <span class="badge" style="background:rgba(220,53,69,0.15); color:#ff6b6b; border:1px solid rgba(220,53,69,0.3);">
                        <i class="fa-solid fa-credit-card"></i> ${escapeHtml(tx.gateway || 'Razorpay')}
                    </span>
                </td>
                <td>
                    <div style="color:#fca5a5; font-size:0.85rem; font-weight:500;">
                        <i class="fa-solid fa-circle-exclamation"></i> ${escapeHtml(reason)}
                    </div>
                    ${tx.error_code ? `<div style="font-size:0.72rem; font-family:monospace; color:#888;">Code: ${escapeHtml(tx.error_code)}</div>` : ''}
                </td>
                <td>
                    <a href="${mailtoLink}" class="btn-table-action" style="text-decoration:none; display:inline-flex; align-items:center; gap:0.4rem; background:#d4af37; color:#111; font-weight:600;">
                        <i class="fa-solid fa-paper-plane"></i> Recover Order
                    </a>
                </td>
            </tr>
        `;
    }).join('');
}

// ==========================================================================
// UI Helpers & Utilities
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
    const sizesError = document.getElementById('prod-sizes-error');
    if (sizesError) sizesError.style.display = 'none';
}

function invalidateField(inputElement, errorMessage) {
    const formGroup = inputElement.closest('.form-group');
    if (formGroup) {
        formGroup.classList.add('invalid');
        const errorSpan = formGroup.querySelector('.error-msg');
        if (errorSpan) {
            errorSpan.textContent = errorMessage;
        }
    }
}

function showToast(message, iconClass = "fa-solid fa-circle-check") {
    if (!toast || !toastMessage || !toastIcon) return;
    toastMessage.textContent = message;
    toastIcon.className = `toast-icon ${iconClass}`;
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3500);
}

function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function getInitials(name) {
    if (!name) return 'CU';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatDate(dateInput) {
    if (!dateInput) return 'N/A';
    try {
        const d = new Date(dateInput);
        if (isNaN(d.getTime())) return String(dateInput);
        return d.toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (e) {
        return String(dateInput);
    }
}

function extractCity(address) {
    if (!address) return '';
    const parts = address.split(',').map(p => p.trim());
    if (parts.length >= 2) {
        // Return 2nd to last part or city
        return parts[parts.length - 2] || parts[parts.length - 1];
    }
    return parts[0] || '';
}
