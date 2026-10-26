/**
 * MOSLADAR (মশলাদার) — Admin Dashboard Controller
 * Secure Authentication, Order Management, Inventory & WhatsApp Workflows
 */

let currentAdminUser = null;
let adminOrdersCache = [];

document.addEventListener('DOMContentLoaded', () => {
  checkAdminSession();
  initLoginForm();
});

// Check if active session exists
async function checkAdminSession() {
  try {
    const res = await fetch('/api/admin/me');
    if (res.ok) {
      const data = await res.json();
      currentAdminUser = data.user;
      showAdminDashboard();
    } else {
      showLoginForm();
    }
  } catch (err) {
    showLoginForm();
  }
}

function showLoginForm() {
  document.getElementById('admin-login-view').style.display = 'block';
  document.getElementById('admin-app-view').style.display = 'none';
}

function showAdminDashboard() {
  document.getElementById('admin-login-view').style.display = 'none';
  document.getElementById('admin-app-view').style.display = 'flex';
  document.getElementById('admin-user-display').textContent = `Logged in: ${currentAdminUser.username} (${currentAdminUser.role})`;
  
  loadAdminStats();
  loadAdminOrders();
  loadAdminProducts();
}

// Login Handler
function initLoginForm() {
  const form = document.getElementById('admin-login-form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;
    const btn = document.getElementById('login-submit-btn');

    btn.disabled = true;
    btn.textContent = 'লগইন হচ্ছে...';

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Login failed');
      }

      currentAdminUser = data.user;
      showToast('লগইন সফল হয়েছে!');
      showAdminDashboard();
    } catch (err) {
      alert(err.message);
    } finally {
      btn.disabled = false;
      btn.textContent = 'লগইন করুন (Secure Login)';
    }
  });
}

// Logout Handler
async function handleAdminLogout() {
  try {
    await fetch('/api/admin/logout', { method: 'POST' });
    currentAdminUser = null;
    showToast('লগআউট সম্পন্ন হয়েছে');
    showLoginForm();
  } catch (err) {
    console.error('Logout error:', err);
  }
}
window.handleAdminLogout = handleAdminLogout;

// Tab Switcher
window.switchAdminTab = function(tabName) {
  document.querySelectorAll('.admin-nav-item').forEach((el) => {
    el.classList.toggle('active', el.getAttribute('data-tab') === tabName);
  });

  const ordersTab = document.getElementById('tab-content-orders');
  const invTab = document.getElementById('tab-content-inventory');
  const title = document.getElementById('admin-page-title');

  if (tabName === 'orders') {
    ordersTab.style.display = 'block';
    invTab.style.display = 'none';
    title.textContent = 'অর্ডার ব্যবস্থাপনা (Orders)';
    loadAdminOrders();
  } else if (tabName === 'inventory') {
    ordersTab.style.display = 'none';
    invTab.style.display = 'block';
    title.textContent = 'স্টক ও মূল্য ব্যবস্থাপনা (Inventory)';
    loadAdminProducts();
  }
};

// Fetch Dashboard Stats
async function loadAdminStats() {
  try {
    const res = await fetch('/api/admin/stats');
    if (!res.ok) return;
    const data = await res.json();

    document.getElementById('stat-total-orders').textContent = data.total_orders;
    document.getElementById('stat-pending-orders').textContent = data.pending_orders;
    document.getElementById('stat-revenue').textContent = `৳${data.total_revenue}`;
    document.getElementById('stat-low-stock').textContent = data.low_stock_count;
  } catch (err) {
    console.error('Failed to load stats:', err);
  }
}

// Load Orders List
async function loadAdminOrders() {
  const statusEl = document.getElementById('order-filter-status');
  const searchEl = document.getElementById('order-search-input');
  const status = statusEl ? statusEl.value : '';
  const search = searchEl ? searchEl.value : '';
  const tbody = document.getElementById('admin-orders-tbody');
  if (!tbody) return;

  tbody.innerHTML = '<tr><td colspan="9" style="text-align: center; padding: 24px;">লোড হচ্ছে...</td></tr>';

  try {
    const query = new URLSearchParams({ status, search });
    const res = await fetch(`/api/admin/orders?${query}`);
    if (!res.ok) throw new Error('Failed to load orders');

    const orders = await res.json();
    adminOrdersCache = orders;

    if (orders.length === 0) {
      tbody.innerHTML = '<tr><td colspan="9" style="text-align: center; padding: 24px; color: var(--c-text-muted);">কোনো অর্ডার পাওয়া যায়নি।</td></tr>';
      return;
    }

    tbody.innerHTML = orders.map((o) => {
      const dateStr = new Date(o.created_at).toLocaleDateString('bn-BD', {
        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
      });
      const itemsCount = o.items ? o.items.reduce((sum, i) => sum + i.quantity, 0) : 0;

      return `
        <tr>
          <td><strong style="color: var(--c-forest-dark);">${o.order_code}</strong></td>
          <td style="font-size: 0.82rem; color: var(--c-text-secondary);">${dateStr}</td>
          <td>
            <strong>${o.customer_name}</strong><br>
            <small style="color: var(--c-forest-green); font-weight: 600;">${o.customer_phone}</small>
          </td>
          <td>
            <span style="font-size: 0.8rem;">${o.delivery_zone === 'inside_dhaka' ? 'ঢাকার ভেতরে' : 'ঢাকার বাইরে'}</span>
          </td>
          <td>${itemsCount} টি</td>
          <td><strong style="color: var(--c-maroon);">৳${o.total_amount}</strong></td>
          <td>
            <span style="font-size: 0.78rem; text-transform: uppercase; font-weight: 700;">${o.payment_method}</span><br>
            <small style="color: ${o.payment_status === 'paid' ? 'var(--c-success)' : 'var(--c-warning)'};">${o.payment_status}</small>
          </td>
          <td>
            <span class="status-badge status-${o.order_status}">${o.order_status}</span>
          </td>
          <td>
            <button type="button" class="btn-secondary" style="padding: 4px 10px; font-size: 0.8rem;" onclick="viewAdminOrderDetails(${o.id})">
              বিস্তারিত ও আপডেট
            </button>
          </td>
        </tr>
      `;
    }).join('');
  } catch (err) {
    console.error('Error loading orders:', err);
    tbody.innerHTML = '<tr><td colspan="9" style="text-align: center; color: var(--c-danger);">অর্ডার লোড করতে সমস্যা হয়েছে।</td></tr>';
  }
}
window.loadAdminOrders = loadAdminOrders;

// View Order Details & Action Modal
window.viewAdminOrderDetails = function(orderId) {
  const o = adminOrdersCache.find((ord) => ord.id === orderId);
  if (!o) return;

  document.getElementById('admin-modal-order-code').textContent = `অর্ডার: ${o.order_code}`;
  const body = document.getElementById('admin-modal-order-body');

  const itemsHtml = o.items.map((i) => `
    <div style="display: flex; justify-content: space-between; font-size: 0.9rem; padding: 6px 0; border-bottom: 1px dashed var(--c-border-light);">
      <span>${i.product_name_bn} (${i.weight_label}) x ${i.quantity}</span>
      <strong>৳${i.total_price}</strong>
    </div>
  `).join('');

  // Pre-fill WhatsApp message text for manual WhatsApp messaging
  const waMessage = encodeURIComponent(
    `নমস্কার ${o.customer_name},\nমশলাদার (Mosladar) থেকে আপনার অর্ডার ${o.order_code} নিশ্চিত করা হয়েছে।\nসর্বমোট বিল: ৳${o.total_amount}\nডেলিভারি ঠিকানা: ${o.delivery_address}\nধন্যবাদ, মশলাদার।`
  );
  const waUrl = `https://wa.me/880${o.customer_phone}?text=${waMessage}`;

  body.innerHTML = `
    <div style="margin-bottom: 16px;">
      <p style="font-size: 0.92rem;"><strong>ক্রেতার নাম:</strong> ${o.customer_name}</p>
      <p style="font-size: 0.92rem;"><strong>মোবাইল নম্বর:</strong> <a href="tel:${o.customer_phone}" style="color: var(--c-forest-green); font-weight: 700;">${o.customer_phone}</a></p>
      <p style="font-size: 0.92rem;"><strong>ডেলিভারি ঠিকানা:</strong> ${o.delivery_address}</p>
      ${o.order_notes ? `<p style="font-size: 0.88rem; color: var(--c-text-muted);"><strong>নোট:</strong> ${o.order_notes}</p>` : ''}
    </div>

    <div style="background: var(--c-cream); border: 1px solid var(--c-border); border-radius: var(--radius-sm); padding: 12px; margin-bottom: 18px;">
      <h4 style="font-size: 0.92rem; font-weight: 700; color: var(--c-forest-dark); margin-bottom: 8px;">অর্ডারের আইটেমসমূহ:</h4>
      ${itemsHtml}
      <div style="display: flex; justify-content: space-between; margin-top: 8px; font-size: 0.88rem;">
        <span>ডেলিভারি চার্জ:</span>
        <span>৳${o.delivery_fee}</span>
      </div>
      <div style="display: flex; justify-content: space-between; font-weight: 800; font-size: 1.05rem; color: var(--c-maroon); border-top: 1px solid var(--c-border); padding-top: 6px; margin-top: 6px;">
        <span>সর্বমোট:</span>
        <span>৳${o.total_amount}</span>
      </div>
    </div>

    <!-- WhatsApp Quick Contact Fallback -->
    <div style="margin-bottom: 20px;">
      <a href="${waUrl}" target="_blank" rel="noopener noreferrer" class="whatsapp-action-btn" style="width: 100%; font-size: 0.92rem; padding: 10px;">
        💬 গ্রাহককে হোয়াটসঅ্যাপে কনফার্মেশন পাঠান
      </a>
    </div>

    <!-- Status Update Form -->
    <div style="border-top: 1px solid var(--c-border); padding-top: 16px;">
      <h4 style="font-size: 0.95rem; font-weight: 700; margin-bottom: 10px;">স্ট্যাটাস আপডেট করুন:</h4>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 12px;">
        <div>
          <label style="font-size: 0.82rem; font-weight: 700; display: block; margin-bottom: 4px;">অর্ডার স্ট্যাটাস</label>
          <select id="modal-status-select" class="form-select">
            <option value="pending" ${o.order_status === 'pending' ? 'selected' : ''}>Pending (অপেক্ষমান)</option>
            <option value="confirmed" ${o.order_status === 'confirmed' ? 'selected' : ''}>Confirmed (নিশ্চিত)</option>
            <option value="processing" ${o.order_status === 'processing' ? 'selected' : ''}>Processing (প্রস্তুত)</option>
            <option value="shipped" ${o.order_status === 'shipped' ? 'selected' : ''}>Shipped (কুরিয়ারে)</option>
            <option value="delivered" ${o.order_status === 'delivered' ? 'selected' : ''}>Delivered (বিতরণকৃত)</option>
            <option value="cancelled" ${o.order_status === 'cancelled' ? 'selected' : ''}>Cancelled (বাতিল)</option>
          </select>
        </div>
        <div>
          <label style="font-size: 0.82rem; font-weight: 700; display: block; margin-bottom: 4px;">পেমেন্ট স্ট্যাটাস</label>
          <select id="modal-payment-select" class="form-select">
            <option value="unpaid" ${o.payment_status === 'unpaid' ? 'selected' : ''}>Unpaid</option>
            <option value="pending_verification" ${o.payment_status === 'pending_verification' ? 'selected' : ''}>Pending Verification</option>
            <option value="paid" ${o.payment_status === 'paid' ? 'selected' : ''}>Paid (পরিশোধিত)</option>
          </select>
        </div>
      </div>

      <div style="margin-bottom: 12px;">
        <label style="font-size: 0.82rem; font-weight: 700; display: block; margin-bottom: 4px;">কমেন্ট / নোট (Audit Trail)</label>
        <input type="text" id="modal-status-comment" class="form-input" placeholder="e.g. কুরিয়ার ট্র্যাকিং নং REDX-98273">
      </div>

      <button type="button" class="btn-primary" style="width: 100%; padding: 10px;" onclick="saveAdminOrderStatus(${o.id})">
        সংরক্ষণ করুন (Save Status)
      </button>
    </div>
  `;

  document.getElementById('admin-order-modal').classList.add('active');
};

window.closeAdminOrderModal = function() {
  document.getElementById('admin-order-modal').classList.remove('active');
};

// Save Order Status
window.saveAdminOrderStatus = async function(orderId) {
  const status = document.getElementById('modal-status-select').value;
  const payment_status = document.getElementById('modal-payment-select').value;
  const comment = document.getElementById('modal-status-comment').value;

  try {
    const res = await fetch(`/api/admin/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, payment_status, comment }),
    });

    if (!res.ok) throw new Error('Status update failed');

    showToast('অর্ডারের স্ট্যাটাস সফলভাবে আপডেট করা হয়েছে');
    closeAdminOrderModal();
    loadAdminStats();
    loadAdminOrders();
  } catch (err) {
    alert(err.message);
  }
};

// Inventory Products & Variants
async function loadAdminProducts() {
  const tbody = document.getElementById('admin-inventory-tbody');
  tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 24px;">পণ্য লোড হচ্ছে...</td></tr>';

  try {
    const res = await fetch('/api/admin/products');
    if (!res.ok) throw new Error('Failed to load products');
    const products = await res.json();

    const rows = [];
    for (const p of products) {
      for (const v of p.variants) {
        rows.push(`
          <tr>
            <td>
              <div style="display: flex; align-items: center; gap: 10px;">
                <img src="${p.primary_image}" alt="${p.name_bn}" style="width: 40px; height: 40px; object-fit: contain; background: #FAF6EE; border-radius: 4px;">
                <div>
                  <strong>${p.name_bn}</strong><br>
                  <small style="color: var(--c-text-muted);">${p.name_en}</small>
                </div>
              </div>
            </td>
            <td><span class="status-badge" style="background: var(--c-forest-soft); color: var(--c-forest-green);">${p.category}</span></td>
            <td><strong>${v.weight_label}</strong></td>
            <td><code>${v.sku}</code></td>
            <td>
              <input type="number" id="price-input-${v.id}" value="${v.price}" style="width: 80px; padding: 4px 8px; border: 1px solid var(--c-border); border-radius: 4px; font-weight: 700;">
            </td>
            <td>
              <input type="number" id="stock-input-${v.id}" value="${v.stock}" style="width: 80px; padding: 4px 8px; border: 1px solid var(--c-border); border-radius: 4px; font-weight: 700;">
            </td>
            <td>
              <button type="button" class="btn-primary" style="padding: 4px 12px; font-size: 0.8rem;" onclick="saveVariantChanges(${v.id})">
                সেভ করুন
              </button>
            </td>
          </tr>
        `);
      }
    }
    tbody.innerHTML = rows.join('');
  } catch (err) {
    console.error('Inventory load error:', err);
  }
}
window.loadAdminProducts = loadAdminProducts;

// Save Variant Price and Stock
window.saveVariantChanges = async function(variantId) {
  const price = document.getElementById(`price-input-${variantId}`).value;
  const stock = document.getElementById(`stock-input-${variantId}`).value;

  try {
    const res = await fetch(`/api/admin/variants/${variantId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ price, stock }),
    });

    if (!res.ok) throw new Error('Variant update failed');

    showToast('মূল্য ও স্টক সফলভাবে সংরক্ষিত হয়েছে!');
    loadAdminStats();
  } catch (err) {
    alert(err.message);
  }
};

// Database Export / Backup
window.exportDatabaseBackup = function() {
  window.open('/api/admin/export', '_blank');
};

function showToast(message) {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `<span>✓</span> <span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}
