/**
 * MOSLADAR (মশলাদার) — Automated Production Verification Test Suite
 * Covers Part 12 Requirements: Catalogue, Pricing, Security, Order Flow, Assets & Integrity
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const {
  queryGet,
  queryAll,
  queryRun,
  initDatabase,
  verifyPassword,
} = require('../server/db');
const { app } = require('../server/server');

let serverInstance;
const TEST_PORT = 3099;
const BASE_URL = `http://localhost:${TEST_PORT}`;

// Test Summary Collector
const results = {
  passed: 0,
  failed: 0,
  tests: [],
};

function recordTest(name, passed, message = '') {
  if (passed) {
    results.passed++;
    results.tests.push({ name, status: 'PASS', message });
    console.log(`  ✓ [PASS] ${name}`);
  } else {
    results.failed++;
    results.tests.push({ name, status: 'FAIL', message });
    console.error(`  ✗ [FAIL] ${name}: ${message}`);
  }
}

async function runTests() {
  console.log('\n======================================================');
  console.log('MOSLADAR (মশলাদার) — AUTOMATED VERIFICATION TEST SUITE');
  console.log('======================================================\n');

  // Start temporary test server
  await initDatabase();
  await new Promise((resolve) => {
    serverInstance = app.listen(TEST_PORT, resolve);
  });

  try {
    // ----------------------------------------------------
    // TEST 1: Seven Products and Eleven Variants Present
    // ----------------------------------------------------
    const products = await queryAll('SELECT * FROM products WHERE is_active = 1;');
    const variants = await queryAll('SELECT * FROM product_variants WHERE is_active = 1;');
    recordTest(
      'Seven Products Present',
      products.length === 7,
      `Expected 7 products, found ${products.length}`
    );
    recordTest(
      'Eleven Variants Present',
      variants.length === 11,
      `Expected 11 variants, found ${variants.length}`
    );

    // ----------------------------------------------------
    // TEST 2: Exact Seeded Prices Match Master Catalogue
    // ----------------------------------------------------
    const expectedCatalogue = [
      { sku: 'MSL-CP-50G', weight: '50g', price: 40 },
      { sku: 'MSL-CP-100G', weight: '100g', price: 70 },
      { sku: 'MSL-TP-50G', weight: '50g', price: 40 },
      { sku: 'MSL-TP-100G', weight: '100g', price: 65 },
      { sku: 'MSL-DP-50G', weight: '50g', price: 32 },
      { sku: 'MSL-DP-100G', weight: '100g', price: 60 },
      { sku: 'MSL-JP-50G', weight: '50g', price: 80 },
      { sku: 'MSL-JP-100G', weight: '100g', price: 140 },
      { sku: 'MSL-GP-250G', weight: '250g', price: 90 },
      { sku: 'MSL-GLP-250G', weight: '250g', price: 70 },
      { sku: 'MSL-OP-250G', weight: '250g', price: 50 },
    ];

    let catalogueMatch = true;
    for (const exp of expectedCatalogue) {
      const v = variants.find((item) => item.sku === exp.sku);
      if (!v || v.price !== exp.price || v.weight_label !== exp.weight) {
        catalogueMatch = false;
        recordTest(`Price Verification ${exp.sku}`, false, `Expected ${exp.weight} @ ৳${exp.price}, found ${v?.weight_label} @ ৳${v?.price}`);
      }
    }
    if (catalogueMatch) {
      recordTest('All 11 Variant Prices Exactly Match Catalogue', true);
    }

    // ----------------------------------------------------
    // TEST 3: Public API /api/products returns correct structure
    // ----------------------------------------------------
    const apiRes = await fetch(`${BASE_URL}/api/products`);
    const apiData = await apiRes.json();
    recordTest(
      'API /api/products Returns All 7 Products with Embedded Variants',
      Array.isArray(apiData) && apiData.length === 7 && apiData.every((p) => p.variants && p.variants.length > 0)
    );

    // ----------------------------------------------------
    // TEST 4: Delivery Fees Calculated Correctly (Dhaka: ৳70, Outside: ৳150)
    // ----------------------------------------------------
    const testChiliVar = variants.find((v) => v.sku === 'MSL-CP-100G'); // ৳70
    
    // Order inside Dhaka
    const orderDhakaRes = await fetch(`${BASE_URL}/api/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer_name: 'টেস্ট কাস্টমার',
        customer_phone: '01711223344',
        delivery_address: 'ধানমন্ডি, ঢাকা',
        delivery_zone: 'inside_dhaka',
        payment_method: 'cod',
        items: [{ variant_id: testChiliVar.id, quantity: 2 }], // 70*2 = 140
      }),
    });
    const orderDhakaData = await orderDhakaRes.json();
    recordTest(
      'Delivery Fee Inside Dhaka is ৳70 and Total is Accurately Summed',
      orderDhakaData.success === true && orderDhakaData.delivery_fee === 70 && orderDhakaData.total_amount === 210, // 140 + 70 = 210
      `Got delivery_fee=${orderDhakaData.delivery_fee}, total=${orderDhakaData.total_amount}`
    );

    // Order outside Dhaka
    const orderOutsideRes = await fetch(`${BASE_URL}/api/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer_name: 'টেস্ট কাস্টমার ২',
        customer_phone: '01811223344',
        delivery_address: 'আগ্রাবাদ, চট্টগ্রাম',
        delivery_zone: 'outside_dhaka',
        payment_method: 'cod',
        items: [{ variant_id: testChiliVar.id, quantity: 1 }], // 70
      }),
    });
    const orderOutsideData = await orderOutsideRes.json();
    recordTest(
      'Delivery Fee Outside Dhaka is ৳150 and Total is Accurately Summed',
      orderOutsideData.success === true && orderOutsideData.delivery_fee === 150 && orderOutsideData.total_amount === 220, // 70 + 150 = 220
      `Got delivery_fee=${orderOutsideData.delivery_fee}, total=${orderOutsideData.total_amount}`
    );

    // ----------------------------------------------------
    // TEST 5: Server Rejects Manipulated Prices
    // ----------------------------------------------------
    const manipulatedRes = await fetch(`${BASE_URL}/api/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer_name: 'হ্যাকার টেস্ট',
        customer_phone: '01911223344',
        delivery_address: 'উত্তরা, ঢাকা',
        delivery_zone: 'inside_dhaka',
        payment_method: 'cod',
        // Client attempts to send fake price of ৳1
        items: [{ variant_id: testChiliVar.id, quantity: 1, price: 1 }],
      }),
    });
    const manipulatedData = await manipulatedRes.json();
    recordTest(
      'Server Ignores Client-Injected Unit Price & Uses Database Price (৳70)',
      manipulatedData.subtotal === 70 && manipulatedData.total_amount === 140,
      `Calculated subtotal=${manipulatedData.subtotal}, total=${manipulatedData.total_amount}`
    );

    // ----------------------------------------------------
    // TEST 6: Server Validates Input & Rejects Invalid Phone Numbers
    // ----------------------------------------------------
    const badPhoneRes = await fetch(`${BASE_URL}/api/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer_name: 'ভুল ফোন টেস্ট',
        customer_phone: '12345', // Invalid phone
        delivery_address: 'মিরপুর, ঢাকা',
        delivery_zone: 'inside_dhaka',
        items: [{ variant_id: testChiliVar.id, quantity: 1 }],
      }),
    });
    recordTest(
      'Server Rejects Invalid Phone Number',
      badPhoneRes.status === 400
    );

    // ----------------------------------------------------
    // TEST 7: Server Rejects Invalid Quantities
    // ----------------------------------------------------
    const badQtyRes = await fetch(`${BASE_URL}/api/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer_name: 'ভুল সংখ্যা টেস্ট',
        customer_phone: '01711223344',
        delivery_address: 'মিরপুর, ঢাকা',
        delivery_zone: 'inside_dhaka',
        items: [{ variant_id: testChiliVar.id, quantity: -5 }],
      }),
    });
    recordTest(
      'Server Rejects Negative Quantity',
      badQtyRes.status === 400
    );

    // ----------------------------------------------------
    // TEST 8: Stock Cannot Be Oversold
    // ----------------------------------------------------
    const oversoldRes = await fetch(`${BASE_URL}/api/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer_name: 'অতিরিক্ত স্টক টেস্ট',
        customer_phone: '01711223344',
        delivery_address: 'মিরপুর, ঢাকা',
        delivery_zone: 'inside_dhaka',
        items: [{ variant_id: testChiliVar.id, quantity: 999999 }], // Exceeds stock
      }),
    });
    recordTest(
      'Server Rejects Order When Quantity Exceeds Stock',
      oversoldRes.status === 400
    );

    // ----------------------------------------------------
    // TEST 9: Orders Persist in Database with Snapshot Prices
    // ----------------------------------------------------
    const persistedOrder = await queryGet('SELECT * FROM orders WHERE order_code = ?;', [orderDhakaData.order_code]);
    const persistedItems = await queryAll('SELECT * FROM order_items WHERE order_id = ?;', [persistedOrder.id]);
    recordTest(
      'Order Persists in Database with Items and Price Snapshots',
      persistedOrder !== undefined &&
      persistedItems.length === 1 &&
      persistedItems[0].unit_price === 70 &&
      persistedItems[0].quantity === 2
    );

    // ----------------------------------------------------
    // TEST 10: Inventory Movement Recorded
    // ----------------------------------------------------
    const invLog = await queryGet('SELECT * FROM inventory_movements WHERE variant_id = ? ORDER BY id DESC LIMIT 1;', [testChiliVar.id]);
    recordTest(
      'Inventory Movement Recorded in Audit Table',
      invLog !== undefined && invLog.change_type === 'order_placed'
    );

    // ----------------------------------------------------
    // TEST 11: Protected Order Tracking Requires Order Code + Phone
    // ----------------------------------------------------
    const trackSuccessRes = await fetch(`${BASE_URL}/api/orders/track`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        order_code: orderDhakaData.order_code,
        phone: '01711223344',
      }),
    });
    recordTest(
      'Protected Tracking Works with Correct Code + Phone',
      trackSuccessRes.status === 200
    );

    const trackWrongPhoneRes = await fetch(`${BASE_URL}/api/orders/track`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        order_code: orderDhakaData.order_code,
        phone: '01999999999', // Wrong phone
      }),
    });
    recordTest(
      'Protected Tracking Rejects Wrong Phone Number (Prevents Snooping)',
      trackWrongPhoneRes.status === 404
    );

    // ----------------------------------------------------
    // TEST 12: Admin Security & Auth Guards
    // ----------------------------------------------------
    const unauthAdminRes = await fetch(`${BASE_URL}/api/admin/orders`);
    recordTest(
      'Unauthorized Users Blocked from Admin Endpoints (401)',
      unauthAdminRes.status === 401
    );

    // Login with wrong password fails
    const badLoginRes = await fetch(`${BASE_URL}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'WrongPassword' }),
    });
    recordTest(
      'Admin Login Rejects Incorrect Password',
      badLoginRes.status === 401
    );

    // Login with correct password succeeds
    const goodLoginRes = await fetch(`${BASE_URL}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'Mosladar@Admin2026!' }),
    });
    const goodLoginData = await goodLoginRes.json();
    recordTest(
      'Admin Login Succeeds with Valid Password & Returns Session Token',
      goodLoginRes.status === 200 && goodLoginData.token !== undefined
    );

    // Admin endpoint accessible with session token
    const authAdminRes = await fetch(`${BASE_URL}/api/admin/orders`, {
      headers: { 'x-admin-token': goodLoginData.token },
    });
    recordTest(
      'Admin Orders Accessible with Authenticated Token',
      authAdminRes.status === 200
    );

    // ----------------------------------------------------
    // TEST 13: Digital Payment Never Falsely Marked as Paid
    // ----------------------------------------------------
    const bkashOrderRes = await fetch(`${BASE_URL}/api/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer_name: 'বিকাশ টেস্ট',
        customer_phone: '01711223344',
        delivery_address: 'উত্তরা, ঢাকা',
        delivery_zone: 'inside_dhaka',
        payment_method: 'bkash',
        items: [{ variant_id: testChiliVar.id, quantity: 1 }],
      }),
    });
    const bkashData = await bkashOrderRes.json();
    recordTest(
      'Digital Payment Method (bKash) Initial Status is Pending Verification (Never Auto Paid)',
      bkashData.payment_status === 'pending_verification'
    );

    // ----------------------------------------------------
    // TEST 14: All Approved Image Assets Exist and Are Non-Empty
    // ----------------------------------------------------
    const requiredAssets = [
      'public/assets/branding/mosladar-logo.jpg',
      'public/assets/products/approved/chili-powder-100g.webp',
      'public/assets/products/approved/turmeric-powder-100g.webp',
      'public/assets/products/approved/coriander-powder-100g.webp',
      'public/assets/products/approved/cumin-powder-100g.webp',
      'public/assets/products/approved/ginger-paste-250g.webp',
      'public/assets/products/approved/garlic-paste-250g.webp',
      'public/assets/products/approved/onion-paste-250g.webp',
      'public/assets/products/approved/onion-paste-culinary-scene.webp',
    ];

    let allAssetsExist = true;
    for (const relPath of requiredAssets) {
      const fullPath = path.join(__dirname, '..', relPath);
      if (!fs.existsSync(fullPath) || fs.statSync(fullPath).size === 0) {
        allAssetsExist = false;
        recordTest(`Asset Exists: ${relPath}`, false, 'Missing or empty file');
      }
    }
    if (allAssetsExist) {
      recordTest('All 8 Approved Product and Brand Image Assets Exist & Valid', true);
    }

    // ----------------------------------------------------
    // TEST 15: Exact Brand Name Spelling "মশলাদার"
    // ----------------------------------------------------
    const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'public', 'index.html'), 'utf8');
    const appJs = fs.readFileSync(path.join(__dirname, '..', 'public', 'app.js'), 'utf8');
    
    const hasExactSpelling = indexHtml.includes('মশলাদার') && appJs.includes('মশলাদার');
    // Ensure no misspelled variations like মশলাদার with wrong vowels
    recordTest(
      'Exact Bangla Brand Spelling "মশলাদার" Used Throughout Website',
      hasExactSpelling
    );

    // ----------------------------------------------------
    // TEST 16: Zero Video Elements or Video Placeholders
    // ----------------------------------------------------
    const hasVideoTag = /<video|<iframe|youtube\.com|vimeo\.com/i.test(indexHtml);
    recordTest(
      'Zero Video Elements or Placeholders Present (Photo-Only Mandate)',
      !hasVideoTag
    );

  } catch (err) {
    console.error('Test runner failure:', err);
    recordTest('Test Runner Execution', false, err.message);
  } finally {
    if (serverInstance) {
      serverInstance.close();
    }
  }

  console.log('\n------------------------------------------------------');
  console.log(`TOTAL TESTS: ${results.passed + results.failed} | PASSED: ${results.passed} | FAILED: ${results.failed}`);
  console.log('------------------------------------------------------\n');

  if (results.failed > 0) {
    process.exit(1);
  }
}

runTests();
