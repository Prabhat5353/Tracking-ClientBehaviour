/**
 * Lumina Storefront Interactive Controller
 */
document.addEventListener('DOMContentLoaded', () => {
  const productsGrid = document.getElementById('productsGrid');
  const searchInput = document.getElementById('navSearchInput');
  const sortSelect = document.getElementById('sortSelect');
  const catTabs = document.querySelectorAll('.cat-tab');
  const cartToggleBtn = document.getElementById('btnCartToggle');
  const cartDrawerBackdrop = document.getElementById('cartDrawerBackdrop');
  const cartCloseBtn = document.getElementById('btnCartClose');
  const cartItemsContainer = document.getElementById('cartItemsContainer');
  const cartBadgeCount = document.getElementById('cartBadgeCount');
  const cartSubtotalEl = document.getElementById('cartSubtotal');
  const cartDiscountRow = document.getElementById('cartDiscountRow');
  const cartDiscountEl = document.getElementById('cartDiscount');
  const cartShippingEl = document.getElementById('cartShipping');
  const cartTaxEl = document.getElementById('cartTax');
  const cartTotalEl = document.getElementById('cartTotal');
  const couponInput = document.getElementById('couponInput');
  const applyCouponBtn = document.getElementById('btnApplyCoupon');
  const activeCouponContainer = document.getElementById('activeCouponContainer');
  const storeToast = document.getElementById('storeToast');
  const toastMessage = document.getElementById('toastMessage');

  // Quick View Modal elements
  const quickViewModal = document.getElementById('quickViewModal');
  const modalCloseBtn = document.getElementById('modalCloseBtn');
  const modalIcon = document.getElementById('modalIcon');
  const modalCategory = document.getElementById('modalCategory');
  const modalTitle = document.getElementById('modalTitle');
  const modalPrice = document.getElementById('modalPrice');
  const modalOriginalPrice = document.getElementById('modalOriginalPrice');
  const modalDescription = document.getElementById('modalDescription');
  const modalSwatches = document.getElementById('modalSwatches');
  const modalAddToCartBtn = document.getElementById('modalAddToCartBtn');

  let currentCategory = 'all';
  let searchQuery = '';
  let currentSort = 'featured';
  let activeQuickViewProduct = null;
  let activeQuickViewColor = null;

  // Wishlist set in localStorage
  let wishlist = new Set();
  try {
    const saved = localStorage.getItem('lumina_wishlist');
    if (saved) wishlist = new Set(JSON.parse(saved));
  } catch (e) {}

  function showToast(msg) {
    if (!storeToast || !toastMessage) return;
    toastMessage.textContent = msg;
    storeToast.classList.add('visible');
    setTimeout(() => {
      storeToast.classList.remove('visible');
    }, 2400);
  }

  // Render Product Cards
  function renderProducts() {
    if (!productsGrid) return;

    let filtered = [...PRODUCTS];

    // Filter Category
    if (currentCategory !== 'all') {
      filtered = filtered.filter((p) => p.category === currentCategory);
    }

    // Filter Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.tagline.toLowerCase().includes(q) ||
          p.categoryLabel.toLowerCase().includes(q)
      );
    }

    // Sort
    if (currentSort === 'price-low') {
      filtered.sort((a, b) => a.price - b.price);
    } else if (currentSort === 'price-high') {
      filtered.sort((a, b) => b.price - a.price);
    } else if (currentSort === 'rating') {
      filtered.sort((a, b) => b.rating - a.rating);
    }

    if (filtered.length === 0) {
      productsGrid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; color: #94a3b8;">
          <div style="font-size: 3rem; margin-bottom: 12px;">🔍</div>
          <h3 style="font-size: 1.2rem; color: #fff; margin-bottom: 6px;">No matching products found</h3>
          <p style="font-size: 0.85rem;">Try adjusting your search query or switching categories.</p>
        </div>
      `;
      return;
    }

    productsGrid.innerHTML = filtered
      .map((p) => {
        const isWishlisted = wishlist.has(p.id);
        return `
        <div class="product-card" id="card-${p.id}" data-id="${p.id}">
          <div class="product-thumbnail-area" onclick="openQuickView('${p.id}')">
            <span class="badge-tag ${p.badge === 'Best Seller' ? 'best-seller' : ''}">${p.badge}</span>
            <button class="btn-wishlist ${isWishlisted ? 'active' : ''}" id="wishlist-${p.id}" onclick="event.stopPropagation(); toggleWishlist('${p.id}')" title="Save to wishlist">
              ${isWishlisted ? '❤️' : '🤍'}
            </button>
            <div class="product-thumbnail-icon">${p.icon}</div>
          </div>

          <div class="product-details">
            <div class="product-category-meta">${p.categoryLabel}</div>
            <h3 class="product-title" onclick="openQuickView('${p.id}')">${p.name}</h3>
            
            <div class="product-rating">
              <span class="rating-stars">★★★★★</span>
              <span style="color: #f8fafc; font-weight: 700;">${p.rating}</span>
              <span class="rating-count">(${p.reviewsCount})</span>
            </div>

            <div class="product-price-row">
              <span class="price-current">$${p.price}</span>
              ${p.originalPrice ? `<span class="price-original">$${p.originalPrice}</span>` : ''}
              <span style="font-size: 0.72rem; color: #10b981; font-weight: 600; margin-left: auto;">In Stock</span>
            </div>

            <div class="product-actions">
              <button class="btn-add-cart" id="btn-add-${p.id}" onclick="handleAddToCart('${p.id}')">
                <span>Add to Cart</span>
                <span>→</span>
              </button>
              <button class="btn-quick-view" id="btn-quick-${p.id}" onclick="openQuickView('${p.id}')" title="Quick view">
                Preview
              </button>
            </div>
          </div>
        </div>
      `;
      })
      .join('');
  }

  // Wishlist toggle
  window.toggleWishlist = function (id) {
    if (wishlist.has(id)) {
      wishlist.delete(id);
      showToast('Removed from wishlist');
    } else {
      wishlist.add(id);
      showToast('Saved to wishlist ❤️');
    }
    try {
      localStorage.setItem('lumina_wishlist', JSON.stringify([...wishlist]));
    } catch (e) {}
    renderProducts();
  };

  // Add to cart from card
  window.handleAddToCart = function (id) {
    const product = getProductById(id);
    if (!product) return;
    Cart.addItem(product, 1);
    showToast(`Added ${product.name} to bag! 🛍️`);
    openCart();
  };

  // Quick-View Modal
  window.openQuickView = function (id) {
    const product = getProductById(id);
    if (!product || !quickViewModal) return;

    activeQuickViewProduct = product;
    activeQuickViewColor = product.colors && product.colors[0] ? product.colors[0].name : 'Default';

    if (modalIcon) modalIcon.textContent = product.icon;
    if (modalCategory) modalCategory.textContent = product.categoryLabel;
    if (modalTitle) modalTitle.textContent = product.name;
    if (modalPrice) modalPrice.textContent = `$${product.price}`;
    if (modalOriginalPrice) {
      modalOriginalPrice.textContent = product.originalPrice ? `$${product.originalPrice}` : '';
    }
    if (modalDescription) modalDescription.textContent = product.description;

    if (modalSwatches && product.colors) {
      modalSwatches.innerHTML = product.colors
        .map(
          (c, idx) => `
        <button class="swatch-btn ${idx === 0 ? 'active' : ''}" onclick="selectModalColor('${c.name}', this)">
          ${c.name}
        </button>
      `
        )
        .join('');
    }

    quickViewModal.classList.add('active');
  };

  window.selectModalColor = function (colorName, btn) {
    activeQuickViewColor = colorName;
    document.querySelectorAll('.swatch-btn').forEach((b) => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
  };

  if (modalAddToCartBtn) {
    modalAddToCartBtn.addEventListener('click', () => {
      if (!activeQuickViewProduct) return;
      Cart.addItem(activeQuickViewProduct, 1, activeQuickViewColor);
      showToast(`Added ${activeQuickViewProduct.name} (${activeQuickViewColor})!`);
      if (quickViewModal) quickViewModal.classList.remove('active');
      openCart();
    });
  }

  if (modalCloseBtn) {
    modalCloseBtn.addEventListener('click', () => {
      if (quickViewModal) quickViewModal.classList.remove('active');
    });
  }

  if (quickViewModal) {
    quickViewModal.addEventListener('click', (e) => {
      if (e.target === quickViewModal) quickViewModal.classList.remove('active');
    });
  }

  // Cart Drawer Open / Close
  function openCart() {
    if (cartDrawerBackdrop) cartDrawerBackdrop.classList.add('active');
    renderCart();
  }

  function closeCart() {
    if (cartDrawerBackdrop) cartDrawerBackdrop.classList.remove('active');
  }

  if (cartToggleBtn) cartToggleBtn.addEventListener('click', openCart);
  if (cartCloseBtn) cartCloseBtn.addEventListener('click', closeCart);
  if (cartDrawerBackdrop) {
    cartDrawerBackdrop.addEventListener('click', (e) => {
      if (e.target === cartDrawerBackdrop) closeCart();
    });
  }

  // Render Cart Drawer
  function renderCart() {
    const summary = Cart.getSummary();

    // Update Badge
    if (cartBadgeCount) {
      cartBadgeCount.textContent = summary.count;
      cartBadgeCount.style.display = summary.count > 0 ? 'flex' : 'none';
    }

    // Update Summary Figures
    if (cartSubtotalEl) cartSubtotalEl.textContent = `$${summary.subtotal}`;
    if (cartShippingEl) cartShippingEl.textContent = summary.shipping === 0 ? 'FREE' : `$${summary.shipping}`;
    if (cartTaxEl) cartTaxEl.textContent = `$${summary.tax}`;
    if (cartTotalEl) cartTotalEl.textContent = `$${summary.total}`;

    // Coupon discount display
    if (cartDiscountRow && cartDiscountEl) {
      if (summary.discount > 0) {
        cartDiscountRow.style.display = 'flex';
        cartDiscountEl.textContent = `-$${summary.discount}`;
      } else {
        cartDiscountRow.style.display = 'none';
      }
    }

    // Active coupon badge
    if (activeCouponContainer) {
      if (summary.coupon) {
        activeCouponContainer.innerHTML = `
          <div class="active-coupon-badge">
            <span>🎉 Coupon "${summary.coupon.code}" Applied: ${summary.coupon.label}</span>
            <button class="btn-remove-coupon" onclick="Cart.removeCoupon()">Remove</button>
          </div>
        `;
      } else {
        activeCouponContainer.innerHTML = '';
      }
    }

    // Render Items
    if (!cartItemsContainer) return;

    if (summary.items.length === 0) {
      cartItemsContainer.innerHTML = `
        <div class="cart-empty-state">
          <div class="cart-empty-icon">🛍️</div>
          <h4 style="color: #fff; font-size: 1.1rem; margin-bottom: 6px;">Your cart is empty</h4>
          <p style="font-size: 0.85rem; margin-bottom: 20px;">Explore our curated studio collection to add items.</p>
          <button class="cat-tab active" onclick="document.getElementById('cartDrawerBackdrop').classList.remove('active')">
            Start Shopping
          </button>
        </div>
      `;
      return;
    }

    cartItemsContainer.innerHTML = summary.items
      .map(
        (item) => `
      <div class="cart-item">
        <div class="cart-item-icon">${item.icon}</div>
        <div class="cart-item-info">
          <div class="cart-item-title">${item.name}</div>
          <div class="cart-item-variant">Variant: ${item.color}</div>
          <div class="cart-item-price">$${item.price}</div>
        </div>

        <div class="cart-stepper">
          <button class="stepper-btn" onclick="Cart.updateQuantity('${item.id}', '${item.color}', -1)">−</button>
          <span class="stepper-val">${item.quantity}</span>
          <button class="stepper-btn" onclick="Cart.updateQuantity('${item.id}', '${item.color}', 1)">+</button>
        </div>

        <button class="cart-remove-btn" onclick="Cart.removeItem('${item.id}', '${item.color}')" title="Remove item">
          ✕
        </button>
      </div>
    `
      )
      .join('');
  }

  // Coupon Application Button
  if (applyCouponBtn && couponInput) {
    applyCouponBtn.addEventListener('click', () => {
      const code = couponInput.value.trim();
      if (!code) return;
      const res = Cart.applyCoupon(code);
      if (res.success) {
        showToast('Promo code applied successfully!');
        couponInput.value = '';
      } else {
        showToast(res.error);
      }
    });
  }

  // Listen for global cart updates
  window.addEventListener('lumina:cart_updated', renderCart);

  // Category Tab Click Handlers
  catTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      catTabs.forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      currentCategory = tab.getAttribute('data-cat') || 'all';
      renderProducts();
    });
  });

  // Search input with debounce
  if (searchInput) {
    let debounceTimer;
    searchInput.addEventListener('input', (e) => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        searchQuery = e.target.value;
        renderProducts();
      }, 200);
    });
  }

  // Sort dropdown
  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      currentSort = e.target.value;
      renderProducts();
    });
  }

  // Initial renders
  renderProducts();
  renderCart();
});
