/**
 * Lumina E-Commerce Shopping Cart Manager
 */
const Cart = (function () {
  const STORAGE_KEY = 'lumina_cart';
  const COUPON_KEY = 'lumina_coupon';

  const COUPONS = {
    LUMINA10: { code: 'LUMINA10', type: 'percentage', value: 0.1, label: '10% Lumina Studio Discount' },
    WELCOME20: { code: 'WELCOME20', type: 'fixed', value: 20, label: '$20 First Order Welcome Bonus' },
    FREESHIP: { code: 'FREESHIP', type: 'shipping', value: 0, label: 'Complimentary Priority Shipping' },
  };

  function getCartItems() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }

  function saveCartItems(items) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
      notifyCartUpdated();
    } catch (e) {}
  }

  function getActiveCoupon() {
    try {
      const code = localStorage.getItem(COUPON_KEY);
      return code && COUPONS[code.toUpperCase()] ? COUPONS[code.toUpperCase()] : null;
    } catch (e) {
      return null;
    }
  }

  function applyCoupon(code) {
    const cleanCode = (code || '').trim().toUpperCase();
    if (COUPONS[cleanCode]) {
      localStorage.setItem(COUPON_KEY, cleanCode);
      notifyCartUpdated();
      return { success: true, coupon: COUPONS[cleanCode] };
    }
    return { success: false, error: 'Invalid coupon code. Try LUMINA10 for 10% off!' };
  }

  function removeCoupon() {
    localStorage.removeItem(COUPON_KEY);
    notifyCartUpdated();
  }

  function notifyCartUpdated() {
    window.dispatchEvent(new CustomEvent('lumina:cart_updated', { detail: getCartSummary() }));
  }

  function addItem(product, quantity = 1, selectedColor = null) {
    const items = getCartItems();
    const colorName = selectedColor || (product.colors && product.colors[0] ? product.colors[0].name : 'Default');
    const existingIndex = items.findIndex((i) => i.id === product.id && i.color === colorName);

    if (existingIndex > -1) {
      items[existingIndex].quantity += quantity;
    } else {
      items.push({
        id: product.id,
        name: product.name,
        price: product.price,
        icon: product.icon || '🛍️',
        color: colorName,
        quantity: quantity,
      });
    }

    saveCartItems(items);
  }

  function updateQuantity(productId, colorName, delta) {
    const items = getCartItems();
    const index = items.findIndex((i) => i.id === productId && i.color === colorName);
    if (index > -1) {
      items[index].quantity += delta;
      if (items[index].quantity <= 0) {
        items.splice(index, 1);
      }
      saveCartItems(items);
    }
  }

  function removeItem(productId, colorName) {
    const items = getCartItems();
    const filtered = items.filter((i) => !(i.id === productId && i.color === colorName));
    saveCartItems(filtered);
  }

  function clearCart() {
    saveCartItems([]);
    localStorage.removeItem(COUPON_KEY);
  }

  function getCartSummary() {
    const items = getCartItems();
    const count = items.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const coupon = getActiveCoupon();
    let discount = 0;
    if (coupon) {
      if (coupon.type === 'percentage') {
        discount = Math.round(subtotal * coupon.value);
      } else if (coupon.type === 'fixed') {
        discount = Math.min(subtotal, coupon.value);
      }
    }

    // Free shipping if subtotal > 150 or coupon applies free shipping
    let shipping = subtotal > 150 || (coupon && coupon.type === 'shipping') || subtotal === 0 ? 0 : 15;
    const taxableAmount = Math.max(0, subtotal - discount);
    const tax = Math.round(taxableAmount * 0.08); // 8% estimated tax
    const total = Math.max(0, taxableAmount + shipping + tax);

    return {
      items,
      count,
      subtotal,
      discount,
      shipping,
      tax,
      total,
      coupon,
    };
  }

  return {
    getItems: getCartItems,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    getSummary: getCartSummary,
    applyCoupon,
    removeCoupon,
    getActiveCoupon,
  };
})();
