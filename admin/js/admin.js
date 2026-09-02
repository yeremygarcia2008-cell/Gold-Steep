/* ========================================
   ADMIN PANEL - JavaScript
   ======================================== */
let siteSettings = {};

// ========================================
// INIT
// ========================================
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    initLoginForm();
    initNavigation();
    initSidebar();
    initColorSync();
    document.getElementById('logoutBtn').addEventListener('click', logout);
});

// ========================================
// AUTH
// ========================================
async function checkAuth() {
    try {
        const res = await fetch('/api/auth/check');
        const data = await res.json();
        if (data.authenticated) {
            showAdmin();
        } else {
            showLogin();
        }
    } catch { showLogin(); }
}

function showLogin() {
    document.getElementById('loginScreen').style.display = 'flex';
    document.getElementById('adminPanel').style.display = 'none';
}

function showAdmin() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('adminPanel').style.display = 'flex';
    loadDashboard();
    loadAllProducts();
    loadAllCategories();
    loadAllTestimonials();
    loadSettingsForm();
}

function initLoginForm() {
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const user = document.getElementById('loginUser').value;
        const pass = document.getElementById('loginPass').value;
        const error = document.getElementById('loginError');

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: user, password: pass })
            });
            const data = await res.json();
            if (data.success) {
                showAdmin();
            } else {
                error.textContent = data.error || 'Credenciales incorrectas';
                error.style.display = 'block';
            }
        } catch {
            error.textContent = 'Error de conexión';
            error.style.display = 'block';
        }
    });
}

async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    showLogin();
}

// ========================================
// NAVIGATION
// ========================================
function initNavigation() {
    document.querySelectorAll('.nav-item[data-page]').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const page = item.dataset.page;
            document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
            item.classList.add('active');
            document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
            document.getElementById('page-' + page).classList.add('active');
            document.getElementById('pageTitle').textContent = item.textContent.trim();
        });
    });
}

function initSidebar() {
    document.getElementById('sidebarToggle').addEventListener('click', () => {
        document.getElementById('sidebar').classList.toggle('active');
    });
}

// ========================================
// DASHBOARD
// ========================================
async function loadDashboard() {
    try {
        const res = await fetch('/api/dashboard');
        const data = await res.json();
        document.getElementById('statProducts').textContent = data.totalProducts;
        document.getElementById('statActive').textContent = data.activeProducts;
        document.getElementById('statFeatured').textContent = data.featuredProducts;
        document.getElementById('statTestimonials').textContent = data.totalTestimonials;

        const tbody = document.querySelector('#recentProductsTable tbody');
        tbody.innerHTML = data.recentProducts.map(p => `
            <tr>
                <td><strong>${p.name}</strong></td>
                <td>${p.category}</td>
                <td>$${p.price.toLocaleString()}</td>
                <td>${p.active ? '<span class="badge badge-success">Activo</span>' : '<span class="badge badge-danger">Inactivo</span>'}</td>
            </tr>
        `).join('');
    } catch {}
}

// ========================================
// PRODUCTS
// ========================================
async function loadAllProducts() {
    try {
        const res = await fetch('/api/products');
        const products = await res.json();
        renderProductsTable(products);
    } catch {}
}

function renderProductsTable(products) {
    const tbody = document.querySelector('#productsTable tbody');
    tbody.innerHTML = products.map(p => `
        <tr>
            <td>${p.image ? `<img src="${p.image}" class="img-thumb">` : '<div class="no-img"><i class="fas fa-image"></i></div>'}</td>
            <td><strong>${p.name}</strong><br><small style="color:#94a3b8">${p.description.substring(0, 40)}...</small></td>
            <td>${p.category}</td>
            <td><strong>$${p.price.toLocaleString()}</strong></td>
            <td>${p.featured ? '<span class="badge badge-gold">Destacado</span>' : '-'}</td>
            <td>${p.active ? '<span class="badge badge-success">Activo</span>' : '<span class="badge badge-danger">Inactivo</span>'}</td>
            <td class="actions">
                <button class="btn btn-sm btn-ghost" onclick="editProduct(${p.id})"><i class="fas fa-edit"></i></button>
                <button class="btn btn-sm btn-danger" onclick="deleteProduct(${p.id})"><i class="fas fa-trash"></i></button>
            </td>
        </tr>
    `).join('');
}

function showProductForm(product = null) {
    const title = product ? 'Editar Producto' : 'Nuevo Producto';
    const categories = ['collares', 'pulseras', 'aretes', 'anillos'];
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalBody').innerHTML = `
        <form id="productForm">
            <div class="form-group">
                <label>Nombre *</label>
                <input type="text" id="prodName" value="${product ? product.name : ''}" required>
            </div>
            <div class="form-group">
                <label>Descripción</label>
                <textarea id="prodDesc" rows="3">${product ? product.description : ''}</textarea>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Precio *</label>
                    <input type="number" id="prodPrice" value="${product ? product.price : ''}" required>
                </div>
                <div class="form-group">
                    <label>Categoría</label>
                    <select id="prodCategory">
                        ${categories.map(c => `<option value="${c}" ${product && product.category === c ? 'selected' : ''}>${c}</option>`).join('')}
                    </select>
                </div>
            </div>
            <div class="form-group">
                <label>Imagen del producto</label>
                <input type="file" id="prodImage" accept="image/*" onchange="previewProductImage(this)">
                <div id="prodImagePreview" style="margin-top:10px;"></div>
                ${product && product.image ? `<input type="hidden" id="prodCurrentImage" value="${product.image}">` : ''}
            </div>
            <div class="form-check">
                <input type="checkbox" id="prodFeatured" ${product && product.featured ? 'checked' : ''}>
                <label for="prodFeatured">Producto destacado</label>
            </div>
            <div class="form-check">
                <input type="checkbox" id="prodActive" ${!product || product.active ? 'checked' : ''}>
                <label for="prodActive">Activo (visible en tienda)</label>
            </div>
            <button type="submit" class="btn btn-primary btn-full">
                <i class="fas fa-save"></i> ${product ? 'Guardar Cambios' : 'Crear Producto'}
            </button>
        </form>
    `;
    openModal();

    document.getElementById('productForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        let imageUrl = product ? (product.image || '') : '';

        const fileInput = document.getElementById('prodImage');
        if (fileInput.files.length > 0) {
            const formData = new FormData();
            formData.append('image', fileInput.files[0]);
            formData.append('type', 'product');
            const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData });
            const uploadData = await uploadRes.json();
            if (uploadData.success) imageUrl = uploadData.path;
        }

        const body = {
            name: document.getElementById('prodName').value,
            description: document.getElementById('prodDesc').value,
            price: document.getElementById('prodPrice').value,
            category: document.getElementById('prodCategory').value,
            image: imageUrl,
            featured: document.getElementById('prodFeatured').checked,
            active: document.getElementById('prodActive').checked
        };

        const url = product ? `/api/products/${product.id}` : '/api/products';
        const method = product ? 'PUT' : 'POST';

        await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        closeModal();
        showToast(product ? 'Producto actualizado' : 'Producto creado');
        loadAllProducts();
        loadDashboard();
    });
}

function previewProductImage(input) {
    const preview = document.getElementById('prodImagePreview');
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = (e) => {
            preview.innerHTML = `<img src="${e.target.result}" style="max-height:100px; border-radius:8px;">`;
        };
        reader.readAsDataURL(input.files[0]);
    }
}

async function editProduct(id) {
    const res = await fetch('/api/products');
    const products = await res.json();
    const product = products.find(p => p.id === id);
    if (product) showProductForm(product);
}

async function deleteProduct(id) {
    if (!confirm('¿Eliminar este producto?')) return;
    await fetch(`/api/products/${id}`, { method: 'DELETE' });
    showToast('Producto eliminado');
    loadAllProducts();
    loadDashboard();
}

// ========================================
// CATEGORIES
// ========================================
async function loadAllCategories() {
    try {
        const res = await fetch('/api/categories');
        const categories = await res.json();
        renderCategoriesTable(categories);
    } catch {}
}

function renderCategoriesTable(categories) {
    const tbody = document.querySelector('#categoriesTable tbody');
    tbody.innerHTML = categories.map(c => `
        <tr>
            <td><strong>${c.name}</strong></td>
            <td><code>${c.slug}</code></td>
            <td>${c.order}</td>
            <td>${c.active ? '<span class="badge badge-success">Activa</span>' : '<span class="badge badge-danger">Inactiva</span>'}</td>
            <td class="actions">
                <button class="btn btn-sm btn-ghost" onclick="editCategory(${c.id})"><i class="fas fa-edit"></i></button>
                <button class="btn btn-sm btn-danger" onclick="deleteCategory(${c.id})"><i class="fas fa-trash"></i></button>
            </td>
        </tr>
    `).join('');
}

function showCategoryForm(category = null) {
    document.getElementById('modalTitle').textContent = category ? 'Editar Categoría' : 'Nueva Categoría';
    document.getElementById('modalBody').innerHTML = `
        <form id="categoryForm">
            <div class="form-group">
                <label>Nombre *</label>
                <input type="text" id="catName" value="${category ? category.name : ''}" required>
            </div>
            <div class="form-group">
                <label>Slug (identificador URL)</label>
                <input type="text" id="catSlug" value="${category ? category.slug : ''}" placeholder="collares">
            </div>
            <div class="form-group">
                <label>Orden de aparición</label>
                <input type="number" id="catOrder" value="${category ? category.order : 1}">
            </div>
            <div class="form-check">
                <input type="checkbox" id="catActive" ${!category || category.active ? 'checked' : ''}>
                <label for="catActive">Activa</label>
            </div>
            <button type="submit" class="btn btn-primary btn-full">
                <i class="fas fa-save"></i> ${category ? 'Guardar' : 'Crear'}
            </button>
        </form>
    `;
    openModal();

    document.getElementById('catName').addEventListener('input', (e) => {
        if (!category) {
            document.getElementById('catSlug').value = e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        }
    });

    document.getElementById('categoryForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const body = {
            name: document.getElementById('catName').value,
            slug: document.getElementById('catSlug').value,
            order: parseInt(document.getElementById('catOrder').value),
            active: document.getElementById('catActive').checked
        };
        const url = category ? `/api/categories/${category.id}` : '/api/categories';
        const method = category ? 'PUT' : 'POST';
        await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
        closeModal();
        showToast(category ? 'Categoría actualizada' : 'Categoría creada');
        loadAllCategories();
    });
}

async function editCategory(id) {
    const res = await fetch('/api/categories');
    const cats = await res.json();
    const cat = cats.find(c => c.id === id);
    if (cat) showCategoryForm(cat);
}

async function deleteCategory(id) {
    if (!confirm('¿Eliminar esta categoría?')) return;
    await fetch(`/api/categories/${id}`, { method: 'DELETE' });
    showToast('Categoría eliminada');
    loadAllCategories();
}

// ========================================
// TESTIMONIALS
// ========================================
async function loadAllTestimonials() {
    try {
        const res = await fetch('/api/testimonials');
        const testimonials = await res.json();
        renderTestimonialsTable(testimonials);
    } catch {}
}

function renderTestimonialsTable(testimonials) {
    const tbody = document.querySelector('#testimonialsTable tbody');
    tbody.innerHTML = testimonials.map(t => `
        <tr>
            <td><strong>${t.name}</strong></td>
            <td>${t.city}</td>
            <td>${t.text.substring(0, 50)}...</td>
            <td>${'<i class="fas fa-star" style="color:#D4AF37"></i>'.repeat(t.stars)}</td>
            <td class="actions">
                <button class="btn btn-sm btn-ghost" onclick="editTestimonial(${t.id})"><i class="fas fa-edit"></i></button>
                <button class="btn btn-sm btn-danger" onclick="deleteTestimonial(${t.id})"><i class="fas fa-trash"></i></button>
            </td>
        </tr>
    `).join('');
}

function showTestimonialForm(testimonial = null) {
    document.getElementById('modalTitle').textContent = testimonial ? 'Editar Testimonio' : 'Nuevo Testimonio';
    document.getElementById('modalBody').innerHTML = `
        <form id="testimonialForm">
            <div class="form-row">
                <div class="form-group">
                    <label>Nombre *</label>
                    <input type="text" id="testName" value="${testimonial ? testimonial.name : ''}" required>
                </div>
                <div class="form-group">
                    <label>Ciudad *</label>
                    <input type="text" id="testCity" value="${testimonial ? testimonial.city : ''}" required>
                </div>
            </div>
            <div class="form-group">
                <label>Testimonio *</label>
                <textarea id="testText" rows="4" required>${testimonial ? testimonial.text : ''}</textarea>
            </div>
            <div class="form-group">
                <label>Estrellas</label>
                <select id="testStars">
                    ${[5,4,3,2,1].map(s => `<option value="${s}" ${testimonial && testimonial.stars === s ? 'selected' : ''}>${s} estrella${s>1?'s':''}</option>`).join('')}
                </select>
            </div>
            <button type="submit" class="btn btn-primary btn-full">
                <i class="fas fa-save"></i> ${testimonial ? 'Guardar' : 'Crear'}
            </button>
        </form>
    `;
    openModal();

    document.getElementById('testimonialForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const body = {
            name: document.getElementById('testName').value,
            city: document.getElementById('testCity').value,
            text: document.getElementById('testText').value,
            stars: document.getElementById('testStars').value
        };
        const url = testimonial ? `/api/testimonials/${testimonial.id}` : '/api/testimonials';
        const method = testimonial ? 'PUT' : 'POST';
        await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
        closeModal();
        showToast(testimonial ? 'Testimonio actualizado' : 'Testimonio creado');
        loadAllTestimonials();
        loadDashboard();
    });
}

async function editTestimonial(id) {
    const res = await fetch('/api/testimonials');
    const tests = await res.json();
    const test = tests.find(t => t.id === id);
    if (test) showTestimonialForm(test);
}

async function deleteTestimonial(id) {
    if (!confirm('¿Eliminar este testimonio?')) return;
    await fetch(`/api/testimonials/${id}`, { method: 'DELETE' });
    showToast('Testimonio eliminado');
    loadAllTestimonials();
}

// ========================================
// DESIGN
// ========================================
async function loadSettingsForm() {
    try {
        const res = await fetch('/api/settings');
        siteSettings = await res.json();
        populateDesignForm();
        populateSettingsForm();
    } catch {}
}

function populateDesignForm() {
    const d = siteSettings.design || {};
    const c = d.colors || {};
    const f = d.fonts || {};
    const sec = siteSettings.sections || {};

    // Colors
    setColorInput('colorPrimary', c.primary || '#D4AF37');
    setColorInput('colorSecondary', c.secondary || '#1A1A1A');
    setColorInput('colorAccent', c.accent || '#E91E63');
    setColorInput('colorBackground', c.background || '#FFFFFF');
    setColorInput('colorText', c.text || '#1A1A1A');
    setColorInput('colorBgAlt', c.backgroundAlt || '#F5F5F5');

    // Fonts
    document.getElementById('fontDisplay').value = f.display || 'Playfair Display';
    document.getElementById('fontBody').value = f.body || 'Poppins';

    // Images
    if (d.logo) { document.getElementById('logoPreview').src = d.logo; document.getElementById('logoPreview').style.display = 'block'; document.getElementById('logoPlaceholder').style.display = 'none'; }
    if (d.favicon) { document.getElementById('faviconPreview').src = d.favicon; document.getElementById('faviconPreview').style.display = 'block'; document.getElementById('faviconPlaceholder').style.display = 'none'; }
    if (d.heroImage) { document.getElementById('heroPreview').src = d.heroImage; document.getElementById('heroPreview').style.display = 'block'; document.getElementById('heroPlaceholder').style.display = 'none'; }

    // Sections
    if (sec.hero) document.getElementById('sectionHero').checked = sec.hero.visible !== false;
    if (sec.benefits) document.getElementById('sectionBenefits').checked = sec.benefits.visible !== false;
    if (sec.products) document.getElementById('sectionProducts').checked = sec.products.visible !== false;
    if (sec.about) document.getElementById('sectionAbout').checked = sec.about.visible !== false;
    if (sec.testimonials) document.getElementById('sectionTestimonials').checked = sec.testimonials.visible !== false;
    if (sec.contact) document.getElementById('sectionContact').checked = sec.contact.visible !== false;
}

function setColorInput(id, value) {
    document.getElementById(id).value = value;
    document.getElementById(id + 'Hex').value = value;
}

function initColorSync() {
    ['Primary', 'Secondary', 'Accent', 'Background', 'Text', 'BgAlt'].forEach(name => {
        const colorEl = document.getElementById('color' + name);
        const hexEl = document.getElementById('color' + name + 'Hex');
        colorEl.addEventListener('input', () => hexEl.value = colorEl.value);
        hexEl.addEventListener('input', () => {
            if (/^#[0-9A-Fa-f]{6}$/.test(hexEl.value)) colorEl.value = hexEl.value;
        });
    });
}

async function uploadImage(input, type, previewId, placeholderId) {
    if (!input.files || !input.files[0]) return;
    const formData = new FormData();
    formData.append('image', input.files[0]);
    formData.append('type', type);

    try {
        const res = await fetch('/api/upload', { method: 'POST', body: formData });
        const data = await res.json();
        if (data.success) {
            document.getElementById(previewId).src = data.path;
            document.getElementById(previewId).style.display = 'block';
            document.getElementById(placeholderId).style.display = 'none';
            showToast('Imagen subida correctamente');
        }
    } catch {
        showToast('Error al subir imagen');
    }
}

async function saveDesign() {
    const d = siteSettings.design || {};
    d.colors = {
        primary: document.getElementById('colorPrimary').value,
        secondary: document.getElementById('colorSecondary').value,
        accent: document.getElementById('colorAccent').value,
        background: document.getElementById('colorBackground').value,
        text: document.getElementById('colorText').value,
        backgroundAlt: document.getElementById('colorBgAlt').value
    };
    d.fonts = {
        display: document.getElementById('fontDisplay').value,
        body: document.getElementById('fontBody').value
    };

    // Get image paths from previews
    const logoPreview = document.getElementById('logoPreview');
    const faviconPreview = document.getElementById('faviconPreview');
    const heroPreview = document.getElementById('heroPreview');
    if (logoPreview.style.display !== 'none' && logoPreview.src) d.logo = new URL(logoPreview.src).pathname;
    if (faviconPreview.style.display !== 'none' && faviconPreview.src) d.favicon = new URL(faviconPreview.src).pathname;
    if (heroPreview.style.display !== 'none' && heroPreview.src) d.heroImage = new URL(heroPreview.src).pathname;

    // Sections
    const sec = siteSettings.sections || {};
    sec.hero = sec.hero || {};
    sec.hero.visible = document.getElementById('sectionHero').checked;
    sec.benefits = sec.benefits || {};
    sec.benefits.visible = document.getElementById('sectionBenefits').checked;
    sec.products = sec.products || {};
    sec.products.visible = document.getElementById('sectionProducts').checked;
    sec.about = sec.about || {};
    sec.about.visible = document.getElementById('sectionAbout').checked;
    sec.testimonials = sec.testimonials || {};
    sec.testimonials.visible = document.getElementById('sectionTestimonials').checked;
    sec.contact = sec.contact || {};
    sec.contact.visible = document.getElementById('sectionContact').checked;

    siteSettings.design = d;
    siteSettings.sections = sec;

    await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(siteSettings)
    });
    showToast('Diseño guardado correctamente');
}

// ========================================
// SETTINGS
// ========================================
function populateSettingsForm() {
    const b = siteSettings.business || {};
    const s = siteSettings.social || {};
    const sec = siteSettings.sections || {};

    document.getElementById('settBusinessName').value = b.name || '';
    document.getElementById('settBusinessDesc').value = b.description || '';
    document.getElementById('settWhatsapp').value = b.whatsapp || '';
    document.getElementById('settEmail').value = b.email || '';
    document.getElementById('settAddress').value = b.address || '';

    document.getElementById('settInstagram').value = s.instagram || '';
    document.getElementById('settFacebook').value = s.facebook || '';
    document.getElementById('settTiktok').value = s.tiktok || '';

    if (sec.hero) {
        document.getElementById('settHeroTitle').value = sec.hero.title || '';
        document.getElementById('settHeroSubtitle').value = sec.hero.subtitle || '';
        document.getElementById('settHeroCta').value = sec.hero.cta || '';
    }
    if (sec.products) {
        document.getElementById('settProductsTitle').value = sec.products.title || '';
        document.getElementById('settProductsSubtitle').value = sec.products.subtitle || '';
    }
    if (sec.about) {
        document.getElementById('settAboutTitle').value = sec.about.title || '';
        document.getElementById('settAboutText').value = sec.about.text || '';
    }
    if (sec.testimonials) {
        document.getElementById('settTestimonialsTitle').value = sec.testimonials.title || '';
        document.getElementById('settTestimonialsSubtitle').value = sec.testimonials.subtitle || '';
    }
    if (sec.contact) {
        document.getElementById('settContactTitle').value = sec.contact.title || '';
        document.getElementById('settContactText').value = sec.contact.text || '';
    }
}

async function saveSettings() {
    siteSettings.business = {
        name: document.getElementById('settBusinessName').value,
        description: document.getElementById('settBusinessDesc').value,
        whatsapp: document.getElementById('settWhatsapp').value,
        email: document.getElementById('settEmail').value,
        address: document.getElementById('settAddress').value
    };
    siteSettings.social = {
        instagram: document.getElementById('settInstagram').value,
        facebook: document.getElementById('settFacebook').value,
        tiktok: document.getElementById('settTiktok').value
    };
    siteSettings.sections = siteSettings.sections || {};
    siteSettings.sections.hero = siteSettings.sections.hero || {};
    siteSettings.sections.hero.title = document.getElementById('settHeroTitle').value;
    siteSettings.sections.hero.subtitle = document.getElementById('settHeroSubtitle').value;
    siteSettings.sections.hero.cta = document.getElementById('settHeroCta').value;
    siteSettings.sections.products = siteSettings.sections.products || {};
    siteSettings.sections.products.title = document.getElementById('settProductsTitle').value;
    siteSettings.sections.products.subtitle = document.getElementById('settProductsSubtitle').value;
    siteSettings.sections.about = siteSettings.sections.about || {};
    siteSettings.sections.about.title = document.getElementById('settAboutTitle').value;
    siteSettings.sections.about.text = document.getElementById('settAboutText').value;
    siteSettings.sections.testimonials = siteSettings.sections.testimonials || {};
    siteSettings.sections.testimonials.title = document.getElementById('settTestimonialsTitle').value;
    siteSettings.sections.testimonials.subtitle = document.getElementById('settTestimonialsSubtitle').value;
    siteSettings.sections.contact = siteSettings.sections.contact || {};
    siteSettings.sections.contact.title = document.getElementById('settContactTitle').value;
    siteSettings.sections.contact.text = document.getElementById('settContactText').value;

    await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(siteSettings)
    });
    showToast('Configuración guardada correctamente');
}

// ========================================
// MODAL & TOAST
// ========================================
function openModal() {
    document.getElementById('modal').classList.add('active');
}
function closeModal() {
    document.getElementById('modal').classList.remove('active');
}
function showToast(message) {
    const toast = document.getElementById('toast');
    document.getElementById('toastMessage').textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}
