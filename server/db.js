const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'data', 'mosladar.db');
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new sqlite3.Database(DB_PATH);

// Helper promise methods
const queryGet = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

const queryAll = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows || []);
    });
  });
};

const queryRun = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
};

const hashPassword = (password, salt = crypto.randomBytes(16).toString('hex')) => {
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return { hash, salt };
};

const verifyPassword = (password, hash, salt) => {
  const testHash = crypto.scryptSync(password, salt, 64).toString('hex');
  return testHash === hash;
};

// Initialize schema and seed data
async function initDatabase() {
  await queryRun('PRAGMA journal_mode = WAL;');
  await queryRun('PRAGMA foreign_keys = ON;');

  // 1. Products table
  await queryRun(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT UNIQUE NOT NULL,
      name_bn TEXT NOT NULL,
      name_en TEXT NOT NULL,
      category TEXT NOT NULL, -- 'powder' or 'paste'
      short_desc_bn TEXT NOT NULL,
      short_desc_en TEXT NOT NULL,
      full_desc_bn TEXT NOT NULL,
      full_desc_en TEXT NOT NULL,
      primary_image TEXT NOT NULL,
      lifestyle_image TEXT,
      badge TEXT,
      is_featured INTEGER DEFAULT 1,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 2. Product Variants table (Price, Stock & Weight)
  await queryRun(`
    CREATE TABLE IF NOT EXISTS product_variants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      weight_label TEXT NOT NULL,
      weight_grams INTEGER NOT NULL,
      price INTEGER NOT NULL, -- in BDT (৳)
      stock INTEGER NOT NULL DEFAULT 50, -- explicitly demo stock until owner sync
      sku TEXT UNIQUE NOT NULL,
      is_default INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    );
  `);

  // 3. Customers table
  await queryRun(`
    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT UNIQUE NOT NULL,
      email TEXT,
      address TEXT NOT NULL,
      delivery_zone TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 4. Orders table
  await queryRun(`
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_code TEXT UNIQUE NOT NULL,
      customer_name TEXT NOT NULL,
      customer_phone TEXT NOT NULL,
      customer_email TEXT,
      delivery_address TEXT NOT NULL,
      delivery_zone TEXT NOT NULL, -- 'inside_dhaka' (70) or 'outside_dhaka' (150)
      delivery_fee INTEGER NOT NULL,
      subtotal INTEGER NOT NULL,
      total_amount INTEGER NOT NULL,
      payment_method TEXT NOT NULL, -- 'cod', 'bkash_pending', etc.
      payment_status TEXT NOT NULL DEFAULT 'unpaid', -- 'unpaid', 'pending_verification', 'paid'
      order_status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'
      order_notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 5. Order Items table (Price snapshots preserved forever)
  await queryRun(`
    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      variant_id INTEGER NOT NULL,
      product_name_bn TEXT NOT NULL,
      product_name_en TEXT NOT NULL,
      weight_label TEXT NOT NULL,
      unit_price INTEGER NOT NULL, -- Snapshot price at time of purchase
      quantity INTEGER NOT NULL,
      total_price INTEGER NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id),
      FOREIGN KEY (variant_id) REFERENCES product_variants(id)
    );
  `);

  // 6. Order Status History (Audit trail of fulfillment)
  await queryRun(`
    CREATE TABLE IF NOT EXISTS order_status_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      previous_status TEXT,
      new_status TEXT NOT NULL,
      comment TEXT,
      created_by TEXT DEFAULT 'system',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
    );
  `);

  // 7. Inventory Movements table
  await queryRun(`
    CREATE TABLE IF NOT EXISTS inventory_movements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      variant_id INTEGER NOT NULL,
      change_type TEXT NOT NULL, -- 'order_placed', 'order_cancelled', 'admin_adjustment', 'restock'
      quantity INTEGER NOT NULL,
      previous_stock INTEGER NOT NULL,
      new_stock INTEGER NOT NULL,
      reason TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (variant_id) REFERENCES product_variants(id)
    );
  `);

  // 8. Admin Users table
  await queryRun(`
    CREATE TABLE IF NOT EXISTS admin_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      salt TEXT NOT NULL,
      full_name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'admin', -- 'superadmin', 'admin', 'manager'
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 9. Admin Audit Logs table
  await queryRun(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      admin_username TEXT,
      action TEXT NOT NULL,
      details TEXT,
      ip_address TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 10. Store Settings table
  await queryRun(`
    CREATE TABLE IF NOT EXISTS store_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 11. Notifications table
  await queryRun(`
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      channel TEXT NOT NULL, -- 'whatsapp_manual', 'whatsapp_api', 'email'
      status TEXT NOT NULL, -- 'prepared', 'sent', 'failed'
      recipient TEXT NOT NULL,
      payload TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
    );
  `);

  // Seed default store settings if not present
  const defaultSettings = [
    ['brand_name_bn', 'মশলাদার'],
    ['brand_name_en', 'Mosladar'],
    ['brand_slogan_bn', 'স্বাদে ঐতিহ্য, মানে আস্থা'],
    ['delivery_fee_dhaka', '70'],
    ['delivery_fee_outside_dhaka', '150'],
    ['contact_phone', '01753028052'],
    ['contact_whatsapp', '01753028052'],
    ['contact_email', 'mosladarspices@gmail.com'],
    ['business_address', 'Aukhpara, Ashulia, Savar, Bangladesh'],
    ['facebook_url', 'https://www.facebook.com/share/1FPCTCY2qJ/'],
    ['instagram_url', 'https://www.instagram.com/mosladar?vrfl=MTZvcmd3MGJobWdraw=='],
  ];

  for (const [k, v] of defaultSettings) {
    await queryRun(
      'INSERT OR IGNORE INTO store_settings (key, value) VALUES (?, ?);',
      [k, v]
    );
  }

  // Seed default admin user if not present
  const existingAdmin = await queryGet('SELECT * FROM admin_users WHERE username = ?;', ['admin']);
  if (!existingAdmin) {
    const adminPass = process.env.ADMIN_PASSWORD || 'Mosladar@Admin2026!';
    const { hash, salt } = hashPassword(adminPass);
    await queryRun(
      `INSERT INTO admin_users (username, password_hash, salt, full_name, role)
       VALUES (?, ?, ?, ?, ?);`,
      ['admin', hash, salt, 'Mosladar Administrator', 'superadmin']
    );
    console.log('[DB] Seeded initial admin account: username: admin');
  }

  // Seed 7 Products and 11 Variants
  const productCount = await queryGet('SELECT COUNT(*) as cnt FROM products;');
  if (productCount.cnt === 0) {
    console.log('[DB] Seeding 7 products and 11 variants...');

    const productsData = [
      {
        slug: 'chili-powder',
        name_bn: 'মরিচ গুঁড়া',
        name_en: 'Chili Powder',
        category: 'powder',
        short_desc_bn: 'তীব্র ঝাঁঝ ও প্রাকৃতিক লাল রঙের খাঁটি দেশি মরিচ গুঁড়া।',
        short_desc_en: 'Premium sun-dried red chili powder offering rich natural color and authentic heat.',
        full_desc_bn: 'মশলাদার মরিচ গুঁড়া বাছাইকৃত সেরা মানের লাল মরিচ থেকে আধুনিক ও স্বাস্থ্যসম্মত উপায়ে প্রস্তুত। রান্নায় আনে ঐতিহ্যবাহী দেশি স্বাদ ও লোভনীয় প্রাকৃতিক বর্ণ। কোনো প্রকার কৃত্রিম রঙ বা ভেজাল মুক্ত।',
        full_desc_en: 'Mosladar Chili Powder is prepared from carefully graded red chilies, ground to perfection. Enhances everyday Bangladeshi culinary dishes with rich color and balanced heat without artificial coloring.',
        primary_image: '/assets/products/approved/chili-powder-100g.webp',
        lifestyle_image: null,
        badge: 'জনপ্রিয়',
        is_featured: 1,
        variants: [
          { weight_label: '50g', weight_grams: 50, price: 40, sku: 'MSL-CP-50G', is_default: 0 },
          { weight_label: '100g', weight_grams: 100, price: 70, sku: 'MSL-CP-100G', is_default: 1 },
        ]
      },
      {
        slug: 'turmeric-powder',
        name_bn: 'হলুদ গুঁড়া',
        name_en: 'Turmeric Powder',
        category: 'powder',
        short_desc_bn: 'উজ্জ্বল সোনালী বর্ণ ও প্রাকৃ্তিক সুবাসযুক্ত খাঁটি হলুদ গুঁড়া।',
        short_desc_en: 'Aromatic, golden-yellow turmeric powder ground from premium dried roots.',
        full_desc_bn: 'উচ্চমানের দেশি হলুদের মূল থেকে পরিচ্ছন্ন পরিবেশে প্রক্রিয়াজাত মশলাদার হলুদ গুঁড়া। রান্নায় নিশ্চিত করে মনোমুগ্ধকর সোনালী রঙ ও খাঁটি সুবাস।',
        full_desc_en: 'Mosladar Turmeric Powder is milled from premium sun-dried whole turmeric roots. Adds rich golden color and earthy aroma to daily curries and traditional delicacies.',
        primary_image: '/assets/products/approved/turmeric-powder-100g.webp',
        lifestyle_image: null,
        badge: 'সেরা মান',
        is_featured: 1,
        variants: [
          { weight_label: '50g', weight_grams: 50, price: 40, sku: 'MSL-TP-50G', is_default: 0 },
          { weight_label: '100g', weight_grams: 100, price: 65, sku: 'MSL-TP-100G', is_default: 1 },
        ]
      },
      {
        slug: 'coriander-powder',
        name_bn: 'ধনিয়া গুঁড়া',
        name_en: 'Coriander Powder',
        category: 'powder',
        short_desc_bn: 'মিষ্টি সুবাস ও ভেষজ গুণসম্পন্ন তাজা ধনিয়া গুঁড়া।',
        short_desc_en: 'Fragrant, finely milled coriander powder providing gentle warmth and depth.',
        full_desc_bn: 'পরিপক্ব ধনিয়া বীজ রোদে শুকিয়ে পরিচ্ছন্নভাবে পেষণকৃত মশলাদার ধনিয়া গুঁড়া। রান্নার ঝোলে আনে চমৎকার ঘন ঘন ভাব ও মিষ্টি প্রাকৃতিক সুঘ্রাণ।',
        full_desc_en: 'Mosladar Coriander Powder is produced from selected dry whole coriander seeds. Delivers classic warmth and fragrant notes to meat, fish, and lentil curries.',
        primary_image: '/assets/products/approved/coriander-powder-100g.webp',
        lifestyle_image: null,
        badge: null,
        is_featured: 1,
        variants: [
          { weight_label: '50g', weight_grams: 50, price: 32, sku: 'MSL-DP-50G', is_default: 0 },
          { weight_label: '100g', weight_grams: 100, price: 60, sku: 'MSL-DP-100G', is_default: 1 },
        ]
      },
      {
        slug: 'cumin-powder',
        name_bn: 'জিরা গুঁড়া',
        name_en: 'Cumin Powder',
        category: 'powder',
        short_desc_bn: 'বিশেষ রোস্টেড সুবাস ও তীব্র রাজকীয় স্বাদের জিরা গুঁড়া।',
        short_desc_en: 'Deeply aromatic roasted cumin powder with warm, nutty undertones.',
        full_desc_bn: 'সেরা জাতের জিরা পরিমিত রোস্টিংয়ের মাধ্যমে প্রস্তুত মশলাদার জিরা গুঁড়া। এর মনোলোভা সুবাস যে কোনো সাধারণ খাবারকে করে তোলে অতুলনীয় তৃপ্তিদায়ক।',
        full_desc_en: 'Mosladar Cumin Powder is crafted from carefully roasted whole cumin seeds. Provides an unmistakable warm, nutty aroma for roast, rezala, and everyday curries.',
        primary_image: '/assets/products/approved/cumin-powder-100g.webp',
        lifestyle_image: null,
        badge: 'স্পেশাল',
        is_featured: 1,
        variants: [
          { weight_label: '50g', weight_grams: 50, price: 80, sku: 'MSL-JP-50G', is_default: 0 },
          { weight_label: '100g', weight_grams: 100, price: 140, sku: 'MSL-JP-100G', is_default: 1 },
        ]
      },
      {
        slug: 'ginger-paste',
        name_bn: 'আদা বাটা',
        name_en: 'Ginger Paste',
        category: 'paste',
        short_desc_bn: 'তাজা ছাল ছাড়ানো আদা থেকে প্রস্তুত মসৃণ আদা বাটা।',
        short_desc_en: 'Smooth, ready-to-use fresh ginger paste preserving sharp aroma and zest.',
        full_desc_bn: 'তাজা দেশি আদা পরিষ্কার করে স্বাস্থ্যসম্মত আধুনিক প্রযুক্তিতে বাটা। রান্নার সময় ও পরিশ্রম বাঁচিয়ে নিশ্চিত করে ঘরে বাটা আদার আসল স্বাদ ও গন্ধ।',
        full_desc_en: 'Mosladar Ginger Paste is prepared from peeled fresh ginger roots. Delivers authentic homemade aroma and taste, ready for your curries, marinades, and roasts.',
        primary_image: '/assets/products/approved/ginger-paste-250g.webp',
        lifestyle_image: null,
        badge: 'তাজা বাটা',
        is_featured: 1,
        variants: [
          { weight_label: '250g', weight_grams: 250, price: 90, sku: 'MSL-GP-250G', is_default: 1 },
        ]
      },
      {
        slug: 'garlic-paste',
        name_bn: 'রসুন বাটা',
        name_en: 'Garlic Paste',
        category: 'paste',
        short_desc_bn: 'বাছাইকৃত রসুনের কোয়া থেকে তৈরি তীব্র সুবাসিত রসুন বাটা।',
        short_desc_en: 'Rich and pungent fresh garlic paste ground to a silky texture.',
        full_desc_bn: 'তাজা রসুনের কোয়া থেকে নিখুঁতভাবে বাটা মশলাদার রসুন বাটা। মাংস, মাছ বা সবজি রান্নায় দেয় পরিপূর্ণ গন্ধ ও পুষ্টিকর স্বাদ।',
        full_desc_en: 'Mosladar Garlic Paste is milled from plump garlic cloves to a velvety consistency. Saves prep time while giving curries rich depth and savory balance.',
        primary_image: '/assets/products/approved/garlic-paste-250g.webp',
        lifestyle_image: null,
        badge: 'তাজা বাটা',
        is_featured: 1,
        variants: [
          { weight_label: '250g', weight_grams: 250, price: 70, sku: 'MSL-GLP-250G', is_default: 1 },
        ]
      },
      {
        slug: 'onion-paste',
        name_bn: 'পেঁয়াজ বাটা',
        name_en: 'Onion Paste',
        category: 'paste',
        short_desc_bn: 'রান্নার গ্রেভি ঘন ও সুস্বাদু করতে তৈরি বিশুদ্ধ পেঁয়াজ বাটা।',
        short_desc_en: 'Fresh minced onion paste perfect for thick, rich Bengali gravy.',
        full_desc_bn: 'তাজা বাছাইকৃত পেঁয়াজ দিয়ে তৈরি বিশুদ্ধ মশলাদার পেঁয়াজ বাটা। আপনার পছন্দের যে কোনো রান্নায় গ্রেভিকে করে তুলবে চমৎকার ঘন ও অতুলনীয় সুস্বাদু।',
        full_desc_en: 'Mosladar Onion Paste is made from fresh local red onions, ground to a rich paste. Ideal for creating thick, luscious gravies in traditional chicken, beef, and fish curries.',
        primary_image: '/assets/products/approved/onion-paste-250g.webp',
        lifestyle_image: '/assets/products/approved/onion-paste-culinary-scene.webp',
        badge: 'নতুন',
        is_featured: 1,
        variants: [
          { weight_label: '250g', weight_grams: 250, price: 50, sku: 'MSL-OP-250G', is_default: 1 },
        ]
      },
    ];

    for (const p of productsData) {
      const prodRes = await queryRun(
        `INSERT INTO products (slug, name_bn, name_en, category, short_desc_bn, short_desc_en, full_desc_bn, full_desc_en, primary_image, lifestyle_image, badge, is_featured, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1);`,
        [p.slug, p.name_bn, p.name_en, p.category, p.short_desc_bn, p.short_desc_en, p.full_desc_bn, p.full_desc_en, p.primary_image, p.lifestyle_image, p.badge, p.is_featured]
      );

      for (const v of p.variants) {
        await queryRun(
          `INSERT INTO product_variants (product_id, weight_label, weight_grams, price, stock, sku, is_default, is_active)
           VALUES (?, ?, ?, ?, 50, ?, ?, 1);`,
          [prodRes.lastID, v.weight_label, v.weight_grams, v.price, v.sku, v.is_default]
        );
      }
    }
    console.log('[DB] Finished seeding 7 products and 11 variants.');
  }
}

module.exports = {
  db,
  queryGet,
  queryAll,
  queryRun,
  hashPassword,
  verifyPassword,
  initDatabase,
};
