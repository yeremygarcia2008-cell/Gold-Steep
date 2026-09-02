/* ========================================
   GOLD STEEP - JavaScript Principal
   ======================================== */

let cart = JSON.parse(localStorage.getItem('goldCart')) || [];
let siteSettings = {};
let allProducts = [];

// ========================================
// INICIALIZACIÓN
// ========================================
document.addEventListener('DOMContentLoaded', async () => {
    await loadSettings();
    await loadProducts();
    await loadTestimonials();
    initMenuToggle();
    initCart();
    initScrollEffects();
    updateCartUI();
});

// ========================================
// CARGAR CONFIGURACIÓN DESDE API
// ========================================
async function loadSettings() {
    try {
        const res = await fetch('/api/settings');
        siteSettings = await res.json();
        applySettings();
    } catch (e) {
        console.log('Usando configuración por defecto');
    }
}

function applySettings() {
    const s = siteSettings;
    if (!s.business && !s.design) return;

    // Colores dinámicos
    if (s.design && s.design.colors) {
        const c = s.design.colors;
        const root = document.documentElement;
        if (c.primary) root.style.setProperty('--gold', c.primary);
        if (c.secondary) root.style.setProperty('--black', c.secondary);
        if (c.accent) root.style.setProperty('--pink', c.accent);
        if (c.background) root.style.setProperty('--white', c.background);
        if (c.text) root.style.setProperty('--black', c.text);
        if (c.backgroundAlt) root.style.setProperty('--gray-light', c.backgroundAlt);

        // Calcular gold-light y gold-dark
        if (c.primary) {
            root.style.setProperty('--gold-light', c.primary + '33');
            root.style.setProperty('--gold-dark', adjustColor(c.primary, -30));
        }
    }

    // Tipografía
    if (s.design && s.design.fonts) {
        const f = s.design.fonts;
        if (f.display || f.body) {
            const googleFonts = document.getElementById('googleFonts');
            if (googleFonts) {
                const display = f.display || 'Playfair+Display';
                const body = f.body || 'Poppins';
                googleFonts.href = `https://fonts.googleapis.com/css2?family=${display.replace(/\s+/g, '+')}:wght@400;600;700&family=${body.replace(/\s+/g, '+')}:wght@300;400;500;600&display=swap`;
            }
            if (f.display) document.documentElement.style.setProperty('--font-display', `'${f.display}', Georgia, serif`);
            if (f.body) document.documentElement.style.setProperty('--font-body', `'${f.body}', -apple-system, sans-serif`);
        }
    }

    // Logo
    if (s.design && s.design.logo) {
        const headerLogo = document.getElementById('headerLogo');
        const logoIcon = document.getElementById('logoIcon');
        if (headerLogo) {
            headerLogo.src = s.design.logo;
            headerLogo.style.display = 'block';
        }
        if (logoIcon) logoIcon.style.display = 'none';
    }

    // Favicon
    if (s.design && s.design.favicon) {
        const favicon = document.getElementById('dynamicFavicon');
        if (favicon) favicon.href = s.design.favicon;
    }

    // Hero image
    if (s.design && s.design.heroImage) {
        const heroShape = document.getElementById('heroShape');
        if (heroShape) {
            heroShape.style.background = `url(${s.design.heroImage}) center/cover no-repeat`;
            heroShape.innerHTML = '';
        }
    }

    // Nombre del negocio
    if (s.business && s.business.name) {
        document.querySelectorAll('#businessName, #footerBusinessName, #footerCopyright').forEach(el => {
            el.textContent = s.business.name;
        });
        document.title = `${s.business.name} | Joyería Oro Laminado 18K`;
    }

    // Secciones - textos
    if (s.sections) {
        const sec = s.sections;
        if (sec.hero) {
            if (sec.hero.title) document.getElementById('heroTitle').innerHTML = sec.hero.title;
            if (sec.hero.subtitle) document.getElementById('heroSubtitle').textContent = sec.hero.subtitle;
            if (sec.hero.cta) document.getElementById('heroCta').textContent = sec.hero.cta;
        }
        if (sec.products) {
            if (sec.products.title) document.getElementById('productsTitle').textContent = sec.products.title;
            if (sec.products.subtitle) document.getElementById('productsSubtitle').textContent = sec.products.subtitle;
        }
        if (sec.about) {
            if (sec.about.title) document.getElementById('aboutTitle').textContent = sec.about.title;
            if (sec.about.text) document.getElementById('aboutText').textContent = sec.about.text;
        }
        if (sec.testimonials) {
            if (sec.testimonials.title) document.getElementById('testimonialsTitle').textContent = sec.testimonials.title;
            if (sec.testimonials.subtitle) document.getElementById('testimonialsSubtitle').textContent = sec.testimonials.subtitle;
        }
        if (sec.contact) {
            if (sec.contact.title) document.getElementById('contactTitle').textContent = sec.contact.title;
            if (sec.contact.text) document.getElementById('contactText').textContent = sec.contact.text;
        }

        // Ocultar secciones desactivadas
        Object.keys(sec).forEach(key => {
            if (sec[key].visible === false) {
                const section = document.querySelector(`[data-section="${key}"]`);
                if (section) section.style.display = 'none';
            }
        });
    }

    // WhatsApp
    if (s.business && s.business.whatsapp) {
        const wa = s.business.whatsapp;
        const contactWa = document.getElementById('contactWhatsapp');
        const whatsappFloat = document.getElementById('whatsappFloat');
        const checkoutWhatsapp = document.getElementById('checkoutWhatsapp');
        const msg = encodeURIComponent('Hola, me interesa la joyería de Gold Steep');
        if (contactWa) contactWa.href = `https://wa.me/${wa}?text=${msg}`;
        if (whatsappFloat) whatsappFloat.href = `https://wa.me/${wa}?text=${msg}`;
        if (checkoutWhatsapp) checkoutWhatsapp.href = `https://wa.me/${wa}`;
    }

    // Redes sociales
    if (s.social) {
        const socialContainer = document.getElementById('socialLinks');
        if (socialContainer) {
            let html = '';
            if (s.social.instagram) html += `<a href="${s.social.instagram}" class="social-link" target="_blank"><i class="fab fa-instagram"></i></a>`;
            if (s.social.facebook) html += `<a href="${s.social.facebook}" class="social-link" target="_blank"><i class="fab fa-facebook-f"></i></a>`;
            if (s.social.tiktok) html += `<a href="${s.social.tiktok}" class="social-link" target="_blank"><i class="fab fa-tiktok"></i></a>`;
            socialContainer.innerHTML = html;
        }
    }

    // Footer contacto
    if (s.business) {
        if (s.business.whatsapp) document.getElementById('footerPhone').innerHTML = `<i class="fas fa-phone"></i> +${s.business.whatsapp}`;
        if (s.business.email) document.getElementById('footerEmail').innerHTML = `<i class="fas fa-envelope"></i> ${s.business.email}`;
        if (s.business.address) document.getElementById('footerAddress').innerHTML = `<i class="fas fa-map-marker-alt"></i> ${s.business.address}`;
        if (s.business.description) document.getElementById('footerDesc').textContent = s.business.description;
    }
}

function adjustColor(hex, amount) {
    hex = hex.replace('#', '');
    const num = parseInt(hex, 16);
    let r = Math.min(255, Math.max(0, (num >> 16) + amount));
    let g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amount));
    let b = Math.min(255, Math.max(0, (num & 0x0000FF) + amount));
    return `#${(1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1)}`;
}

// ========================================
// CARGAR PRODUCTOS DESDE API
// ========================================
async function loadProducts() {
    try {
        const res = await fetch('/api/products/active');
        allProducts = await res.json();
        renderProducts(allProducts);
        await loadCategories();
    } catch (e) {
        console.log('Error cargando productos');
    }
}

async function loadCategories() {
    try {
        const res = await fetch('/api/categories');
        const categories = await res.json();
        renderFilters(categories);
        renderFooterCategories(categories);
    } catch (e) {}
}

function renderFilters(categories) {
    const container = document.getElementById('filtersContainer');
    if (!container) return;
    let html = '<button class="filter-btn active" data-filter="all">Todos</button>';
    categories.filter(c => c.active).sort((a, b) => a.order - b.order).forEach(cat => {
        html += `<button class="filter-btn" data-filter="${cat.slug}">${cat.name}</button>`;
    });
    container.innerHTML = html;

    // Re-init filter listeners
    container.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            container.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const filter = btn.dataset.filter;
            document.querySelectorAll('.product-card').forEach(card => {
                if (filter === 'all' || card.dataset.category === filter) {
                    card.style.display = 'block';
                    card.style.animation = 'fadeIn 0.5s ease';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    });
}

function renderFooterCategories(categories) {
    const container = document.querySelector('#footerCategories ul');
    if (!container) return;
    container.innerHTML = categories.filter(c => c.active).map(c =>
        `<li><a href="#productos">${c.name}</a></li>`
    ).join('');
}

function renderProducts(products) {
    const grid = document.getElementById('productsGrid');
    if (!grid) return;

    if (products.length === 0) {
        grid.innerHTML = '<p style="text-align:center; grid-column:1/-1; padding:40px; color:#888;">Próximamente tendremos productos disponibles</p>';
        return;
    }

    const icons = {
        collares: 'fa-link',
        pulseras: 'fa-circle',
        aretes: 'fa-ring',
        anillos: 'fa-heart'
    };

    grid.innerHTML = products.map(p => {
        const icon = icons[p.category] || 'fa-gem';
        const imageHtml = p.image
            ? `<img src="${p.image}" alt="${p.name}" style="width:100%; height:100%; object-fit:cover;">`
            : `<div class="product-placeholder"><i class="fas ${icon}"></i></div>`;

        return `
            <div class="product-card" data-category="${p.category}" data-name="${p.name}" data-price="${p.price}">
                ${p.featured ? '<div class="product-badge">Destacado</div>' : ''}
                <div class="product-image">${imageHtml}</div>
                <div class="product-info">
                    <h3 class="product-name">${p.name}</h3>
                    <p class="product-desc">${p.description}</p>
                    <div class="product-price">$${p.price.toLocaleString()}</div>
                    <button class="btn btn-add-cart" onclick="addToCart(this)">
                        <i class="fas fa-shopping-bag"></i> Agregar
                    </button>
                </div>
            </div>
        `;
    }).join('');

    // Animar productos
    initScrollEffects();
}

// ========================================
// CARGAR TESTIMONIOS DESDE API
// ========================================
async function loadTestimonials() {
    try {
        const res = await fetch('/api/testimonials');
        const testimonials = await res.json();
        renderTestimonials(testimonials.filter(t => t.active));
    } catch (e) {}
}

function renderTestimonials(testimonials) {
    const grid = document.getElementById('testimonialsGrid');
    if (!grid) return;

    if (testimonials.length === 0) {
        grid.innerHTML = '<p style="text-align:center; grid-column:1/-1; padding:40px; color:#888;">Próximamente tendremos testimonios</p>';
        return;
    }

    grid.innerHTML = testimonials.map(t => {
        const stars = '<i class="fas fa-star"></i>'.repeat(t.stars);
        return `
            <div class="testimonial-card">
                <div class="testimonial-stars">${stars}</div>
                <p class="testimonial-text">"${t.text}"</p>
                <div class="testimonial-author">
                    <div class="author-avatar"><i class="fas fa-user"></i></div>
                    <div class="author-info">
                        <strong>${t.name}</strong>
                        <span>${t.city}</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// ========================================
// MENÚ MÓVIL
// ========================================
function initMenuToggle() {
    const menuToggle = document.getElementById('menuToggle');
    const navMenu = document.getElementById('navMenu');

    if (menuToggle && navMenu) {
        menuToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            const icon = menuToggle.querySelector('i');
            icon.classList.toggle('fa-bars');
            icon.classList.toggle('fa-times');
        });

        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('active');
                const icon = menuToggle.querySelector('i');
                icon.classList.add('fa-bars');
                icon.classList.remove('fa-times');
            });
        });
    }
}

// ========================================
// CARRITO DE COMPRAS
// ========================================
function initCart() {
    const cartBtn = document.getElementById('cartBtn');
    const cartModal = document.getElementById('cartModal');
    const cartClose = document.getElementById('cartClose');
    const cartOverlay = document.getElementById('cartOverlay');

    if (cartBtn) cartBtn.addEventListener('click', () => {
        cartModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    });
    if (cartClose) cartClose.addEventListener('click', closeCart);
    if (cartOverlay) cartOverlay.addEventListener('click', closeCart);
}

function closeCart() {
    document.getElementById('cartModal').classList.remove('active');
    document.body.style.overflow = '';
}

function addToCart(button) {
    const card = button.closest('.product-card');
    const product = {
        id: Date.now(),
        name: card.dataset.name,
        price: parseInt(card.dataset.price),
        category: card.dataset.category
    };
    cart.push(product);
    saveCart();
    updateCartUI();
    showAddedAnimation(button);
}

function removeFromCart(id) {
    cart = cart.filter(item => item.id !== id);
    saveCart();
    updateCartUI();
}

function saveCart() {
    localStorage.setItem('goldCart', JSON.stringify(cart));
}

function updateCartUI() {
    const cartCount = document.getElementById('cartCount');
    if (cartCount) {
        cartCount.textContent = cart.length;
        cartCount.style.display = cart.length > 0 ? 'flex' : 'none';
    }

    const cartItems = document.getElementById('cartItems');
    const cartFooter = document.getElementById('cartFooter');

    if (cartItems) {
        if (cart.length === 0) {
            cartItems.innerHTML = '<div class="cart-empty"><i class="fas fa-shopping-bag"></i><p>Tu carrito está vacío</p></div>';
            if (cartFooter) cartFooter.style.display = 'none';
        } else {
            cartItems.innerHTML = cart.map(item => `
                <div class="cart-item">
                    <div class="cart-item-image"><i class="fas fa-gem"></i></div>
                    <div class="cart-item-info">
                        <div class="cart-item-name">${item.name}</div>
                        <div class="cart-item-price">$${item.price.toLocaleString()}</div>
                    </div>
                    <button class="cart-item-remove" onclick="removeFromCart(${item.id})">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            `).join('');
            if (cartFooter) {
                cartFooter.style.display = 'block';
                updateCartTotal();
            }
        }
    }
    updateWhatsAppLink();
}

function updateCartTotal() {
    const cartTotal = document.getElementById('cartTotal');
    if (cartTotal) {
        const total = cart.reduce((sum, item) => sum + item.price, 0);
        cartTotal.textContent = `$${total.toLocaleString()}`;
    }
}

function updateWhatsAppLink() {
    const whatsappLink = document.getElementById('checkoutWhatsapp');
    if (whatsappLink) {
        const wa = (siteSettings.business && siteSettings.business.whatsapp) || '573001234567';
        const total = cart.reduce((sum, item) => sum + item.price, 0);
        const itemsList = cart.map(item => `- ${item.name}: $${item.price.toLocaleString()}`).join('%0A');
        const message = `¡Hola! Me gustaría comprar:%0A%0A${itemsList}%0A%0ATotal: $${total.toLocaleString()}%0A%0A¿Qué métodos de pago aceptan?`;
        whatsappLink.href = `https://wa.me/${wa}?text=${message}`;
    }
}

function showAddedAnimation(button) {
    const originalText = button.innerHTML;
    button.innerHTML = '<i class="fas fa-check"></i> Agregado';
    button.style.background = '#25D366';
    setTimeout(() => {
        button.innerHTML = originalText;
        button.style.background = '';
    }, 1500);
}

// ========================================
// EFECTOS DE SCROLL
// ========================================
function initScrollEffects() {
    const header = document.querySelector('.header');
    window.addEventListener('scroll', () => {
        header.style.boxShadow = window.scrollY > 50
            ? '0 4px 30px rgba(0, 0, 0, 0.12)'
            : '0 2px 20px rgba(0, 0, 0, 0.08)';
    });

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    document.querySelectorAll('.product-card, .benefit-card, .testimonial-card').forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(card);
    });
}

// CSS animation
const style = document.createElement('style');
style.textContent = `@keyframes fadeIn { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }`;
document.head.appendChild(style);
