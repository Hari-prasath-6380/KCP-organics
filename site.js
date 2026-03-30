// Mobile nav toggle for header
document.addEventListener('DOMContentLoaded', function () {
  const toggle = document.querySelector('.nav-toggle');
  if (!toggle) return;

  const nav = document.querySelector('.navbar');
  let mobileMenu = document.querySelector('.mobile-menu');
  if (!mobileMenu) {
    mobileMenu = document.createElement('div');
    mobileMenu.className = 'mobile-menu';
    // Clone main links
    const links = [];
    const section1 = document.querySelector('.section1');
    const section2 = document.querySelector('.section2');
    if (section1) links.push(...Array.from(section1.querySelectorAll('a')));
    if (section2) links.push(...Array.from(section2.querySelectorAll('a')));
    links.forEach(a => {
      const clone = a.cloneNode(true);
      clone.addEventListener('click', () => mobileMenu.classList.remove('show'));
      mobileMenu.appendChild(clone);
    });
    nav.appendChild(mobileMenu);
  }

  toggle.addEventListener('click', function () {
    const expanded = this.getAttribute('aria-expanded') === 'true';
    this.setAttribute('aria-expanded', String(!expanded));
    mobileMenu.classList.toggle('show');
  });

  // Close on outside click
  document.addEventListener('click', function (e) {
    if (!mobileMenu.contains(e.target) && !toggle.contains(e.target) && mobileMenu.classList.contains('show')) {
      mobileMenu.classList.remove('show');
      toggle.setAttribute('aria-expanded', 'false');
    }
  });
});

// =================== PRODUCT STOCK BADGE ===================
// Shows live stock count on product detail page card buttons.
// Works for any page that has .add-product-btn buttons with
// onclick="addProduct('Product Name')" pattern.
(async function loadProductPageStocks() {
  const buttons = document.querySelectorAll('.add-product-btn');
  if (!buttons.length) return;

  const API_URL = (typeof window !== 'undefined' && window.API_URL)
    ? window.API_URL
    : 'https://kcp-organics-1.onrender.com';

  for (const btn of buttons) {
    const onclickStr = btn.getAttribute('onclick') || '';
    const match = onclickStr.match(/addProduct\(['"](.*?)['"]\)/);
    if (!match) continue;
    const productName = match[1];

    // Create badge element next to the button
    const badge = document.createElement('span');
    badge.className = 'product-stock-badge';
    badge.style.cssText = [
      'display:inline-block',
      'font-size:11px',
      'font-weight:600',
      'padding:3px 10px',
      'border-radius:50px',
      'margin-top:6px',
      'letter-spacing:0.3px',
    ].join(';');
    // Insert badge below button
    btn.insertAdjacentElement('afterend', badge);

    try {
      const res = await fetch(
        `${API_URL}/api/products/stock/by-name?name=${encodeURIComponent(productName)}`
      );
      const data = await res.json();

      if (!data.success || !data.data) {
        badge.remove();
        continue;
      }

      const stock = data.data.stock || 0;

      if (stock <= 0) {
        badge.textContent = '❌ Out of Stock';
        badge.style.background = '#fce4ec';
        badge.style.color = '#c62828';
        badge.style.border = '1px solid #ef9a9a';
        btn.disabled = true;
        btn.style.opacity = '0.55';
        btn.style.cursor = 'not-allowed';
        btn.innerHTML = btn.innerHTML.replace('Add to Cart', 'Out of Stock');
      } else if (stock <= 10) {
        badge.textContent = `⚠️ Only ${stock} left!`;
        badge.style.background = '#fff3e0';
        badge.style.color = '#e65100';
        badge.style.border = '1px solid #ffcc80';
      } else {
        badge.textContent = `✅ ${stock} in stock`;
        badge.style.background = '#e8f5e9';
        badge.style.color = '#1b5e20';
        badge.style.border = '1px solid #a5d6a7';
      }
    } catch (e) {
      badge.remove();
    }
  }
})();

// Listen for stock refresh signal from checkout after order placed
window.addEventListener('storage', function(event) {
  if (event.key === 'stockNeedsRefresh' && event.newValue === 'true') {
    console.log('📢 Reloading product stock badges due to new order');
    // Reload the stock badges
    (async function refreshProductPageStocks() {
      const buttons = document.querySelectorAll('.add-product-btn');
      if (!buttons.length) return;
    
      const API_URL = (typeof window !== 'undefined' && window.API_URL)
        ? window.API_URL
        : 'https://kcp-organics-1.onrender.com';
    
      for (const btn of buttons) {
        const onclickStr = btn.getAttribute('onclick') || '';
        const match = onclickStr.match(/addProduct\(['"](.*?)['"]\)/);
        if (!match) continue;
        const productName = match[1];
    
        // Find or create badge element
        let badge = btn.nextElementSibling;
        if (!badge || !badge.classList.contains('product-stock-badge')) {
          badge = document.createElement('span');
          badge.className = 'product-stock-badge';
          badge.style.cssText = [
            'display:inline-block',
            'font-size:11px',
            'font-weight:600',
            'padding:3px 10px',
            'border-radius:50px',
            'margin-top:6px',
            'letter-spacing:0.3px',
          ].join(';');
          btn.insertAdjacentElement('afterend', badge);
        }
    
        try {
          const res = await fetch(
            `${API_URL}/api/products/stock/by-name?name=${encodeURIComponent(productName)}`
          );
          const data = await res.json();
    
          if (!data.success || !data.data) {
            badge.remove();
            continue;
          }
    
          const stock = data.data.stock || 0;
    
          if (stock <= 0) {
            badge.textContent = '❌ Out of Stock';
            badge.style.background = '#fce4ec';
            badge.style.color = '#c62828';
            badge.style.border = '1px solid #ef9a9a';
            btn.disabled = true;
            btn.style.opacity = '0.55';
            btn.style.cursor = 'not-allowed';
            btn.innerHTML = btn.innerHTML.replace('Out of Stock', 'Out of Stock').replace('Add to Cart', 'Out of Stock');
          } else if (stock <= 10) {
            badge.textContent = `⚠️ Only ${stock} left!`;
            badge.style.background = '#fff3e0';
            badge.style.color = '#e65100';
            badge.style.border = '1px solid #ffcc80';
            btn.disabled = false;
            btn.style.opacity = '1';
            btn.style.cursor = 'pointer';
          } else {
            badge.textContent = `✅ ${stock} in stock`;
            badge.style.background = '#e8f5e9';
            badge.style.color = '#1b5e20';
            badge.style.border = '1px solid #a5d6a7';
            btn.disabled = false;
            btn.style.opacity = '1';
            btn.style.cursor = 'pointer';
          }
        } catch (e) {
          console.error('Error refreshing stock:', e);
        }
      }
    })();
  }
});
// ===========================================================
