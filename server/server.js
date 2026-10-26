require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const crypto = require('crypto');
const {
  queryGet,
  queryAll,
  queryRun,
  verifyPassword,
  initDatabase,
} = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';
const SESSION_SECRET = process.env.SESSION_SECRET || 'mosladar-secret-salt-2026-supersecure';

// Simple in-memory session store mapped to user
const activeSessions = new Map();

// Helper to sign session IDs
function createSession(userId, username, role) {
  const sessionId = crypto.randomBytes(32).toString('hex');
  const sessionData = {
    userId,
    username,
    role,
    createdAt: Date.now(),
    expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
  };
  activeSessions.set(sessionId, sessionData);
  return sessionId;
}

function authMiddleware(req, res, next) {
  const token = req.cookies?.mosladar_admin_session || req.headers['x-admin-token'];
  if (!token || !activeSessions.has(token)) {
    return res.status(401).json({ error: 'Unauthorized: Admin session required' });
  }
  const session = activeSessions.get(token);
  if (Date.now() > session.expiresAt) {
    activeSessions.delete(token);
    return res.status(401).json({ error: 'Session expired' });
  }
  req.admin = session;
  next();
}

app.use(cors());
app.use(express.json());
app.use(cookieParser());

// Serve static assets
app.use('/assets', express.static(path.join(__dirname, '..', 'public', 'assets')));
app.use(express.static(path.join(__dirname, '..', 'public')));

// Admin portal page route
app.get(['/admin', '/admin.html'], (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'admin.html'));
});

// ----------------------------------------------------
// Public Store API Endpoints
// ----------------------------------------------------

// 1. Get all products with variants
app.get('/api/products', async (req, res) => {
  try {
    const products = await queryAll(`
      SELECT p.* FROM products p
      WHERE p.is_active = 1
      ORDER BY p.is_featured DESC, p.id ASC;
    `);

    const variants = await queryAll(`
      SELECT * FROM product_variants
      WHERE is_active = 1
      ORDER BY weight_grams ASC;
    `);

    // Group variants by product_id
    const variantsByProduct = {};
    for (const v of variants) {
      if (!variantsByProduct[v.product_id]) {
        variantsByProduct[v.product_id] = [];
      }
      variantsByProduct[v.product_id].push(v);
    }

    const fullProducts = products.map((p) => ({
      ...p,
      variants: variantsByProduct[p.id] || [],
    }));

    res.json(fullProducts);
  } catch (err) {
    console.error('Error fetching products:', err);
    res.status(500).json({ error: 'Failed to load products' });
  }
});

// 2. Get single product by slug
app.get('/api/products/:slug', async (req, res) => {
  try {
    const product = await queryGet('SELECT * FROM products WHERE slug = ? AND is_active = 1;', [req.params.slug]);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    const variants = await queryAll('SELECT * FROM product_variants WHERE product_id = ? AND is_active = 1 ORDER BY weight_grams ASC;', [product.id]);
    res.json({ ...product, variants });
  } catch (err) {
    console.error('Error fetching product:', err);
    res.status(500).json({ error: 'Failed to load product' });
  }
});

// 3. Store settings (fees, contact, addresses)
app.get('/api/settings', async (req, res) => {
  try {
    const rows = await queryAll('SELECT key, value FROM store_settings;');
    const settings = {};
    for (const r of rows) {
      settings[r.key] = r.value;
    }
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load settings' });
  }
});

// 4. Checkout Order Creation (Server-side validation, price snapshot, stock decrement)
app.post('/api/checkout', async (req, res) => {
  try {
    const {
      customer_name,
      customer_phone,
      customer_email,
      delivery_address,
      delivery_zone,
      payment_method,
      order_notes,
      items,
    } = req.body;

    // Strict Validation
    if (!customer_name || customer_name.trim().length < 2) {
      return res.status(400).json({ error: 'দয়া করে আপনার পূর্ণ নাম লিখুন (Please enter full name).' });
    }

    // Validate BD Phone Number: 11 digits starting with 01
    const cleanPhone = (customer_phone || '').replace(/[\s\-\+]/g, '');
    const bdPhoneRegex = /^(?:8801|01)[3-9]\d{8}$/;
    if (!bdPhoneRegex.test(cleanPhone)) {
      return res.status(400).json({ error: 'সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন (Valid 11-digit BD phone required, e.g., 01753028052).' });
    }
    const normalizedPhone = cleanPhone.startsWith('8801') ? cleanPhone.slice(2) : cleanPhone;

    if (!delivery_address || delivery_address.trim().length < 5) {
      return res.status(400).json({ error: 'সম্পূর্ণ ডেলিভারি ঠিকানা প্রদান করুন (Please provide full delivery address).' });
    }

    if (!['inside_dhaka', 'outside_dhaka'].includes(delivery_zone)) {
      return res.status(400).json({ error: 'ডেলিভারি এলাকা নির্বাচন করুন (Select valid delivery zone).' });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'আপনার কার্ট খালি (Your shopping cart is empty).' });
    }

    // Server-calculated delivery fee
    const delivery_fee = delivery_zone === 'inside_dhaka' ? 70 : 150;

    // Validate each item against database price & stock
    let subtotal = 0;
    const validatedItems = [];

    for (const item of items) {
      const variant = await queryGet(`
        SELECT v.*, p.name_bn, p.name_en, p.slug
        FROM product_variants v
        JOIN products p ON v.product_id = p.id
        WHERE v.id = ? AND v.is_active = 1 AND p.is_active = 1;
      `, [item.variant_id]);

      if (!variant) {
        return res.status(400).json({ error: `অকার্যকর পণ্য ভ্যারিয়েন্ট (Invalid variant ID: ${item.variant_id})` });
      }

      const qty = parseInt(item.quantity, 10);
      if (isNaN(qty) || qty <= 0) {
        return res.status(400).json({ error: 'পণ্যের সংখ্যা সঠিক নয় (Invalid item quantity).' });
      }

      if (variant.stock < qty) {
        return res.status(400).json({
          error: `দুঃখিত, "${variant.name_bn} (${variant.weight_label})" পণ্যের স্টক অবশিষ্ট আছে মাত্র ${variant.stock} টি।`,
        });
      }

      const lineTotal = variant.price * qty;
      subtotal += lineTotal;

      validatedItems.push({
        product_id: variant.product_id,
        variant_id: variant.id,
        name_bn: variant.name_bn,
        name_en: variant.name_en,
        weight_label: variant.weight_label,
        unit_price: variant.price, // Server verified price!
        quantity: qty,
        line_total: lineTotal,
        current_stock: variant.stock,
      });
    }

    const total_amount = subtotal + delivery_fee;

    // Generate unique order code: MSL-YYYY-RANDOM
    const order_code = `MSL-${new Date().getFullYear()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

    // Payment validation
    const validPaymentMethods = ['cod', 'bkash', 'nagad', 'rocket', 'card', 'bank'];
    const chosenPayment = validPaymentMethods.includes(payment_method) ? payment_method : 'cod';
    const initialPaymentStatus = chosenPayment === 'cod' ? 'unpaid' : 'pending_verification';

    // Atomic Order Creation Transaction
    await queryRun('BEGIN TRANSACTION;');

    try {
      // 1. Insert order
      const orderRes = await queryRun(`
        INSERT INTO orders (
          order_code, customer_name, customer_phone, customer_email,
          delivery_address, delivery_zone, delivery_fee, subtotal, total_amount,
          payment_method, payment_status, order_status, order_notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?);
      `, [
        order_code,
        customer_name.trim(),
        normalizedPhone,
        customer_email ? customer_email.trim() : null,
        delivery_address.trim(),
        delivery_zone,
        delivery_fee,
        subtotal,
        total_amount,
        chosenPayment,
        initialPaymentStatus,
        order_notes ? order_notes.trim() : null,
      ]);

      const orderId = orderRes.lastID;

      // 2. Insert order items with snapshots and decrement stock
      for (const vItem of validatedItems) {
        await queryRun(`
          INSERT INTO order_items (
            order_id, product_id, variant_id,
            product_name_bn, product_name_en, weight_label,
            unit_price, quantity, total_price
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
        `, [
          orderId,
          vItem.product_id,
          vItem.variant_id,
          vItem.name_bn,
          vItem.name_en,
          vItem.weight_label,
          vItem.unit_price,
          vItem.quantity,
          vItem.line_total,
        ]);

        const newStock = vItem.current_stock - vItem.quantity;
        await queryRun('UPDATE product_variants SET stock = ? WHERE id = ?;', [newStock, vItem.variant_id]);

        // Record movement
        await queryRun(`
          INSERT INTO inventory_movements (
            variant_id, change_type, quantity, previous_stock, new_stock, reason
          ) VALUES (?, 'order_placed', ?, ?, ?, ?);
        `, [
          vItem.variant_id,
          -vItem.quantity,
          vItem.current_stock,
          newStock,
          `Customer Order ${order_code}`,
        ]);
      }

      // 3. Upsert customer
      await queryRun(`
        INSERT INTO customers (name, phone, email, address, delivery_zone)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(phone) DO UPDATE SET
          name = excluded.name,
          email = coalesce(excluded.email, customers.email),
          address = excluded.address,
          delivery_zone = excluded.delivery_zone;
      `, [
        customer_name.trim(),
        normalizedPhone,
        customer_email ? customer_email.trim() : null,
        delivery_address.trim(),
        delivery_zone,
      ]);

      // 4. Initial status history
      await queryRun(`
        INSERT INTO order_status_history (order_id, previous_status, new_status, comment, created_by)
        VALUES (?, NULL, 'pending', 'Order placed by customer via website', 'customer');
      `, [orderId]);

      // 5. Prepare WhatsApp message payload
      const itemSummaries = validatedItems
        .map((i) => `• ${i.name_bn} (${i.weight_label}) x ${i.quantity} = ৳${i.line_total}`)
        .join('\n');

      const whatsappText = `*মশলাদার (Mosladar) — নতুন অর্ডার*\n\n` +
        `অর্ডার কোড: *${order_code}*\n` +
        `ক্রেতার নাম: ${customer_name.trim()}\n` +
        `মোবাইল: ${normalizedPhone}\n` +
        `ঠিকানা: ${delivery_address.trim()} (${delivery_zone === 'inside_dhaka' ? 'ঢাকার ভেতরে' : 'ঢাকার বাইরে'})\n\n` +
        `*অর্ডারকৃত পণ্যসমূহ:*\n${itemSummaries}\n\n` +
        `পণ্যের মূল্য: ৳${subtotal}\n` +
        `ডেলিভারি চার্জ: ৳${delivery_fee}\n` +
        `*সর্বমোট: ৳${total_amount}*\n` +
        `পেমেন্ট মাধ্যম: ${chosenPayment.toUpperCase()}\n\n` +
        `স্বাদে ঐতিহ্য, মানে আস্থা।`;

      await queryRun(`
        INSERT INTO notifications (order_id, channel, status, recipient, payload)
        VALUES (?, 'whatsapp_manual', 'prepared', '01753028052', ?);
      `, [orderId, whatsappText]);

      await queryRun('COMMIT;');

      res.status(201).json({
        success: true,
        order_code,
        order_id: orderId,
        customer_name: customer_name.trim(),
        customer_phone: normalizedPhone,
        subtotal,
        delivery_fee,
        total_amount,
        payment_method: chosenPayment,
        payment_status: initialPaymentStatus,
        order_status: 'pending',
        whatsapp_text: encodeURIComponent(whatsappText),
      });
    } catch (txErr) {
      await queryRun('ROLLBACK;');
      throw txErr;
    }
  } catch (err) {
    console.error('Checkout error:', err);
    res.status(500).json({ error: err.message || 'অর্ডার সম্পন্ন করতে সমস্যা হয়েছে।' });
  }
});

// 5. Protected Customer Order Tracking (requires Order Code + Phone)
app.post('/api/orders/track', async (req, res) => {
  try {
    const { order_code, phone } = req.body;
    if (!order_code || !phone) {
      return res.status(400).json({ error: 'অর্ডার কোড এবং মোবাইল নম্বর আবশ্যক (Order code & phone required).' });
    }

    const cleanPhone = (phone || '').replace(/[\s\-\+]/g, '');
    const normalizedPhone = cleanPhone.startsWith('8801') ? cleanPhone.slice(2) : cleanPhone;

    const order = await queryGet(`
      SELECT * FROM orders
      WHERE UPPER(order_code) = UPPER(?) AND customer_phone = ?;
    `, [order_code.trim(), normalizedPhone]);

    if (!order) {
      return res.status(404).json({ error: 'কোনো অর্ডার খুঁজে পাওয়া যায়নি। তথ্য যাচাই করে আবার চেষ্টা করুন।' });
    }

    const items = await queryAll('SELECT * FROM order_items WHERE order_id = ?;', [order.id]);
    const history = await queryAll('SELECT * FROM order_status_history WHERE order_id = ? ORDER BY created_at ASC;', [order.id]);

    res.json({
      order_code: order.order_code,
      customer_name: order.customer_name,
      delivery_address: order.delivery_address,
      delivery_zone: order.delivery_zone,
      delivery_fee: order.delivery_fee,
      subtotal: order.subtotal,
      total_amount: order.total_amount,
      payment_method: order.payment_method,
      payment_status: order.payment_status,
      order_status: order.order_status,
      created_at: order.created_at,
      items,
      history,
    });
  } catch (err) {
    console.error('Tracking error:', err);
    res.status(500).json({ error: 'Failed to retrieve order status' });
  }
});

// ----------------------------------------------------
// Admin Authentication & Endpoints (Protected)
// ----------------------------------------------------

// Admin Login
app.post('/api/admin/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    const admin = await queryGet('SELECT * FROM admin_users WHERE username = ?;', [username.trim()]);
    if (!admin || !verifyPassword(password, admin.password_hash, admin.salt)) {
      // Log failed attempt
      await queryRun(`
        INSERT INTO audit_logs (admin_username, action, details, ip_address)
        VALUES (?, 'login_failed', 'Invalid credentials attempt', ?);
      `, [username, req.ip]);
      return res.status(401).json({ error: 'Invalid admin username or password' });
    }

    const sessionToken = createSession(admin.id, admin.username, admin.role);

    // Set HTTP-only cookie
    res.cookie('mosladar_admin_session', sessionToken, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000,
    });

    await queryRun(`
      INSERT INTO audit_logs (admin_username, action, details, ip_address)
      VALUES (?, 'login_success', 'Admin session created', ?);
    `, [admin.username, req.ip]);

    res.json({
      success: true,
      token: sessionToken,
      user: {
        id: admin.id,
        username: admin.username,
        full_name: admin.full_name,
        role: admin.role,
      },
    });
  } catch (err) {
    console.error('Admin login error:', err);
    res.status(500).json({ error: 'Login process error' });
  }
});

// Admin Logout
app.post('/api/admin/logout', (req, res) => {
  const token = req.cookies?.mosladar_admin_session || req.headers['x-admin-token'];
  if (token) {
    activeSessions.delete(token);
  }
  res.clearCookie('mosladar_admin_session');
  res.json({ success: true });
});

// Admin Session Check
app.get('/api/admin/me', authMiddleware, (req, res) => {
  res.json({
    user: {
      userId: req.admin.userId,
      username: req.admin.username,
      role: req.admin.role,
    },
  });
});

// Admin Dashboard Stats
app.get('/api/admin/stats', authMiddleware, async (req, res) => {
  try {
    const totalOrders = await queryGet('SELECT COUNT(*) as cnt FROM orders;');
    const pendingOrders = await queryGet("SELECT COUNT(*) as cnt FROM orders WHERE order_status = 'pending';");
    const totalRevenue = await queryGet("SELECT COALESCE(SUM(total_amount), 0) as rev FROM orders WHERE order_status NOT IN ('cancelled');");
    const lowStockItems = await queryAll('SELECT v.*, p.name_bn, p.name_en FROM product_variants v JOIN products p ON v.product_id = p.id WHERE v.stock < 15;');

    const statusCounts = await queryAll(`
      SELECT order_status, COUNT(*) as count
      FROM orders
      GROUP BY order_status;
    `);

    res.json({
      total_orders: totalOrders.cnt,
      pending_orders: pendingOrders.cnt,
      total_revenue: totalRevenue.rev,
      low_stock_count: lowStockItems.length,
      low_stock_items: lowStockItems,
      status_counts: statusCounts,
    });
  } catch (err) {
    console.error('Stats error:', err);
    res.status(500).json({ error: 'Failed to fetch admin statistics' });
  }
});

// Admin Orders List & Filter
app.get('/api/admin/orders', authMiddleware, async (req, res) => {
  try {
    const { status, search } = req.query;
    let sql = 'SELECT * FROM orders WHERE 1=1';
    const params = [];

    if (status && status !== 'all') {
      sql += ' AND order_status = ?';
      params.push(status);
    }

    if (search) {
      sql += ' AND (order_code LIKE ? OR customer_name LIKE ? OR customer_phone LIKE ?)';
      const s = `%${search.trim()}%`;
      params.push(s, s, s);
    }

    sql += ' ORDER BY created_at DESC LIMIT 100;';

    const orders = await queryAll(sql, params);

    // Fetch items for each order
    for (const ord of orders) {
      ord.items = await queryAll('SELECT * FROM order_items WHERE order_id = ?;', [ord.id]);
    }

    res.json(orders);
  } catch (err) {
    console.error('Admin orders error:', err);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Admin Update Order Status
app.patch('/api/admin/orders/:id/status', authMiddleware, async (req, res) => {
  try {
    const { status, comment, payment_status } = req.body;
    const orderId = req.params.id;

    const currentOrder = await queryGet('SELECT * FROM orders WHERE id = ?;', [orderId]);
    if (!currentOrder) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const updates = [];
    const params = [];

    if (status) {
      updates.push('order_status = ?');
      params.push(status);
    }
    if (payment_status) {
      updates.push('payment_status = ?');
      params.push(payment_status);
    }
    updates.push('updated_at = CURRENT_TIMESTAMP');

    params.push(orderId);

    await queryRun(`UPDATE orders SET ${updates.join(', ')} WHERE id = ?;`, params);

    if (status && status !== currentOrder.order_status) {
      await queryRun(`
        INSERT INTO order_status_history (order_id, previous_status, new_status, comment, created_by)
        VALUES (?, ?, ?, ?, ?);
      `, [
        orderId,
        currentOrder.order_status,
        status,
        comment || `Status updated to ${status} by admin`,
        req.admin.username,
      ]);
    }

    await queryRun(`
      INSERT INTO audit_logs (admin_username, action, details, ip_address)
      VALUES (?, 'update_order_status', ?, ?);
    `, [
      req.admin.username,
      `Order ${currentOrder.order_code} updated to status: ${status || 'unchanged'}, payment: ${payment_status || 'unchanged'}`,
      req.ip,
    ]);

    res.json({ success: true });
  } catch (err) {
    console.error('Status update error:', err);
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

// Admin Products & Stock Update
app.get('/api/admin/products', authMiddleware, async (req, res) => {
  try {
    const products = await queryAll('SELECT * FROM products ORDER BY id ASC;');
    const variants = await queryAll('SELECT * FROM product_variants ORDER BY product_id ASC, weight_grams ASC;');

    const varsByProd = {};
    for (const v of variants) {
      if (!varsByProd[v.product_id]) varsByProd[v.product_id] = [];
      varsByProd[v.product_id].push(v);
    }

    const result = products.map((p) => ({
      ...p,
      variants: varsByProd[p.id] || [],
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Admin Update Variant Price and Stock
app.patch('/api/admin/variants/:id', authMiddleware, async (req, res) => {
  try {
    const variantId = req.params.id;
    const { price, stock, is_active } = req.body;

    const current = await queryGet(`
      SELECT v.*, p.name_bn, p.name_en
      FROM product_variants v
      JOIN products p ON v.product_id = p.id
      WHERE v.id = ?;
    `, [variantId]);

    if (!current) {
      return res.status(404).json({ error: 'Variant not found' });
    }

    const updates = [];
    const params = [];

    if (price !== undefined) {
      const p = parseInt(price, 10);
      if (isNaN(p) || p <= 0) return res.status(400).json({ error: 'Invalid price' });
      updates.push('price = ?');
      params.push(p);
    }

    if (stock !== undefined) {
      const s = parseInt(stock, 10);
      if (isNaN(s) || s < 0) return res.status(400).json({ error: 'Invalid stock' });
      updates.push('stock = ?');
      params.push(s);

      // Record inventory movement
      const diff = s - current.stock;
      if (diff !== 0) {
        await queryRun(`
          INSERT INTO inventory_movements (variant_id, change_type, quantity, previous_stock, new_stock, reason)
          VALUES (?, 'admin_adjustment', ?, ?, ?, ?);
        `, [
          variantId,
          diff,
          current.stock,
          s,
          `Stock adjustment by admin ${req.admin.username}`,
        ]);
      }
    }

    if (is_active !== undefined) {
      updates.push('is_active = ?');
      params.push(is_active ? 1 : 0);
    }

    if (updates.length > 0) {
      params.push(variantId);
      await queryRun(`UPDATE product_variants SET ${updates.join(', ')} WHERE id = ?;`, params);
    }

    await queryRun(`
      INSERT INTO audit_logs (admin_username, action, details, ip_address)
      VALUES (?, 'update_variant', ?, ?);
    `, [
      req.admin.username,
      `Variant ${current.sku} updated: price=${price || current.price}, stock=${stock || current.stock}`,
      req.ip,
    ]);

    res.json({ success: true });
  } catch (err) {
    console.error('Variant update error:', err);
    res.status(500).json({ error: 'Failed to update variant' });
  }
});

// Admin Data Export (JSON Backup)
app.get('/api/admin/export', authMiddleware, async (req, res) => {
  try {
    const products = await queryAll('SELECT * FROM products;');
    const variants = await queryAll('SELECT * FROM product_variants;');
    const orders = await queryAll('SELECT * FROM orders;');
    const orderItems = await queryAll('SELECT * FROM order_items;');
    const customers = await queryAll('SELECT * FROM customers;');
    const movements = await queryAll('SELECT * FROM inventory_movements;');
    const history = await queryAll('SELECT * FROM order_status_history;');

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=mosladar-backup-${Date.now()}.json`);
    res.json({
      exported_at: new Date().toISOString(),
      brand: 'Mosladar (মশলাদার)',
      products,
      variants,
      orders,
      order_items: orderItems,
      customers,
      inventory_movements: movements,
      order_status_history: history,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to export database' });
  }
});

// Fallback to index.html for SPA frontend routing
app.use((req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'Endpoint not found' });
  }
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// Start Server after DB Init
async function startServer() {
  await initDatabase();
  app.listen(PORT, HOST, () => {
    console.log(`Mosladar Production Server running at http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}`);
  });
}

if (require.main === module) {
  startServer().catch((err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
}

module.exports = { app, startServer };
