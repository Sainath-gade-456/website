require('dotenv').config();
const crypto = require('crypto');
const { applicationDefault, cert, getApps, initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const Razorpay = require('razorpay');
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DROPSHIPPING_PROVIDER = (process.env.DROPSHIPPING_PROVIDER || (process.env.NODE_ENV === 'production' ? 'cj' : 'mock')).toLowerCase();
const ORDER_STORAGE = (process.env.ORDER_STORAGE || 'firestore').toLowerCase();
const ROOT_DIR = __dirname;
const DATA_DIR = path.join(ROOT_DIR, 'data');
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');
const LOG_FILE = path.join(DATA_DIR, 'dropshipping-log.json');
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || '';
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || '';
const razorpayClient = RAZORPAY_KEY_ID && RAZORPAY_KEY_SECRET
  ? new Razorpay({ key_id: RAZORPAY_KEY_ID, key_secret: RAZORPAY_KEY_SECRET })
  : null;

let firestore = null;

function initializeFirestore() {
  if (ORDER_STORAGE === 'local') return;

  try {
    const hasCredentialSource = Boolean(
      process.env.FIREBASE_SERVICE_ACCOUNT_JSON ||
      process.env.GOOGLE_APPLICATION_CREDENTIALS ||
      process.env.GOOGLE_CLOUD_PROJECT ||
      process.env.K_SERVICE
    );
    if (!hasCredentialSource) {
      throw new Error('No Firebase Admin credential source configured');
    }

    if (!getApps().length) {
      const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
      if (serviceAccountJson) {
        initializeApp({
          credential: cert(JSON.parse(serviceAccountJson))
        });
      } else {
        initializeApp({ credential: applicationDefault() });
      }
    }
    firestore = getFirestore();
  } catch (error) {
    console.error('Firestore initialization failed:', error.message);
  }
}

// In-memory cache for CJ access token
let cjTokenCache = {
  token: null,
  expiresAt: 0
};

async function getCJAccessToken() {
  const base = process.env.DROPSHIPPING_API_URL;
  const apiKey = process.env.DROPSHIPPING_API_KEY;
  if (!base || !apiKey) {
    throw new Error('DROPSHIPPING_API_URL or DROPSHIPPING_API_KEY not configured');
  }

  if (cjTokenCache.token && Date.now() < cjTokenCache.expiresAt - 60000) {
    return cjTokenCache.token;
  }

  const authUrl = base.replace(/\/+$/,'') + '/authentication/getAccessToken';

  try {
    const resp = await fetch(authUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ apiKey })
    });

    if (!resp.ok) {
      const txt = await resp.text().catch(() => '');
      throw new Error(`Auth endpoint returned ${resp.status} ${txt}`);
    }

    const data = await resp.json().catch(() => ({}));
    // Accept multiple possible field names for token/expiry
    const token = data.accessToken || data.access_token || data.token || data.data?.accessToken || data.data?.access_token;
    const expiresIn = data.expires_in || data.expiresIn || data.data?.expires_in || 3600;
    if (!token) throw new Error('Authentication response did not include an access token');

    cjTokenCache.token = token;
    cjTokenCache.expiresAt = Date.now() + (Number(expiresIn) * 1000);
    return token;
  } catch (err) {
    throw new Error('Failed to retrieve CJ access token: ' + err.message);
  }
}

function ensureDataFiles() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(ORDERS_FILE)) {
    fs.writeFileSync(ORDERS_FILE, '[]', 'utf8');
  }

  if (!fs.existsSync(LOG_FILE)) {
    fs.writeFileSync(LOG_FILE, '[]', 'utf8');
  }
}

function readJson(filePath, fallback = []) {
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    return raw ? JSON.parse(raw) : fallback;
  } catch (error) {
    return fallback;
  }
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

function generateTrackingNumber() {
  return 'TRK-' + Math.random().toString(36).slice(2, 10).toUpperCase();
}

function generateSupplierOrderId() {
  return 'DSP-' + Date.now();
}

function buildSupplierPayload(orderPayload, provider) {
  const customerName = orderPayload.customerName || orderPayload.name || 'Customer';
  const addressParts = (orderPayload.shippingAddress || '').split(',');

  switch (provider) {
    case 'cj':
      // CJ Open Platform expects an order object with consignee and order items.
      return {
        shop_order_no: orderPayload.orderId,
        consignee: {
          name: customerName,
          phone: orderPayload.customerPhone || '',
          country: 'IN',
          province: (addressParts[1] || '').trim(),
          city: (addressParts[0] || '').trim(),
          address: orderPayload.shippingAddress || '',
          postCode: (addressParts[2] || '').trim()
        },
        items: (orderPayload.items || []).map((item) => ({
          // CJ accepts SKU/product identifiers; include both id and name to be safe
          sku: item.sku || item.id || String(item.id),
          name: item.name || '',
          qty: item.quantity || 1,
          price: (item.price || 0) / 100 // convert paise to currency units if frontend uses cents
        })),
        remark: orderPayload.remark || '',
        source: 'mewos-website'
      };

    case 'spocket':
      return {
        order: {
          external_order_id: orderPayload.orderId,
          customer: {
            name: customerName,
            email: orderPayload.customerEmail || '',
            phone: orderPayload.customerPhone || ''
          },
          shipping_address: {
            address1: orderPayload.shippingAddress || '',
            country: 'IN'
          },
          line_items: (orderPayload.items || []).map((item) => ({
            product_id: item.id,
            variant_id: item.size || 'default',
            quantity: item.quantity || 1
          }))
        }
      };

    default:
      return {
        ...orderPayload,
        provider
      };
  }
}

async function forwardToSupplier(orderPayload) {
  const supplierApiUrl = process.env.DROPSHIPPING_API_URL;
  if (DROPSHIPPING_PROVIDER === 'mock' && !supplierApiUrl) {
    return {
      status: 'mock-accepted',
      trackingNumber: orderPayload.trackingNumber,
      supplierOrderId: orderPayload.supplierOrderId,
      note: 'No supplier API configured. Using local mock fulfillment.'
    };
  }

  if (!supplierApiUrl) {
    throw new Error(`DROPSHIPPING_API_URL is required for provider ${DROPSHIPPING_PROVIDER}`);
  }

  try {
    const payload = buildSupplierPayload(orderPayload, DROPSHIPPING_PROVIDER);

    // Build flexible headers. CJ's Open Platform may require a bearer token or custom headers.
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'User-Agent': 'Mewos-Backend/1.0'
    };

    // Provider-specific auth: CJ uses a temporary access token obtained from /authentication/getAccessToken
    if (DROPSHIPPING_PROVIDER === 'cj') {
      const token = await getCJAccessToken();
      headers['CJ-Access-Token'] = token;
    } else {
      if (process.env.DROPSHIPPING_API_KEY) headers['Authorization'] = `Bearer ${process.env.DROPSHIPPING_API_KEY}`;
      if (process.env.DROPSHIPPING_API_SECRET) headers['X-API-SECRET'] = process.env.DROPSHIPPING_API_SECRET;
    }

    const response = await fetch(supplierApiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const txt = await response.text().catch(() => '');
      throw new Error(`Supplier API returned ${response.status} ${txt}`);
    }

    const data = await response.json().catch(() => ({}));
    return {
      status: data.status || data.order_status || 'accepted',
      trackingNumber: data.trackingNumber || data.tracking_number || orderPayload.trackingNumber,
      supplierOrderId: data.supplierOrderId || data.order_id || orderPayload.supplierOrderId,
      note: data.note || data.message || 'Supplier accepted the order.'
    };
  } catch (error) {
    throw new Error(`Supplier order failed: ${error.message}`);
  }
}

function ensureStorageReady() {
  if (ORDER_STORAGE === 'local') {
    ensureDataFiles();
    return true;
  }
  return Boolean(firestore);
}

async function persistOrder(orderRecord) {
  if (ORDER_STORAGE === 'local') {
    const orders = readJson(ORDERS_FILE, []);
    orders.unshift(orderRecord);
    writeJson(ORDERS_FILE, orders);
    return;
  }

  await firestore.collection('orders').doc(orderRecord.orderId).set(orderRecord);
}

async function persistOrderLog(orderRecord) {
  const logRecord = {
    orderId: orderRecord.orderId,
    supplierOrderId: orderRecord.supplierOrderId,
    trackingNumber: orderRecord.trackingNumber,
    createdAt: orderRecord.createdAt,
    supplierStatus: orderRecord.supplierStatus,
    note: orderRecord.supplierNote
  };

  if (ORDER_STORAGE === 'local') {
    const logs = readJson(LOG_FILE, []);
    logs.unshift(logRecord);
    writeJson(LOG_FILE, logs);
    return;
  }

  await firestore.collection('dropshippingLogs').doc(orderRecord.orderId).set(logRecord);
}

initializeFirestore();
if (!ensureStorageReady()) {
  console.warn('Order storage is not ready. Set Firebase Admin credentials or use ORDER_STORAGE=local for development.');
}

app.use(cors());
app.use(express.json({ limit: '5mb' }));
app.use(express.static(ROOT_DIR));

app.get('/api/health', (req, res) => {
  const storageReady = ensureStorageReady();
  res.status(storageReady ? 200 : 503).json({
    ok: storageReady,
    service: 'mewos-dropshipping-backend',
    orderStorage: ORDER_STORAGE,
    supplierProvider: DROPSHIPPING_PROVIDER,
    paymentsConfigured: Boolean(razorpayClient)
  });
});

app.post('/api/payment/create-order', async (req, res) => {
  if (!razorpayClient) {
    return res.status(503).json({ ok: false, message: 'Online payments are not configured.' });
  }

  const amount = Number(req.body?.amount);
  const orderId = String(req.body?.orderId || '');
  if (!Number.isFinite(amount) || amount <= 0 || !orderId) {
    return res.status(400).json({ ok: false, message: 'A valid payment amount and order ID are required.' });
  }

  try {
    const paymentOrder = await razorpayClient.orders.create({
      amount: Math.round(amount * 100),
      currency: 'INR',
      receipt: orderId,
      notes: { source: 'mewos-website' }
    });

    return res.json({
      ok: true,
      keyId: RAZORPAY_KEY_ID,
      razorpayOrderId: paymentOrder.id,
      amount: paymentOrder.amount,
      currency: paymentOrder.currency
    });
  } catch (error) {
    console.error('Razorpay order creation failed:', error.message);
    return res.status(502).json({ ok: false, message: 'Unable to start online payment.' });
  }
});

async function verifyRazorpayPayment(order) {
  if (order.paymentMethod === 'cod') return;
  if (!razorpayClient || !order.razorpayPaymentId || !order.razorpayOrderId || !order.razorpaySignature) {
    throw new Error('Online payment verification details are incomplete');
  }

  const signaturePayload = `${order.razorpayOrderId}|${order.razorpayPaymentId}`;
  const expectedSignature = crypto
    .createHmac('sha256', RAZORPAY_KEY_SECRET)
    .update(signaturePayload)
    .digest('hex');
  const signaturesMatch = crypto.timingSafeEqual(
    Buffer.from(expectedSignature),
    Buffer.from(order.razorpaySignature)
  );
  if (!signaturesMatch) throw new Error('Online payment signature is invalid');

  const payment = await razorpayClient.payments.fetch(order.razorpayPaymentId);
  if (payment.order_id !== order.razorpayOrderId || payment.status !== 'captured') {
    throw new Error('Online payment has not been captured');
  }
  if (Number(payment.amount) !== Math.round(Number(order.subtotal) * 100)) {
    throw new Error('Online payment amount does not match the order');
  }
}

app.post('/api/create-order', async (req, res) => {
  try {
    if (!ensureStorageReady()) {
      return res.status(503).json({ ok: false, message: 'Order storage is not configured.' });
    }

    const order = req.body || {};

    const requiredFields = ['name', 'email', 'phone', 'address', 'items'];
    const missingField = requiredFields.find((field) => !order[field]);

    if (missingField) {
      return res.status(400).json({
        ok: false,
        message: `Missing required field: ${missingField}`
      });
    }

    if (!Array.isArray(order.items) || order.items.length === 0) {
      return res.status(400).json({
        ok: false,
        message: 'Order must include at least one item.'
      });
    }

    const orderId = order.orderId || `MEW-${Date.now()}`;
    const supplierOrderId = generateSupplierOrderId();
    const trackingNumber = generateTrackingNumber();

    const orderRecord = {
      orderId,
      customerName: order.name,
      customerEmail: order.email,
      customerPhone: order.phone,
      shippingAddress: order.address,
      paymentMethod: order.paymentMethod || 'cod',
      subtotal: Number(order.subtotal || 0),
      items: order.items,
      status: 'placed',
      supplierOrderId,
      trackingNumber,
      createdAt: new Date().toISOString(),
      supplierStatus: 'pending'
    };

    try {
      await verifyRazorpayPayment(order);
    } catch (error) {
      console.error('Online payment verification failed:', error.message);
      return res.status(400).json({ ok: false, message: 'Payment verification failed. No order was placed.' });
    }
    orderRecord.paymentStatus = order.paymentMethod === 'cod' ? 'pending' : 'captured';

    let supplierResult;
    try {
      supplierResult = await forwardToSupplier(orderRecord);
    } catch (error) {
      console.error('Supplier fulfillment unavailable:', error.message);
      return res.status(502).json({
        ok: false,
        message: 'Supplier fulfillment is unavailable. Please try again later.'
      });
    }

    orderRecord.supplierOrderId = supplierResult.supplierOrderId || supplierOrderId;
    orderRecord.trackingNumber = supplierResult.trackingNumber || trackingNumber;
    orderRecord.supplierStatus = supplierResult.status || 'pending';
    orderRecord.supplierNote = supplierResult.note || 'Supplier accepted the order.';

    await persistOrder(orderRecord);
    await persistOrderLog(orderRecord);

    return res.status(200).json({
      ok: true,
      orderId: orderRecord.orderId,
      supplierOrderId: orderRecord.supplierOrderId,
      trackingNumber: orderRecord.trackingNumber,
      status: 'placed',
      message: 'Dropshipping order created successfully.'
    });
  } catch (error) {
    console.error('Failed to create dropshipping order:', error);
    return res.status(500).json({
      ok: false,
      message: 'Internal server error while processing the order.'
    });
  }
});

// Lightweight connectivity test for CJ / supplier API. Returns reachable=true if the configured
// DROPSHIPPING_API_URL responds. Useful to verify credentials before running live orders.
app.get('/api/cj-test', async (req, res) => {
  const supplierApiUrl = process.env.DROPSHIPPING_API_URL;
  if (!supplierApiUrl) return res.status(400).json({ ok: false, message: 'DROPSHIPPING_API_URL not configured' });

  try {
    const headers = {
      'Accept': 'application/json',
      ...(process.env.DROPSHIPPING_API_KEY ? { Authorization: `Bearer ${process.env.DROPSHIPPING_API_KEY}` } : {})
    };
    const r = await fetch(supplierApiUrl, { method: 'OPTIONS', headers });
    return res.json({ ok: true, reachable: r.ok, status: r.status });
  } catch (err) {
    return res.status(500).json({ ok: false, message: err.message });
  }
});

// Endpoint to force fetching CJ access token and show its status
app.get('/api/cj-auth', async (req, res) => {
  try {
    const token = await getCJAccessToken();
    return res.json({ ok: true, hasToken: !!token, tokenPreview: token ? token.substring(0, 8) + '...' : null });
  } catch (err) {
    return res.status(500).json({ ok: false, message: err.message });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(ROOT_DIR, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`MÈWOS backend running at http://localhost:${PORT}`);
});
