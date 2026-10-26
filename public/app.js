/**
 * MOSLADAR (মশলাদার) — Frontend Application Engine
 * Bilingual Storefront, Cart Management, Checkout & Order Tracking
 */

// Application State
const state = {
  lang: 'bn', // Default Bangla-first
  products: [],
  selectedVariants: {}, // productId -> variantId
  cardQuantities: {}, // productId -> quantity
  searchQuery: '',
  sortBy: 'featured',
  activeHeroProduct: null,
  cart: [], // Array of { variantId, productId, name_bn, name_en, weight_label, price, quantity, image }
  selectedZone: 'inside_dhaka',
  deliveryFee: 70,
  selectedPayment: 'cod',
  currentCategory: 'all',
};

// Bilingual Translations Dictionary
const i18n = {
  bn: {
    announcement_badge: 'সারাদেশে ডেলিভারি',
    announcement_text: 'ঢাকার ভেতরে হোম ডেলিভারি মাত্র ৳৭০ | হটলাইন ও হোয়াটসঅ্যাপ:',
    brand_slogan: 'স্বাদে ঐতিহ্য, মানে আস্থা',
    nav_shop: 'সব মশলা',
    nav_bundles: 'কম্বো অফার',
    nav_why_pure: 'কেন খাঁটি?',
    nav_recipes: 'রেসিপি গাইড',
    nav_story: 'আমাদের কথা',
    nav_reviews: 'গ্রাহক রিভিউ',
    nav_faq: 'প্রশ্নোত্তর',
    nav_track: 'অর্ডার ট্র্যাকিং',
    nav_contact: 'যোগাযোগ',
    cart_label: 'ব্যাগ',
    hero_tag: 'ঐতিহ্যবাহী বাংলাদেশি মশলা',
    hero_desc: 'সেরা মানের দেশি মরিচ, হলুদ, ধনিয়া ও জিরা গুঁড়া এবং শতভাগ তাজা আদা, রসুন ও পেঁয়াজ বাটা। আধুনিক স্বাস্থ্যসম্মত প্রযুক্তিতে প্রক্রিয়াজাত—আপনার প্রতিদিনের রান্নায় খাঁটি স্বাদ নিশ্চিত করতে।',
    hero_cta: 'সব মশলা দেখুন',
    hero_bundles_cta: '🎁 কম্বো সেভার প্যাক',
    trust_1: 'বাছাইকৃত সেরা কাঁচামাল',
    trust_2: 'স্বাস্থ্যসম্মত আধুনিক প্রস্তুত',
    trust_3: 'সারাদেশে হোম ডেলিভারি',
    featured_badge: 'সিগনেচার মশলা',
    add_btn: 'ব্যাগে নিন',
    shop_tag: 'আমাদের ক্যাটালগ',
    shop_title: 'প্রিমিয়াম মশলা সম্ভার',
    shop_subtitle: 'ঐতিহ্যবাহী দেশি রেসিপির স্বাদ ও ঘ্রাণ ধরে রাখতে সাতটি নিশ্চিত পণ্য ও এগারোটি ভ্যারিয়েন্ট।',
    tab_all: 'সব মশলা (৭)',
    tab_powder: 'গুঁড়া মশলা (৪)',
    tab_paste: 'বাটা মশলা (৩)',
    sort_label: 'সর্ট করুন:',
    in_stock: 'ইন স্টক',
    out_of_stock: 'স্টক শেষ',
    quick_view: 'বিস্তারিত দেখুন',
    bundles_tag: 'বিশেষ সেভার কম্বো',
    bundles_title: 'একসাথে কিনুন, সময় ও টাকা বাঁচান',
    bundles_subtitle: 'প্রতিদিনের রান্না আরও সহজ ও ঝামেলামুক্ত করতে আমাদের জনপ্রিয় কিউরেটেড মশলা বান্ডেলসমূহ।',
    why_tag: 'স্বচ্ছতা ও বিশুদ্ধতা',
    why_title: 'কেন মশলাদার শতভাগ খাঁটি ও নিরাপদ?',
    why_subtitle: 'সাধারণ বাজারের ভেজাল ও ক্ষতিকর রাসায়নিক বনাম মশলাদারের পরিচ্ছন্ন প্রযুক্তির সরাসরি তুলনা।',
    recipes_tag: 'ঐতিহ্যবাহী রান্না',
    recipes_title: 'মশলাদারের সাথে রান্নার রেসিপি গাইড',
    recipes_subtitle: 'কোন রান্নায় কোন মশলা ব্যবহার করবেন? আমাদের রেসিপি অনুযায়ী ১ ক্লিকে প্রয়োজনীয় সকল মশলা সংগ্রহ করুন।',
    reviews_tag: 'গ্রাহকদের অভিজ্ঞতা',
    reviews_title: 'গৃহিণী ও খাদ্যপ্রেমীদের ভালোবাসায় মশলাদার',
    reviews_subtitle: 'শত শত সন্তুষ্ট পরিবারের আসল মন্তব্য এবং নিয়মিত রান্নায় মশলাদার ব্যবহারের অভিজ্ঞতা।',
    faq_tag: 'সচরাচর প্রশ্নাবলী',
    faq_title: 'আপনার মনের সাধারণ জিজ্ঞাসা ও সমাধান',
    faq_subtitle: 'পণ্য ডেলিভারি, ব্যবহার ও সংরক্ষণের নিয়ম সংক্রান্ত প্রায়শই জিজ্ঞাসিত প্রশ্নোত্তর।',
    cart_drawer_title: 'আপনার শপিং ব্যাগ',
    cart_empty: 'আপনার ব্যাগ বর্তমানে খালি রয়েছে।',
    cart_subtotal_label: 'পণ্যের মূল্য:',
    cart_delivery_note: 'ডেলিভারি চার্জ:',
    cart_est_total: 'মোট প্রদেয়:',
    proceed_checkout: 'চেকআউট ও অর্ডার নিশ্চিত করুন',
    checkout_title: 'অর্ডার সম্পন্ন করুন',
    form_name: 'আপনার পূর্ণ নাম',
    form_phone: '১১ ডিজিটের মোবাইল নম্বর',
    form_address: 'সম্পূর্ণ ডেলিভারি ঠিকানা',
    form_zone: 'ডেলিভারি এলাকা নির্বাচন করুন',
    zone_inside_title: 'ঢাকার ভেতরে',
    zone_inside_desc: '২-৩ কার্যদিবসের মধ্যে ডেলিভারি',
    zone_outside_title: 'ঢাকার বাইরে (সারাদেশ)',
    zone_outside_desc: '৩-৫ কার্যদিবসের মধ্যে কুরিয়ারে',
    form_payment: 'পেমেন্ট মাধ্যম',
    pay_cod: 'ক্যাশ অন ডেলিভারি (COD)',
    form_notes: 'অর্ডার নোট (ঐচ্ছিক)',
    confirm_order_btn: 'অর্ডার নিশ্চিত করুন (Confirm Order)',
    order_success_title: 'অর্ডার সফলভাবে গৃহীত হয়েছে!',
    order_success_desc: 'মশলাদার নির্বাচন করার জন্য ধন্যবাদ। খুব শীঘ্রই আমাদের কাস্টমার প্রতিনিধি আপনার সাথে যোগাযোগ করবেন।',
    order_code_label: 'আপনার ট্র্যাকিং অর্ডার কোড:',
    track_title: 'অর্ডার ট্র্যাকিং',
    track_subtitle: 'আপনার অর্ডার কোড এবং মোবাইল নম্বর দিয়ে বর্তমান অবস্থা জানুন',
    track_code_label: 'অর্ডার কোড *',
    track_phone_label: 'মোবাইল নম্বর *',
    track_btn: 'অর্ডারের অবস্থান ট্র্যাক করুন',
    footer_brand_desc: 'স্বাদে ঐতিহ্য, মানে আস্থা। আশুলিয়া, সাভার থেকে সারাদেশে সরাসরি সরবরাহকৃত খাঁটি দেশি গুঁড়া ও বাটা মশলা।',
    footer_col_shop: 'মশলা ক্যাটাগরি',
    footer_col_policy: 'নীতিমালা ও সেবা',
    footer_col_contact: 'যোগাযোগ ও ঠিকানা',
    policy_shipping: 'ডেলিভারি তথ্য',
    policy_refund: 'রিটার্ন ও রিফান্ড নীতি',
    policy_privacy: 'গোপনীয়তা নীতি',
    policy_terms: 'শর্তাবলী',
    cat_powder: 'গুঁড়া মশলা (Powders)',
    cat_paste: 'বাটা মশলা (Pastes)',
    cat_all: 'সকল পণ্য ক্যাটালগ',
    high_1_title: 'তাজা বাটা পেস্ট',
    high_1_desc: 'প্রতিদিনের রান্নার সময় বাঁচাতে প্রস্তুত খাঁটি আদা, রসুন ও পেঁয়াজ বাটা।',
    high_2_title: 'নিরাপদ প্যাকেজিং',
    high_2_desc: 'বাতাসরোধী ফুড-গ্রেড প্যাকেটে সংরক্ষিত থাকে দীর্ঘমেয়াদী টাটকা ঘ্রাণ।',
    story_p1: 'বাঙালি রসুইঘরের প্রাণ হলো খাঁটি মশলা। “মশলাদার”-এর জন্ম আশুলিয়ার আউখপাড়া থেকে, সেই চিরচেনা পারিবারিক রান্নার নির্ভেজাল স্বাদ প্রতিটি ঘরে পৌঁছে দেওয়ার লক্ষ্য নিয়ে।',
    story_p2: 'আমরা কৃষকপর্যায় থেকে বাছাইকৃত পরিপক্ব মরিচ, হলুদ, ধনিয়া ও জিরা সংগ্রহ করি। কোনো প্রকার ভেজাল, ধানের তুষ কিংবা কৃত্রিম রাসায়নিক রঙ ছাড়াই রোদে শুকিয়ে স্বাস্থ্যসম্মত মেশিনে গুঁড়া করা হয়।',
  },
  en: {
    announcement_badge: 'Nationwide Delivery',
    announcement_text: 'Home Delivery Inside Dhaka only ৳70 | Hotline & WhatsApp:',
    brand_slogan: 'Heritage in Taste, Trust in Quality',
    nav_shop: 'All Spices',
    nav_bundles: 'Combo Packs',
    nav_why_pure: 'Why Pure?',
    nav_recipes: 'Recipes',
    nav_story: 'Our Story',
    nav_reviews: 'Reviews',
    nav_faq: 'FAQ',
    nav_track: 'Track Order',
    nav_contact: 'Contact',
    cart_label: 'Bag',
    hero_tag: 'Traditional Bangladeshi Spices',
    hero_desc: 'Premium red chili, turmeric, coriander and roasted cumin powders, plus freshly ground ginger, garlic and onion pastes. Prepared hygienically to bring authentic Bangladeshi flavor to your home.',
    hero_cta: 'Explore All Spices',
    hero_bundles_cta: '🎁 Saver Combos',
    trust_1: 'Carefully Graded Raw Ingredients',
    trust_2: 'Hygienic Modern Processing',
    trust_3: 'Reliable Nationwide Delivery',
    featured_badge: 'Signature Spice',
    add_btn: 'Add to Bag',
    shop_tag: 'Our Catalogue',
    shop_title: 'Premium Spice Collection',
    shop_subtitle: 'Preserving the aroma and tradition of authentic Bangladeshi cuisine with 7 confirmed products and 11 variants.',
    tab_all: 'All Spices (7)',
    tab_powder: 'Spice Powders (4)',
    tab_paste: 'Fresh Pastes (3)',
    sort_label: 'Sort by:',
    in_stock: 'In Stock',
    out_of_stock: 'Sold Out',
    quick_view: 'Quick View',
    bundles_tag: 'Special Saver Combos',
    bundles_title: 'Buy Together, Save Time & Money',
    bundles_subtitle: 'Carefully curated spice combinations to simplify your everyday cooking.',
    why_tag: 'Purity & Transparency',
    why_title: 'Why Mosladar is 100% Pure & Safe?',
    why_subtitle: 'A direct comparison between commercial market adulteration and Mosladar hygienic standards.',
    recipes_tag: 'Authentic Cooking',
    recipes_title: 'Cooking Recipe Guide with Mosladar',
    recipes_subtitle: 'Which spices for which dish? Order the exact culinary spice kit in 1 click.',
    reviews_tag: 'Customer Feedback',
    reviews_title: 'Loved by Homemakers & Food Connoisseurs',
    reviews_subtitle: 'Authentic reviews and experiences from hundreds of delighted families.',
    faq_tag: 'Frequently Asked Questions',
    faq_title: 'Common Questions & Clear Answers',
    faq_subtitle: 'Guidelines on shelf-life, hygiene standards, delivery, and cash on delivery.',
    cart_drawer_title: 'Your Shopping Bag',
    cart_empty: 'Your shopping bag is currently empty.',
    cart_subtotal_label: 'Subtotal:',
    cart_delivery_note: 'Delivery Fee:',
    cart_est_total: 'Estimated Total:',
    proceed_checkout: 'Proceed to Checkout',
    checkout_title: 'Complete Your Order',
    form_name: 'Full Name',
    form_phone: '11-Digit Mobile Number',
    form_address: 'Full Delivery Address',
    form_zone: 'Select Delivery Area',
    zone_inside_title: 'Inside Dhaka',
    zone_inside_desc: 'Delivery within 2-3 business days',
    zone_outside_title: 'Outside Dhaka (Nationwide)',
    zone_outside_desc: 'Delivery within 3-5 business days via courier',
    form_payment: 'Payment Method',
    pay_cod: 'Cash on Delivery (COD)',
    form_notes: 'Order Notes (Optional)',
    confirm_order_btn: 'Confirm Order (ক্যাশ অন ডেলিভারি)',
    order_success_title: 'Order Placed Successfully!',
    order_success_desc: 'Thank you for choosing Mosladar. Our representative will verify your delivery shortly.',
    order_code_label: 'Your Tracking Order Code:',
    track_title: 'Order Tracking',
    track_subtitle: 'Enter your order code and phone number to track real-time fulfillment',
    track_code_label: 'Order Code *',
    track_phone_label: 'Phone Number *',
    track_btn: 'Track Order Status',
    footer_brand_desc: 'Heritage in taste, trust in quality. Direct from Ashulia, Savar to your kitchen with authentic, unadulterated spices.',
    footer_col_shop: 'Categories',
    footer_col_policy: 'Policies & Help',
    footer_col_contact: 'Contact & Location',
    policy_shipping: 'Shipping & Delivery',
    policy_refund: 'Returns & Exchanges',
    policy_privacy: 'Privacy Policy',
    policy_terms: 'Terms of Service',
    cat_powder: 'Spice Powders',
    cat_paste: 'Fresh Pastes',
    cat_all: 'Complete Catalogue',
    high_1_title: 'Freshly Ground Pastes',
    high_1_desc: 'Ready-to-use ginger, garlic, and onion pastes saving preparation time.',
    high_2_title: 'Aroma-Lock Packaging',
    high_2_desc: 'Food-grade sealed packaging locking in freshness and authentic fragrance.',
    story_p1: 'Authentic spices are the heart of Bengali culinary heritage. Born in Aukhpara, Ashulia, Savar, Mosladar delivers pristine, unadulterated spice powders and pastes directly to households.',
    story_p2: 'We source only top-grade dried red chilies, whole turmeric roots, fragrant coriander seeds, and cumin. Cleaned and milled without sawdust, husk, or artificial coloring.',
  }
};

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
  loadCartFromStorage();
  initLanguageToggle();
  initHeaderScroll();
  initEventListeners();
  fetchProducts();
});

// Load Cart from LocalStorage
function loadCartFromStorage() {
  try {
    const saved = localStorage.getItem('mosladar_cart');
    if (saved) {
      state.cart = JSON.parse(saved);
      updateCartUI();
    }
  } catch (e) {
    console.error('Failed to parse cart storage:', e);
  }
}

function saveCartToStorage() {
  localStorage.setItem('mosladar_cart', JSON.stringify(state.cart));
  updateCartUI();
}

// Language Switcher Logic
function initLanguageToggle() {
  const toggleBtn = document.getElementById('lang-toggle-btn');
  const label = document.getElementById('lang-current-label');

  toggleBtn.addEventListener('click', () => {
    state.lang = state.lang === 'bn' ? 'en' : 'bn';
    label.textContent = state.lang === 'bn' ? 'EN' : 'বাং';
    document.documentElement.lang = state.lang;
    applyLanguage();
  });
}

function applyLanguage() {
  const dict = i18n[state.lang];
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n');
    if (dict[key]) {
      el.textContent = dict[key];
    }
  });

  // Re-render products to update bilingual titles/variants
  renderProducts();
  updateCartUI();
}

// Sticky Header Elevation
function initHeaderScroll() {
  const header = document.getElementById('site-header');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 20) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  });
}

// Event Listeners for Cart, Checkout, Modals, Search & Sort
function initEventListeners() {
  // Cart Drawer
  document.getElementById('cart-toggle-btn').addEventListener('click', openCartDrawer);
  document.getElementById('close-drawer-btn').addEventListener('click', closeCartDrawer);
  document.getElementById('drawer-backdrop').addEventListener('click', closeCartDrawer);
  document.getElementById('drawer-checkout-btn').addEventListener('click', () => {
    closeCartDrawer();
    openCheckoutModal();
  });

  // Category Tabs
  document.querySelectorAll('.tab-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.tab-btn').forEach((b) => b.classList.remove('active'));
      e.target.classList.add('active');
      state.currentCategory = e.target.getAttribute('data-cat');
      renderProducts();
    });
  });

  // Category Links in Header/Footer
  document.querySelectorAll('[data-category]').forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const cat = e.target.getAttribute('data-category');
      state.currentCategory = cat;
      document.querySelectorAll('.tab-btn').forEach((b) => {
        b.classList.toggle('active', b.getAttribute('data-cat') === cat);
      });
      renderProducts();
      document.getElementById('shop').scrollIntoView({ behavior: 'smooth' });
    });
  });

  // Live Product Search
  const searchInput = document.getElementById('product-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      state.searchQuery = e.target.value.toLowerCase().trim();
      renderProducts();
    });
  }

  // Product Sort Selection
  const sortSelect = document.getElementById('product-sort-select');
  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      state.sortBy = e.target.value;
      renderProducts();
    });
  }

  // Checkout Form Submission
  const checkoutForm = document.getElementById('checkout-form');
  checkoutForm.addEventListener('submit', handleCheckoutSubmit);

  // Order Tracking Form
  const trackForm = document.getElementById('order-track-form');
  trackForm.addEventListener('submit', handleTrackingSubmit);

  // Hero Quick Add Button
  const heroAddBtn = document.getElementById('hero-quick-add-btn');
  if (heroAddBtn) {
    heroAddBtn.addEventListener('click', () => {
      const activeProd = state.activeHeroProduct || state.products.find((p) => p.slug === 'chili-powder') || state.products[0];
      if (activeProd) {
        const vDef = activeProd.variants.find((v) => v.is_default === 1) || activeProd.variants[0];
        addToCart(activeProd, vDef, 1);
      }
    });
  }

  // Secret Admin Portal Trigger (3 clicks on মশলাদার)
  initSecretAdminTrigger();
}

// Secret Admin Triple Click Trigger Handler
function initSecretAdminTrigger() {
  const triggerEl = document.getElementById('admin-secret-trigger');
  const footerWrap = document.getElementById('footer-copyright-trigger');
  let clickCount = 0;
  let clickTimer = null;

  function triggerAdminRedirect() {
    clickCount = 0;
    clearTimeout(clickTimer);
    showToast('🔒 অ্যাডমিন পোর্টাল ওপেন হচ্ছে...');
    setTimeout(() => {
      window.location.href = '/admin';
    }, 280);
  }

  function handleAdminClick(e) {
    clickCount++;
    clearTimeout(clickTimer);

    if (clickCount >= 3) {
      triggerAdminRedirect();
      return;
    }

    // Reset count if user doesn't complete 3 clicks within 1.5 seconds
    clickTimer = setTimeout(() => {
      clickCount = 0;
    }, 1500);
  }

  if (triggerEl) {
    triggerEl.addEventListener('click', (e) => {
      e.stopPropagation();
      handleAdminClick(e);
    });
  }

  if (footerWrap) {
    footerWrap.addEventListener('click', (e) => {
      handleAdminClick(e);
    });
  }

  // Keyboard shortcut: Ctrl+Shift+A or Cmd+Shift+A
  window.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
      e.preventDefault();
      triggerAdminRedirect();
    }
  });
}

// Fetch Products from API
async function fetchProducts() {
  try {
    const res = await fetch('/api/products');
    if (!res.ok) throw new Error('API network response not ok');
    const data = await res.json();
    state.products = data;

    // Set default selected variant and quantity (1) for each product
    for (const p of data) {
      const def = p.variants.find((v) => v.is_default === 1) || p.variants[0];
      if (def) {
        state.selectedVariants[p.id] = def.id;
      }
      state.cardQuantities[p.id] = 1;
    }

    initHeroSpiceSwitcher();
    renderProducts();
  } catch (err) {
    console.error('Failed to fetch products:', err);
    document.getElementById('products-grid').innerHTML = `
      <div style="grid-column: 1/-1; text-align:center; padding: 40px; color: var(--c-danger);">
        <p>পণ্য লোড করতে সাময়িক সমস্যা হয়েছে। পৃষ্ঠাটি রিফ্রেশ করুন।</p>
      </div>
    `;
  }
}

// Initialize Interactive Hero 7-Spice Switcher
function initHeroSpiceSwitcher() {
  const container = document.getElementById('hero-spice-switcher');
  if (!container || state.products.length === 0) return;

  const isBn = state.lang === 'bn';
  const defaultHero = state.products.find((p) => p.slug === 'chili-powder') || state.products[0];
  state.activeHeroProduct = defaultHero;

  container.innerHTML = state.products.map((p) => {
    const isActive = p.id === defaultHero.id;
    const name = isBn ? p.name_bn : p.name_en;
    return `
      <button 
        type="button" 
        class="hero-chip-btn ${isActive ? 'active' : ''}" 
        id="hero-chip-${p.id}"
        onclick="switchHeroProduct(${p.id})"
        aria-label="${name}"
      >
        <span class="chip-dot"></span>
        <span>${name}</span>
      </button>
    `;
  }).join('');
}

// Switch Featured Product on Hero Card
window.switchHeroProduct = function(productId) {
  const product = state.products.find((p) => p.id === productId);
  if (!product) return;
  state.activeHeroProduct = product;

  const isBn = state.lang === 'bn';
  const defaultVar = product.variants.find((v) => v.is_default === 1) || product.variants[0];

  const imgEl = document.getElementById('hero-featured-img');
  const nameEl = document.getElementById('hero-caption-name');
  const subEl = document.getElementById('hero-caption-sub');
  const priceEl = document.getElementById('hero-quick-price');
  const badgeEl = document.getElementById('hero-stage-badge');

  if (imgEl) {
    imgEl.style.opacity = '0.4';
    imgEl.src = product.primary_image;
    imgEl.alt = `${product.name_bn} ${defaultVar ? defaultVar.weight_label : ''}`;
    setTimeout(() => { imgEl.style.opacity = '1'; }, 150);
  }

  if (nameEl) nameEl.textContent = `${isBn ? product.name_bn : product.name_en} (${defaultVar ? defaultVar.weight_label : ''})`;
  if (subEl) subEl.textContent = isBn ? product.short_desc_bn : product.short_desc_en;
  if (priceEl && defaultVar) priceEl.textContent = `৳${defaultVar.price}`;
  if (badgeEl) badgeEl.textContent = product.badge || (isBn ? 'প্রিমিয়াম মশলা' : 'Premium Spice');

  // Update active chip button
  document.querySelectorAll('.hero-chip-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.id === `hero-chip-${productId}`);
  });
};

// Render Product Grid with Search, Filter & Sort
function renderProducts() {
  const grid = document.getElementById('products-grid');
  if (!grid || state.products.length === 0) return;

  const isBn = state.lang === 'bn';

  // 1. Filter by category
  let list = state.products.filter((p) => {
    if (state.currentCategory === 'all') return true;
    return p.category === state.currentCategory;
  });

  // 2. Filter by search query
  if (state.searchQuery) {
    const q = state.searchQuery;
    list = list.filter((p) => {
      const bnMatch = p.name_bn.toLowerCase().includes(q) || (p.short_desc_bn && p.short_desc_bn.toLowerCase().includes(q));
      const enMatch = p.name_en.toLowerCase().includes(q) || (p.short_desc_en && p.short_desc_en.toLowerCase().includes(q));
      const slugMatch = p.slug.toLowerCase().includes(q);
      const catMatch = p.category.toLowerCase().includes(q);
      return bnMatch || enMatch || slugMatch || catMatch;
    });
  }

  // 3. Sort list
  if (state.sortBy === 'price-asc') {
    list.sort((a, b) => {
      const pA = a.variants.find((v) => v.is_default === 1)?.price || a.variants[0]?.price || 0;
      const pB = b.variants.find((v) => v.is_default === 1)?.price || b.variants[0]?.price || 0;
      return pA - pB;
    });
  } else if (state.sortBy === 'price-desc') {
    list.sort((a, b) => {
      const pA = a.variants.find((v) => v.is_default === 1)?.price || a.variants[0]?.price || 0;
      const pB = b.variants.find((v) => v.is_default === 1)?.price || b.variants[0]?.price || 0;
      return pB - pA;
    });
  } else if (state.sortBy === 'name') {
    list.sort((a, b) => (isBn ? a.name_bn.localeCompare(b.name_bn) : a.name_en.localeCompare(b.name_en)));
  } else {
    // Default featured
    list.sort((a, b) => (b.is_featured - a.is_featured) || (a.id - b.id));
  }

  if (list.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1/-1; text-align:center; padding: 48px 20px; background: #FFFFFF; border-radius: var(--radius-md); border: 1px dashed var(--c-border);">
        <p style="font-size: 1.1rem; color: var(--c-text-secondary); margin-bottom: 8px;">
          ${isBn ? '“' + state.searchQuery + '” দিয়ে কোনো মশলা খুঁজে পাওয়া যায়নি।' : 'No spices found matching "' + state.searchQuery + '".'}
        </p>
        <button type="button" class="btn-secondary" onclick="document.getElementById('product-search-input').value=''; state.searchQuery=''; renderProducts();">
          ${isBn ? 'সকল মশলা দেখুন' : 'View All Spices'}
        </button>
      </div>
    `;
    return;
  }

  grid.innerHTML = list.map((p) => {
    const selectedVariantId = state.selectedVariants[p.id] || p.variants[0]?.id;
    const activeVariant = p.variants.find((v) => v.id === selectedVariantId) || p.variants[0];
    const name = isBn ? p.name_bn : p.name_en;
    const shortDesc = isBn ? p.short_desc_bn : p.short_desc_en;
    const catLabel = p.category === 'powder' ? (isBn ? 'গুঁড়া মশলা' : 'Spice Powder') : (isBn ? 'বাটা মশলা' : 'Fresh Paste');
    const curQty = state.cardQuantities[p.id] || 1;

    // Variants HTML
    const variantsHtml = p.variants.map((v) => {
      const isSelected = v.id === activeVariant.id;
      return `
        <button 
          type="button" 
          class="variant-chip ${isSelected ? 'active' : ''}" 
          onclick="handleVariantSelect(${p.id}, ${v.id})"
          aria-label="${v.weight_label}"
        >
          ${v.weight_label}
        </button>
      `;
    }).join('');

    return `
      <article class="product-card" id="product-card-${p.slug}">
        ${p.badge ? `<span class="product-card-badge">${p.badge}</span>` : ''}
        
        <div class="product-img-container" onclick="openProductModal(${p.id})">
          <img 
            src="${p.primary_image}" 
            alt="${name}" 
            class="product-thumbnail" 
            loading="lazy"
            width="320" 
            height="320"
          >
          <button type="button" class="product-quick-view-btn" onclick="event.stopPropagation(); openProductModal(${p.id})">
            ${isBn ? 'বিস্তারিত দেখুন' : 'Quick View'}
          </button>
        </div>

        <span class="product-category-label">${catLabel}</span>
        <h3 class="product-title" onclick="openProductModal(${p.id})">${name}</h3>
        <p class="product-short-desc">${shortDesc}</p>

        <div class="variant-selector">
          ${variantsHtml}
        </div>

        <div class="product-card-controls">
          <div class="card-qty-row">
            <div class="product-price-box">
              <span class="price-currency" id="price-val-${p.id}">৳${activeVariant.price}</span>
              <span class="stock-tag">${isBn ? 'ইন স্টক' : 'In Stock'}</span>
            </div>

            <div class="qty-stepper">
              <button type="button" class="qty-btn" onclick="changeCardQty(${p.id}, -1)" aria-label="পরিমাণ কমান">−</button>
              <span class="qty-num" id="card-qty-${p.id}">${curQty}</span>
              <button type="button" class="qty-btn" onclick="changeCardQty(${p.id}, 1)" aria-label="পরিমাণ বাড়ান">+</button>
            </div>
          </div>

          <div class="card-action-btns-row">
            <button 
              type="button" 
              class="btn-card-add" 
              onclick="handleCardAddCart(${p.id})"
              id="add-cart-${p.slug}"
              title="ব্যাগে যোগ করুন"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 5v14M5 12h14"/></svg>
              <span>${isBn ? 'ব্যাগে নিন' : 'Add to Bag'}</span>
            </button>

            <button 
              type="button" 
              class="btn-card-buynow" 
              onclick="handleCardBuyNow(${p.id})"
              id="buynow-${p.slug}"
              title="সরাসরি অর্ডার করুন"
            >
              <span>⚡ ${isBn ? 'অর্ডার করুন' : 'Buy Now'}</span>
            </button>
          </div>
        </div>
      </article>
    `;
  }).join('');
}

// Adjust Quantity on Product Card
window.changeCardQty = function(productId, delta) {
  const current = state.cardQuantities[productId] || 1;
  const next = Math.max(1, Math.min(99, current + delta));
  state.cardQuantities[productId] = next;
  const el = document.getElementById(`card-qty-${productId}`);
  if (el) el.textContent = next;
};

// Direct 1-Click Buy Now from Card
window.handleCardBuyNow = function(productId) {
  const product = state.products.find((p) => p.id === productId);
  if (!product) return;
  const variantId = state.selectedVariants[productId] || product.variants[0]?.id;
  const variant = product.variants.find((v) => v.id === variantId) || product.variants[0];
  const qty = state.cardQuantities[productId] || 1;

  addToCart(product, variant, qty);
  openCheckoutModal();
};

// Add Bundle to Cart
window.addBundleToCart = function(bundleType) {
  if (state.products.length === 0) return;

  if (bundleType === 'trio') {
    // Onion Paste (250g), Ginger Paste (250g), Garlic Paste (250g)
    const onion = state.products.find((p) => p.slug === 'onion-paste');
    const ginger = state.products.find((p) => p.slug === 'ginger-paste');
    const garlic = state.products.find((p) => p.slug === 'garlic-paste');

    if (onion) addToCart(onion, onion.variants[0], 1);
    if (ginger) addToCart(ginger, ginger.variants[0], 1);
    if (garlic) addToCart(garlic, garlic.variants[0], 1);

    showToast(state.lang === 'bn' ? '🎉 কিচেন বাটা ত্রয়ীর সকল মশলা ব্যাগে যোগ হয়েছে!' : 'Added Kitchen Trio Paste pack to bag!');
  } else if (bundleType === 'quad') {
    // Chili 100g, Turmeric 100g, Coriander 100g, Cumin 100g
    const chili = state.products.find((p) => p.slug === 'chili-powder');
    const turmeric = state.products.find((p) => p.slug === 'turmeric-powder');
    const coriander = state.products.find((p) => p.slug === 'coriander-powder');
    const cumin = state.products.find((p) => p.slug === 'cumin-powder');

    const add100g = (p) => {
      if (!p) return;
      const v = p.variants.find((item) => item.weight_label === '100g') || p.variants[0];
      addToCart(p, v, 1);
    };

    add100g(chili);
    add100g(turmeric);
    add100g(coriander);
    add100g(cumin);

    showToast(state.lang === 'bn' ? '🎉 দৈনন্দিন ৪ গুঁড়া প্যাক ব্যাগে যোগ হয়েছে!' : 'Added Powder Quad pack to bag!');
  } else if (bundleType === 'mega') {
    // All 7 spices
    for (const p of state.products) {
      const def = p.variants.find((v) => v.is_default === 1) || p.variants[0];
      if (def) addToCart(p, def, 1);
    }
    showToast(state.lang === 'bn' ? '🎉 রাজকীয় মেগা বান্ডেল (৭টি পণ্য) ব্যাগে যোগ হয়েছে!' : 'Added Grand Mega 7-Spice bundle to bag!');
  }

  openCartDrawer();
};

// Add Recipe Spices Kit to Cart
window.addRecipeSpices = function(recipeType) {
  if (state.products.length === 0) return;

  const addP = (slug, weight) => {
    const p = state.products.find((item) => item.slug === slug);
    if (!p) return;
    const v = p.variants.find((item) => item.weight_label === weight) || p.variants[0];
    addToCart(p, v, 1);
  };

  if (recipeType === 'kala-bhuna') {
    addP('chili-powder', '100g');
    addP('cumin-powder', '100g');
    addP('garlic-paste', '250g');
    addP('onion-paste', '250g');
    showToast(state.lang === 'bn' ? '🍲 কালা ভুনার স্পেশাল মশলা সেট ব্যাগে যোগ হয়েছে!' : 'Added Kala Bhuna recipe spices to bag!');
  } else if (recipeType === 'shahi-roast') {
    addP('onion-paste', '250g');
    addP('ginger-paste', '250g');
    addP('garlic-paste', '250g');
    addP('cumin-powder', '100g');
    showToast(state.lang === 'bn' ? '🍗 শাহী রোস্টের স্পেশাল মশলা সেট ব্যাগে যোগ হয়েছে!' : 'Added Shahi Roast recipe spices to bag!');
  } else if (recipeType === 'shorshe-ilish') {
    addP('turmeric-powder', '100g');
    addP('coriander-powder', '100g');
    addP('ginger-paste', '250g');
    showToast(state.lang === 'bn' ? '🐟 সর্ষে ইলিশের মশলা সেট ব্যাগে যোগ হয়েছে!' : 'Added Shorshe Ilish recipe spices to bag!');
  }

  openCartDrawer();
};

// Variant Selection
window.handleVariantSelect = function(productId, variantId) {
  state.selectedVariants[productId] = variantId;
  const product = state.products.find((p) => p.id === productId);
  if (!product) return;
  const variant = product.variants.find((v) => v.id === variantId);
  if (!variant) return;

  // Update price on the card
  const priceEl = document.getElementById(`price-val-${productId}`);
  if (priceEl) {
    priceEl.textContent = `৳${variant.price}`;
  }

  // Update active chip classes
  const card = document.getElementById(`product-card-${product.slug}`);
  if (card) {
    const chips = card.querySelectorAll('.variant-chip');
    chips.forEach((c) => {
      c.classList.toggle('active', c.textContent.trim() === variant.weight_label);
    });
  }
};

// Add to Cart from Grid Card
window.handleCardAddCart = function(productId) {
  const product = state.products.find((p) => p.id === productId);
  if (!product) return;
  const variantId = state.selectedVariants[productId] || product.variants[0]?.id;
  const variant = product.variants.find((v) => v.id === variantId) || product.variants[0];
  addToCart(product, variant, 1);
};

// Core Cart Operations
function addToCart(product, variant, quantity = 1) {
  const existingIdx = state.cart.findIndex((item) => item.variantId === variant.id);
  const qty = parseInt(quantity, 10);

  if (existingIdx > -1) {
    state.cart[existingIdx].quantity += qty;
  } else {
    state.cart.push({
      variantId: variant.id,
      productId: product.id,
      name_bn: product.name_bn,
      name_en: product.name_en,
      weight_label: variant.weight_label,
      price: variant.price,
      quantity: qty,
      image: product.primary_image,
    });
  }

  saveCartToStorage();
  showToast(state.lang === 'bn' ? `"${product.name_bn} (${variant.weight_label})" ব্যাগে যোগ করা হয়েছে!` : `Added "${product.name_en} (${variant.weight_label})" to bag!`);
  openCartDrawer();
}

window.changeCartQty = function(variantId, delta) {
  const idx = state.cart.findIndex((i) => i.variantId === variantId);
  if (idx === -1) return;

  state.cart[idx].quantity += delta;
  if (state.cart[idx].quantity <= 0) {
    state.cart.splice(idx, 1);
  }
  saveCartToStorage();
};

window.removeFromCart = function(variantId) {
  state.cart = state.cart.filter((i) => i.variantId !== variantId);
  saveCartToStorage();
  showToast(state.lang === 'bn' ? 'পণ্যটি ব্যাগ থেকে সরানো হয়েছে' : 'Item removed from bag');
};

// Update Cart UI everywhere
function updateCartUI() {
  const isBn = state.lang === 'bn';
  const totalCount = state.cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = state.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  // Header badge
  const headerBadge = document.getElementById('header-cart-count');
  if (headerBadge) headerBadge.textContent = totalCount;

  // Drawer list
  const container = document.getElementById('cart-items-container');
  const footer = document.getElementById('cart-drawer-footer');

  if (!container) return;

  if (state.cart.length === 0) {
    container.innerHTML = `
      <div class="cart-empty-state">
        <div class="empty-icon">🛒</div>
        <p style="color: var(--c-text-secondary); font-size: 1.05rem;">
          ${isBn ? 'আপনার শপিং ব্যাগ বর্তমানে খালি।' : 'Your shopping bag is empty.'}
        </p>
        <button type="button" class="btn-primary" style="margin-top: 18px;" onclick="closeCartDrawer()">
          ${isBn ? 'মশলা পছন্দ করুন' : 'Start Shopping'}
        </button>
      </div>
    `;
    if (footer) footer.style.display = 'none';
  } else {
    container.innerHTML = state.cart.map((item) => {
      const title = isBn ? item.name_bn : item.name_en;
      return `
        <div class="cart-item-row" id="cart-item-${item.variantId}">
          <div class="cart-item-thumb">
            <img src="${item.image}" alt="${title}">
          </div>
          <div class="cart-item-info">
            <h4>${title}</h4>
            <span class="cart-item-weight">${item.weight_label}</span>
            <div class="cart-item-price">৳${item.price} x ${item.quantity} = <strong>৳${item.price * item.quantity}</strong></div>
            <button type="button" class="remove-item-btn" onclick="removeFromCart(${item.variantId})">
              ${isBn ? 'মুছে ফেলুন' : 'Remove'}
            </button>
          </div>
          <div class="cart-item-qty">
            <button type="button" class="qty-btn" onclick="changeCartQty(${item.variantId}, -1)">−</button>
            <span class="qty-val">${item.quantity}</span>
            <button type="button" class="qty-btn" onclick="changeCartQty(${item.variantId}, 1)">+</button>
          </div>
        </div>
      `;
    }).join('');

    if (footer) {
      footer.style.display = 'block';
      document.getElementById('cart-drawer-subtotal').textContent = `৳${subtotal}`;
      const estTotal = subtotal + state.deliveryFee;
      document.getElementById('cart-drawer-total').textContent = `৳${estTotal}`;
    }
  }

  // Update Mobile Sticky Bottom Bar summary
  const mobileBar = document.getElementById('mobile-cart-summary');
  if (mobileBar) {
    mobileBar.textContent = `${totalCount} ${isBn ? 'টি পণ্য' : 'items'} • ৳${subtotal}`;
  }

  // Update Checkout Modal summary if open
  updateCheckoutSummary();
}

function updateCheckoutSummary() {
  const subtotal = state.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const total = subtotal + state.deliveryFee;

  const subEl = document.getElementById('checkout-subtotal');
  const feeEl = document.getElementById('checkout-delivery-fee');
  const grandEl = document.getElementById('checkout-grand-total');

  if (subEl) subEl.textContent = `৳${subtotal}`;
  if (feeEl) feeEl.textContent = `৳${state.deliveryFee}`;
  if (grandEl) grandEl.textContent = `৳${total}`;
}

// Drawer Open / Close
function openCartDrawer() {
  document.getElementById('drawer-backdrop').classList.add('active');
  document.getElementById('cart-drawer').classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeCartDrawer() {
  document.getElementById('drawer-backdrop').classList.remove('active');
  document.getElementById('cart-drawer').classList.remove('active');
  document.body.style.overflow = '';
}

// Product Quick View Modal
window.openProductModal = function(productId) {
  const p = state.products.find((prod) => prod.id === productId);
  if (!p) return;

  const isBn = state.lang === 'bn';
  const name = isBn ? p.name_bn : p.name_en;
  const desc = isBn ? p.full_desc_bn : p.full_desc_en;
  const selectedVariantId = state.selectedVariants[p.id] || p.variants[0].id;
  const activeVariant = p.variants.find((v) => v.id === selectedVariantId) || p.variants[0];

  document.getElementById('modal-product-title').textContent = name;

  const body = document.getElementById('modal-product-body');
  body.innerHTML = `
    <div style="display: grid; grid-template-columns: 1fr 1.2fr; gap: 24px; align-items: start;">
      <div style="background: var(--c-cream); border-radius: var(--radius-md); padding: 18px; text-align: center;">
        <img src="${p.primary_image}" alt="${name}" style="max-height: 280px; margin: 0 auto; object-fit: contain;">
        ${p.lifestyle_image ? `
          <div style="margin-top: 14px; text-align: left;">
            <small style="color: var(--c-text-muted); font-weight: 600;">রন্ধনশৈলী পরিবেশন (Culinary Preview):</small>
            <img src="${p.lifestyle_image}" alt="Culinary Context" style="height: 60px; border-radius: 6px; border: 1px solid var(--c-border); margin-top: 4px; object-fit: cover;">
          </div>
        ` : ''}
      </div>

      <div>
        <span class="product-category-label">${p.category === 'powder' ? 'গুঁড়া মশলা' : 'বাটা মশলা'}</span>
        <h2 style="font-size: 1.5rem; color: var(--c-forest-dark); margin-bottom: 8px;">${name}</h2>
        <p style="color: var(--c-text-secondary); font-size: 0.94rem; line-height: 1.6; margin-bottom: 16px;">${desc}</p>
        
        <div style="margin-bottom: 14px;">
          <label style="font-size: 0.85rem; font-weight: 700; display: block; margin-bottom: 6px;">প্যাকেট সাইজ নির্বাচন করুন:</label>
          <div class="variant-selector">
            ${p.variants.map((v) => `
              <button 
                type="button" 
                class="variant-chip ${v.id === activeVariant.id ? 'active' : ''}"
                onclick="handleModalVariantChange(${p.id}, ${v.id})"
              >
                ${v.weight_label}
              </button>
            `).join('')}
          </div>
        </div>

        <div style="display: flex; align-items: center; justify-content: space-between; border-top: 1px solid var(--c-border); padding-top: 16px; margin-top: 16px;">
          <div>
            <span style="font-size: 1.6rem; font-weight: 800; color: var(--c-forest-dark);" id="modal-price-val">৳${activeVariant.price}</span>
            <div style="font-size: 0.78rem; color: var(--c-success); font-weight: 600;">ইন স্টক (তাজা সরবরাহ)</div>
          </div>

          <button type="button" class="btn-primary" onclick="handleModalAddCart(${p.id})">
            ${isBn ? 'ব্যাগে যোগ করুন' : 'Add to Bag'}
          </button>
        </div>
      </div>
    </div>
  `;

  document.getElementById('product-detail-modal').classList.add('active');
};

window.closeProductModal = function() {
  document.getElementById('product-detail-modal').classList.remove('active');
};

window.handleModalVariantChange = function(productId, variantId) {
  handleVariantSelect(productId, variantId);
  const p = state.products.find((prod) => prod.id === productId);
  if (!p) return;
  const v = p.variants.find((item) => item.id === variantId);
  if (!v) return;

  const priceEl = document.getElementById('modal-price-val');
  if (priceEl) priceEl.textContent = `৳${v.price}`;

  const chips = document.getElementById('product-detail-modal').querySelectorAll('.variant-chip');
  chips.forEach((c) => {
    c.classList.toggle('active', c.textContent.trim() === v.weight_label);
  });
};

window.handleModalAddCart = function(productId) {
  handleCardAddCart(productId);
  closeProductModal();
};

// Checkout Modal Open / Close
function openCheckoutModal() {
  if (state.cart.length === 0) {
    showToast(state.lang === 'bn' ? 'আপনার ব্যাগ খালি!' : 'Cart is empty!', true);
    return;
  }
  updateCheckoutSummary();
  document.getElementById('checkout-modal').classList.add('active');
}

window.closeCheckoutModal = function() {
  document.getElementById('checkout-modal').classList.remove('active');
};

// Delivery Zone Radio Change
window.handleZoneChange = function(zone) {
  state.selectedZone = zone;
  state.deliveryFee = zone === 'inside_dhaka' ? 70 : 150;

  document.getElementById('zone-inside-card').classList.toggle('selected', zone === 'inside_dhaka');
  document.getElementById('zone-outside-card').classList.toggle('selected', zone === 'outside_dhaka');

  updateCheckoutSummary();
};

// Payment Method Selection
window.selectPaymentMethod = function(method) {
  state.selectedPayment = method;

  const cards = ['pay-cod-card', 'pay-bkash-card', 'pay-nagad-card'];
  cards.forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.classList.remove('selected');
  });

  const activeCard = document.getElementById(`pay-${method}-card`);
  if (activeCard) activeCard.classList.add('selected');

  const infoBox = document.getElementById('payment-instruction-box');
  if (method === 'cod') {
    infoBox.textContent = 'পণ্য হাতে পেয়ে সম্পূর্ণ মূল্য ডেলিভারি ম্যানকে ক্যাশ পরিশোধ করুন।';
    infoBox.style.color = 'var(--c-forest-dark)';
  } else {
    infoBox.textContent = `অর্ডার কনফার্মেশনের পর আমাদের কাস্টমার প্রতিনিধি আপনার নম্বরে যোগাযোগ করে অফিসিয়াল ${method.toUpperCase()} মার্চেন্ট পেমেন্ট লিংক বা নির্দেশনা প্রদান করবেন। কোনো ভুয়া ট্রানজেকশন ছাড়া কোনো পেমেন্ট সফল বলে গণ্য হবে না।`;
    infoBox.style.color = 'var(--c-warning)';
  }
};

// Checkout Form Submission
async function handleCheckoutSubmit(e) {
  e.preventDefault();
  const submitBtn = document.getElementById('confirm-order-submit-btn');
  submitBtn.disabled = true;
  submitBtn.textContent = state.lang === 'bn' ? 'অর্ডার প্রসেস হচ্ছে...' : 'Processing Order...';

  const customer_name = document.getElementById('checkout-name').value;
  const customer_phone = document.getElementById('checkout-phone').value;
  const delivery_address = document.getElementById('checkout-address').value;
  const order_notes = document.getElementById('checkout-notes').value;

  const payload = {
    customer_name,
    customer_phone,
    delivery_address,
    delivery_zone: state.selectedZone,
    payment_method: state.selectedPayment,
    order_notes,
    items: state.cart.map((item) => ({
      variant_id: item.variantId,
      quantity: item.quantity,
    })),
  };

  try {
    const res = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Checkout submission failed');
    }

    // Success!
    closeCheckoutModal();
    state.cart = [];
    saveCartToStorage();

    // Populate Success Modal
    document.getElementById('success-order-code').textContent = data.order_code;
    document.getElementById('success-order-total').textContent = `৳${data.total_amount}`;
    document.getElementById('success-payment-method').textContent = data.payment_method.toUpperCase();
    document.getElementById('success-delivery-addr').textContent = `${delivery_address} (${data.delivery_fee === 70 ? 'ঢাকার ভেতরে' : 'ঢাকার বাইরে'})`;

    // WhatsApp Action Button
    const waBtn = document.getElementById('success-whatsapp-btn');
    waBtn.href = `https://wa.me/8801753028052?text=${data.whatsapp_text}`;

    document.getElementById('order-success-modal').classList.add('active');
  } catch (err) {
    console.error('Order error:', err);
    showToast(err.message, true);
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = state.lang === 'bn' ? 'অর্ডার নিশ্চিত করুন (Confirm Order)' : 'Confirm Order';
  }
}

window.closeSuccessModal = function() {
  document.getElementById('order-success-modal').classList.remove('active');
};

// Customer Protected Order Tracking
async function handleTrackingSubmit(e) {
  e.preventDefault();
  const code = document.getElementById('track-code-input').value;
  const phone = document.getElementById('track-phone-input').value;
  const resultBox = document.getElementById('track-result-box');
  const btn = document.getElementById('track-submit-btn');

  btn.disabled = true;
  btn.textContent = 'খোঁজা হচ্ছে...';

  try {
    const res = await fetch('/api/orders/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order_code: code, phone }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Tracking lookup failed');
    }

    resultBox.style.display = 'block';
    resultBox.innerHTML = `
      <div style="background: var(--c-cream); border: 1.5px solid var(--c-border); border-radius: var(--radius-sm); padding: 18px;">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--c-border); padding-bottom: 10px; margin-bottom: 12px;">
          <div>
            <span style="font-size: 0.82rem; color: var(--c-text-muted);">অর্ডার কোড:</span>
            <strong style="color: var(--c-forest-dark); font-size: 1.15rem; display: block;">${data.order_code}</strong>
          </div>
          <div>
            <span style="background: var(--c-forest-soft); color: var(--c-forest-green); font-size: 0.85rem; font-weight: 800; padding: 4px 12px; border-radius: var(--radius-pill); text-transform: uppercase;">
              ${data.order_status}
            </span>
          </div>
        </div>

        <p style="font-size: 0.92rem; margin-bottom: 6px;"><strong>ক্রেতা:</strong> ${data.customer_name}</p>
        <p style="font-size: 0.92rem; margin-bottom: 6px;"><strong>ঠিকানা:</strong> ${data.delivery_address}</p>
        <p style="font-size: 0.92rem; margin-bottom: 12px;"><strong>সর্বমোট বিল:</strong> ৳${data.total_amount} (${data.payment_method.toUpperCase()} - ${data.payment_status})</p>

        <h4 style="font-size: 0.95rem; font-weight: 700; margin-bottom: 8px; color: var(--c-forest-dark);">অর্ডারের পণ্যসমূহ:</h4>
        <ul style="list-style: none; margin-bottom: 16px;">
          ${data.items.map((i) => `
            <li style="display: flex; justify-content: space-between; font-size: 0.88rem; padding: 4px 0; border-bottom: 1px dashed var(--c-border-light);">
              <span>• ${i.product_name_bn} (${i.weight_label}) x ${i.quantity}</span>
              <strong>৳${i.total_price}</strong>
            </li>
          `).join('')}
        </ul>

        <h4 style="font-size: 0.95rem; font-weight: 700; margin-bottom: 8px; color: var(--c-forest-dark);">বর্তমান স্ট্যাটাস হিস্ট্রি:</h4>
        <div class="status-timeline">
          ${data.history.map((h) => `
            <div class="timeline-step active">
              <div class="timeline-status-name">${h.new_status.toUpperCase()}</div>
              <div class="timeline-time">${new Date(h.created_at).toLocaleString('bn-BD')} — ${h.comment || ''}</div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  } catch (err) {
    resultBox.style.display = 'block';
    resultBox.innerHTML = `
      <div style="background: var(--c-terracotta-soft); border: 1px solid var(--c-terracotta); border-radius: var(--radius-sm); padding: 14px; color: var(--c-danger); font-size: 0.92rem;">
        ${err.message}
      </div>
    `;
  } finally {
    btn.disabled = false;
    btn.textContent = state.lang === 'bn' ? 'অর্ডারের অবস্থান ট্র্যাক করুন' : 'Track Order Status';
  }
}

// Policy Modals Handler
window.openPolicyModal = function(type) {
  const modal = document.getElementById('policy-modal');
  const title = document.getElementById('policy-modal-title');
  const content = document.getElementById('policy-modal-content');

  const policies = {
    shipping: {
      title: 'ডেলিভারি সংক্রান্ত তথ্যাবলী (Shipping Policy)',
      html: `
        <p><strong>১. ডেলিভারি এলাকা:</strong> মশলাদার সমগ্র বাংলাদেশে নির্ভরযোগ্য কুরিয়ার ও নিজস্ব ডেলিভারি নেটওয়ার্কের মাধ্যমে হোম ডেলিভারি প্রদান করে।</p>
        <p><strong>২. ডেলিভারি চার্জ:</strong><br>
        • ঢাকার ভেতরে: মাত্র ৳৭০ (২ থেকে ৩ কার্যদিবস)<br>
        • ঢাকার বাইরে (সারাদেশ): ৳১৫০ (৩ থেকে ৫ কার্যদিবস)</p>
        <p><strong>৩. প্যাকেজিং নিরাপত্তা:</strong> প্রতিটি গুঁড়া মশলা বাতাসরোধী ফুড-গ্রেড পাউচে এবং বাটা পেস্টসমূহ ফুড-গ্রেড প্লাস্টিক কন্টেইনারে সিল করা অবস্থায় প্রেরিত হয়।</p>
      `
    },
    refund: {
      title: 'রিটার্ন ও রিফান্ড নীতি (Return & Refund Policy)',
      html: `
        <p><strong>১. প্যাকেজ পরীক্ষা:</strong> ডেলিভারি ম্যানের উপস্থিতিতে পণ্য পরীক্ষা করে গ্রহণ করার অনুরোধ জানানো হচ্ছে।</p>
        <p><strong>২. রিটার্ন শর্ত:</strong> যদি পণ্যের সিল কাটা, কন্টেইনার ভাঙা কিংবা ভুল পণ্য সরবরাহ করা হয়ে থাকে, তবে তাৎক্ষণিকভাবে ডেলিভারি ম্যানের কাছে ফেরত দিন অথবা গ্রহণের ৪৮ ঘণ্টার মধ্যে আমাদের হটলাইনে (০১৭৫৩০২৮০৫২) যোগাযোগ করুন।</p>
        <p><strong>৩. রিফান্ড:</strong> যাচাইপূর্বক ৩ থেকে ৫ কার্যদিবসের মধ্যে আপনার পেমেন্ট বা নতুন পণ্য প্রতিস্থাপন সম্পন্ন করা হবে।</p>
      `
    },
    privacy: {
      title: 'গোপনীয়তা নীতি (Privacy Policy)',
      html: `
        <p><strong>১. তথ্যের গোপনীয়তা:</strong> অর্ডার প্রক্রিয়াকরণ এবং হোম ডেলিভারি পৌঁছে দেওয়ার জন্য প্রয়োজনীয় নাম, মোবাইল নম্বর এবং ঠিকানা ছাড়া আমরা অন্য কোনো অননুমোদিত তথ্য সংরক্ষণ করি না।</p>
        <p><strong>২. তৃতীয় পক্ষ:</strong> আপনার ব্যক্তিগত তথ্য কোনো বাণিজ্যিক উদ্দেশ্যে তৃতীয় পক্ষের কাছে বিক্রি বা হস্তান্তর করা হয় না।</p>
        <p><strong>৩. সুরক্ষিত যোগাযোগ:</strong> সমস্ত অর্ডার ডেটা এনক্রিপ্টেড ডাটাবেসে সুরক্ষিত রাখা হয়।</p>
      `
    },
    terms: {
      title: 'সেবার শর্তাবলী (Terms & Conditions)',
      html: `
        <p><strong>১. পণ্যের সততা:</strong> মশলাদার কোনো প্রকার কৃত্রিম রাসায়নিক, অপ্রমাণিত ভেষজ বা অসত্য দাবি প্রদর্শন করে না। প্রদর্শিত সকল মূল্য এবং ভ্যারিয়েন্ট ডাটাবেস দ্বারা যাচাইকৃত।</p>
        <p><strong>২. ক্যাশ অন ডেলিভারি:</strong> ক্যাশ অন ডেলিভারির ক্ষেত্রে পণ্য প্রাপ্তির সময় সঠিক মূল্য পরিশোধ করা গ্রাহকের দায়িত্ব।</p>
        <p><strong>৩. ট্রেডমার্ক:</strong> “মশলাদার” এবং এর অফিশিয়াল লোগো আইনত সংরক্ষিত।</p>
      `
    }
  };

  const p = policies[type] || policies.shipping;
  title.textContent = p.title;
  content.innerHTML = p.html;
  modal.classList.add('active');
};

window.closePolicyModal = function() {
  document.getElementById('policy-modal').classList.remove('active');
};

// Toast Notifications
function showToast(message, isError = false) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${isError ? 'error' : ''}`;
  toast.innerHTML = `
    <span>${isError ? '⚠️' : '✓'}</span>
    <span>${message}</span>
  `;

  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(16px)';
    setTimeout(() => toast.remove(), 300);
  }, 3200);
}
