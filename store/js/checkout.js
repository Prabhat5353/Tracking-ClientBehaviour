/**
 * Lumina E-Commerce Checkout Controller
 */
document.addEventListener('DOMContentLoaded', () => {
  const summaryItemsList = document.getElementById('checkoutSummaryItems');
  const subtotalEl = document.getElementById('checkoutSubtotal');
  const shippingEl = document.getElementById('checkoutShipping');
  const taxEl = document.getElementById('checkoutTax');
  const totalEl = document.getElementById('checkoutTotal');
  const discountRow = document.getElementById('checkoutDiscountRow');
  const discountEl = document.getElementById('checkoutDiscount');
  const couponInput = document.getElementById('checkoutCouponInput');
  const applyCouponBtn = document.getElementById('btnCheckoutApplyCoupon');
  const orderForm = document.getElementById('checkoutForm');
  const placeOrderBtn = document.getElementById('btnPlaceOrder');
  const confirmationModal = document.getElementById('orderConfirmationModal');

  function renderCheckoutSummary() {
    const summary = Cart.getSummary();

    if (subtotalEl) subtotalEl.textContent = `$${summary.subtotal}`;
    if (shippingEl) shippingEl.textContent = summary.shipping === 0 ? 'FREE' : `$${summary.shipping}`;
    if (taxEl) taxEl.textContent = `$${summary.tax}`;
    if (totalEl) totalEl.textContent = `$${summary.total}`;

    if (discountRow && discountEl) {
      if (summary.discount > 0) {
        discountRow.style.display = 'flex';
        discountEl.textContent = `-$${summary.discount}`;
      } else {
        discountRow.style.display = 'none';
      }
    }

    if (!summaryItemsList) return;

    if (summary.items.length === 0) {
      summaryItemsList.innerHTML = `
        <div style="padding: 24px 0; text-align: center; color: #94a3b8; font-size: 0.85rem;">
          Your bag is empty. <a href="index.html" style="color: #38bdf8; font-weight: bold;">Return to Store</a>
        </div>
      `;
      if (placeOrderBtn) placeOrderBtn.disabled = true;
      return;
    }

    if (placeOrderBtn) placeOrderBtn.disabled = false;

    summaryItemsList.innerHTML = summary.items
      .map(
        (item) => `
      <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.06);">
        <div style="display: flex; align-items: center; gap: 12px;">
          <div style="width: 44px; height: 44px; background: rgba(255,255,255,0.05); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 1.4rem;">
            ${item.icon}
          </div>
          <div>
            <div style="font-size: 0.88rem; font-weight: 600; color: #fff;">${item.name}</div>
            <div style="font-size: 0.75rem; color: #94a3b8;">${item.color} • Qty: ${item.quantity}</div>
          </div>
        </div>
        <div style="font-weight: 700; color: #fff; font-size: 0.9rem;">
          $${item.price * item.quantity}
        </div>
      </div>
    `
      )
      .join('');
  }

  // Coupon handling on checkout page
  if (applyCouponBtn && couponInput) {
    applyCouponBtn.addEventListener('click', () => {
      const code = couponInput.value.trim();
      if (!code) return;
      const res = Cart.applyCoupon(code);
      if (res.success) {
        alert('🎉 Promo Code Applied Successfully!');
        couponInput.value = '';
        renderCheckoutSummary();
      } else {
        alert(res.error);
      }
    });
  }

  // Payment method selection cards
  const paymentCards = document.querySelectorAll('.payment-card');
  paymentCards.forEach((card) => {
    card.addEventListener('click', () => {
      paymentCards.forEach((c) => c.classList.remove('active'));
      card.classList.add('active');
    });
  });

  // Shipping option radiogroup
  const shippingRadios = document.querySelectorAll('input[name="shipping_method"]');
  shippingRadios.forEach((radio) => {
    radio.addEventListener('change', () => {
      renderCheckoutSummary();
    });
  });

  // Complete Order
  if (orderForm) {
    orderForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const summary = Cart.getSummary();
      if (summary.items.length === 0) {
        alert('Your bag is empty!');
        return;
      }

      // Generate random order number
      const orderNum = `LUM-${Math.floor(100000 + Math.random() * 900000)}`;
      const orderTotal = summary.total;

      // Update confirmation modal
      const confNumEl = document.getElementById('confirmationOrderNum');
      const confTotalEl = document.getElementById('confirmationTotal');
      if (confNumEl) confNumEl.textContent = `#${orderNum}`;
      if (confTotalEl) confTotalEl.textContent = `$${orderTotal}`;

      // Clear the cart
      Cart.clearCart();

      // Show confirmation
      if (confirmationModal) {
        confirmationModal.classList.add('active');
      }
    });
  }

  // Initial render
  renderCheckoutSummary();
});
