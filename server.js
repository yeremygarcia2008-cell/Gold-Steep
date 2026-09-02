const express = require('express');
const session = require('express-session');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: 'parra-es-hermoso-secret-2026',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/css', express.static(path.join(__dirname, 'public/css')));
app.use('/js', express.static(path.join(__dirname, 'public/js')));
app.use('/admin/css', express.static(path.join(__dirname, 'admin/css')));
app.use('/admin/js', express.static(path.join(__dirname, 'admin/js')));

// ========================================
// HELPERS - Lectura/Escritura de JSON
// ========================================
function readJSON(file) {
    const filePath = path.join(__dirname, 'data', file);
    if (!fs.existsSync(filePath)) return [];
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJSON(file, data) {
    const filePath = path.join(__dirname, 'data', file);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

// ========================================
// MULTER - Configuración de subida
// ========================================
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        let folder = 'uploads/products';
        if (req.body.type === 'logo') folder = 'uploads/logo';
        if (req.body.type === 'banner') folder = 'uploads/banners';
        if (req.body.type === 'favicon') folder = 'uploads/logo';
        cb(null, path.join(__dirname, folder));
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const name = Date.now() + '-' + Math.round(Math.random() * 1E9) + ext;
        cb(null, name);
    }
});
const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowed = /jpeg|jpg|png|gif|webp|svg/;
        const ext = allowed.test(path.extname(file.originalname).toLowerCase());
        const mime = allowed.test(file.mimetype);
        cb(null, ext && mime);
    }
});

// ========================================
// AUTH MIDDLEWARE
// ========================================
function requireAuth(req, res, next) {
    if (req.session && req.session.user) return next();
    res.status(401).json({ error: 'No autorizado' });
}

// ========================================
// AUTH ROUTES
// ========================================
app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;
    const users = readJSON('users.json');
    const user = users.find(u => u.username === username);

    if (user && bcrypt.compareSync(password, user.password)) {
        req.session.user = { id: user.id, username: user.username, role: user.role };
        return res.json({ success: true, user: { username: user.username, role: user.role } });
    }
    res.status(401).json({ error: 'Credenciales incorrectas' });
});

app.post('/api/auth/logout', (req, res) => {
    req.session.destroy();
    res.json({ success: true });
});

app.get('/api/auth/check', (req, res) => {
    if (req.session && req.session.user) {
        return res.json({ authenticated: true, user: req.session.user });
    }
    res.json({ authenticated: false });
});

// ========================================
// PRODUCTS ROUTES
// ========================================
app.get('/api/products', (req, res) => {
    const products = readJSON('products.json');
    res.json(products);
});

app.get('/api/products/active', (req, res) => {
    const products = readJSON('products.json').filter(p => p.active);
    res.json(products);
});

app.post('/api/products', requireAuth, (req, res) => {
    const products = readJSON('products.json');
    const newProduct = {
        id: Date.now(),
        name: req.body.name,
        description: req.body.description,
        price: parseInt(req.body.price),
        category: req.body.category,
        image: req.body.image || '',
        featured: req.body.featured === 'true' || req.body.featured === true,
        active: true,
        createdAt: new Date().toISOString()
    };
    products.push(newProduct);
    writeJSON('products.json', products);
    res.json({ success: true, product: newProduct });
});

app.put('/api/products/:id', requireAuth, (req, res) => {
    const products = readJSON('products.json');
    const index = products.findIndex(p => p.id === parseInt(req.params.id));
    if (index === -1) return res.status(404).json({ error: 'Producto no encontrado' });

    products[index] = {
        ...products[index],
        name: req.body.name ?? products[index].name,
        description: req.body.description ?? products[index].description,
        price: req.body.price ? parseInt(req.body.price) : products[index].price,
        category: req.body.category ?? products[index].category,
        image: req.body.image ?? products[index].image,
        featured: req.body.featured !== undefined ? (req.body.featured === 'true' || req.body.featured === true) : products[index].featured,
        active: req.body.active !== undefined ? (req.body.active === 'true' || req.body.active === true) : products[index].active
    };
    writeJSON('products.json', products);
    res.json({ success: true, product: products[index] });
});

app.delete('/api/products/:id', requireAuth, (req, res) => {
    let products = readJSON('products.json');
    const product = products.find(p => p.id === parseInt(req.params.id));
    if (!product) return res.status(404).json({ error: 'Producto no encontrado' });

    if (product.image && fs.existsSync(path.join(__dirname, product.image))) {
        fs.unlinkSync(path.join(__dirname, product.image));
    }

    products = products.filter(p => p.id !== parseInt(req.params.id));
    writeJSON('products.json', products);
    res.json({ success: true });
});

// ========================================
// CATEGORIES ROUTES
// ========================================
app.get('/api/categories', (req, res) => {
    const categories = readJSON('categories.json');
    res.json(categories);
});

app.post('/api/categories', requireAuth, (req, res) => {
    const categories = readJSON('categories.json');
    const newCategory = {
        id: Date.now(),
        name: req.body.name,
        slug: req.body.slug || req.body.name.toLowerCase().replace(/\s+/g, '-'),
        order: categories.length + 1,
        active: true
    };
    categories.push(newCategory);
    writeJSON('categories.json', categories);
    res.json({ success: true, category: newCategory });
});

app.put('/api/categories/:id', requireAuth, (req, res) => {
    const categories = readJSON('categories.json');
    const index = categories.findIndex(c => c.id === parseInt(req.params.id));
    if (index === -1) return res.status(404).json({ error: 'Categoría no encontrada' });

    categories[index] = {
        ...categories[index],
        name: req.body.name ?? categories[index].name,
        slug: req.body.slug ?? categories[index].slug,
        order: req.body.order ?? categories[index].order,
        active: req.body.active !== undefined ? req.body.active : categories[index].active
    };
    writeJSON('categories.json', categories);
    res.json({ success: true, category: categories[index] });
});

app.delete('/api/categories/:id', requireAuth, (req, res) => {
    let categories = readJSON('categories.json');
    categories = categories.filter(c => c.id !== parseInt(req.params.id));
    writeJSON('categories.json', categories);
    res.json({ success: true });
});

// ========================================
// TESTIMONIALS ROUTES
// ========================================
app.get('/api/testimonials', (req, res) => {
    const testimonials = readJSON('testimonials.json');
    res.json(testimonials);
});

app.post('/api/testimonials', requireAuth, (req, res) => {
    const testimonials = readJSON('testimonials.json');
    const newTestimonial = {
        id: Date.now(),
        name: req.body.name,
        city: req.body.city,
        text: req.body.text,
        stars: parseInt(req.body.stars) || 5,
        active: true
    };
    testimonials.push(newTestimonial);
    writeJSON('testimonials.json', testimonials);
    res.json({ success: true, testimonial: newTestimonial });
});

app.put('/api/testimonials/:id', requireAuth, (req, res) => {
    const testimonials = readJSON('testimonials.json');
    const index = testimonials.findIndex(t => t.id === parseInt(req.params.id));
    if (index === -1) return res.status(404).json({ error: 'Testimonio no encontrado' });

    testimonials[index] = {
        ...testimonials[index],
        name: req.body.name ?? testimonials[index].name,
        city: req.body.city ?? testimonials[index].city,
        text: req.body.text ?? testimonials[index].text,
        stars: req.body.stars ? parseInt(req.body.stars) : testimonials[index].stars,
        active: req.body.active !== undefined ? req.body.active : testimonials[index].active
    };
    writeJSON('testimonials.json', testimonials);
    res.json({ success: true, testimonial: testimonials[index] });
});

app.delete('/api/testimonials/:id', requireAuth, (req, res) => {
    let testimonials = readJSON('testimonials.json');
    testimonials = testimonials.filter(t => t.id !== parseInt(req.params.id));
    writeJSON('testimonials.json', testimonials);
    res.json({ success: true });
});

// ========================================
// SETTINGS ROUTES
// ========================================
app.get('/api/settings', (req, res) => {
    const settings = readJSON('settings.json');
    res.json(settings);
});

app.put('/api/settings', requireAuth, (req, res) => {
    const settings = readJSON('settings.json');
    const updated = { ...settings, ...req.body };
    writeJSON('settings.json', updated);
    res.json({ success: true, settings: updated });
});

// ========================================
// UPLOAD ROUTE
// ========================================
app.post('/api/upload', requireAuth, upload.single('image'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No se subió ningún archivo' });
    const filePath = '/' + req.file.path.replace(/\\/g, '/').replace(__dirname.replace(/\\/g, '/'), '');
    res.json({ success: true, path: filePath });
});

// ========================================
// DASHBOARD ROUTE
// ========================================
app.get('/api/dashboard', requireAuth, (req, res) => {
    const products = readJSON('products.json');
    const categories = readJSON('categories.json');
    const testimonials = readJSON('testimonials.json');

    const productsByCategory = {};
    categories.forEach(cat => {
        productsByCategory[cat.name] = products.filter(p => p.category === cat.slug).length;
    });

    res.json({
        totalProducts: products.length,
        activeProducts: products.filter(p => p.active).length,
        featuredProducts: products.filter(p => p.featured).length,
        totalCategories: categories.length,
        totalTestimonials: testimonials.length,
        productsByCategory,
        recentProducts: products.slice(-5).reverse()
    });
});

// ========================================
// PAGE ROUTES
// ========================================
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin', 'index.html'));
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ========================================
// INITIALIZE DEFAULT DATA
// ========================================
function initializeData() {
    // Users
    if (!fs.existsSync(path.join(__dirname, 'data', 'users.json')) || readJSON('users.json').length === 0) {
        const hash = bcrypt.hashSync('admin123', 10);
        writeJSON('users.json', [{
            id: 1,
            username: 'admin',
            password: hash,
            role: 'admin',
            createdAt: new Date().toISOString()
        }]);
        console.log('  ✓ Usuario admin creado (admin / admin123)');
    }

    // Categories
    if (!fs.existsSync(path.join(__dirname, 'data', 'categories.json')) || readJSON('categories.json').length === 0) {
        writeJSON('categories.json', [
            { id: 1, name: 'Collares', slug: 'collares', order: 1, active: true },
            { id: 2, name: 'Pulseras', slug: 'pulseras', order: 2, active: true },
            { id: 3, name: 'Aretes', slug: 'aretes', order: 3, active: true },
            { id: 4, name: 'Anillos', slug: 'anillos', order: 4, active: true }
        ]);
        console.log('  ✓ Categorías iniciales creadas');
    }

    // Products
    if (!fs.existsSync(path.join(__dirname, 'data', 'products.json')) || readJSON('products.json').length === 0) {
        writeJSON('products.json', [
            { id: 1, name: 'Collar Cadena Milano', description: 'Elegante cadena tejido milano en oro laminado 18K', price: 185000, category: 'collares', image: '', featured: true, active: true, createdAt: new Date().toISOString() },
            { id: 2, name: 'Collar Dije Corazón', description: 'Delicado collar con dije de corazón en oro 18K', price: 145000, category: 'collares', image: '', featured: false, active: true, createdAt: new Date().toISOString() },
            { id: 3, name: 'Collar Eslabón Cubano', description: 'Clásica cadena cubano de 8mm en oro laminado 18K', price: 220000, category: 'collares', image: '', featured: true, active: true, createdAt: new Date().toISOString() },
            { id: 4, name: 'Pulsera Cadena Eternal', description: 'Pulsera de eslabones en oro laminado 18K', price: 125000, category: 'pulseras', image: '', featured: false, active: true, createdAt: new Date().toISOString() },
            { id: 5, name: 'Pulsera Charm Bliss', description: 'Pulsera con dijes personalizados en oro 18K', price: 165000, category: 'pulseras', image: '', featured: true, active: true, createdAt: new Date().toISOString() },
            { id: 6, name: 'Pulsera Rígida Moderna', description: 'Pulsera rígida con acabado pulido en oro 18K', price: 195000, category: 'pulseras', image: '', featured: false, active: true, createdAt: new Date().toISOString() },
            { id: 7, name: 'Aros Clásicos Circulares', description: 'Aros circulares timeless en oro laminado 18K', price: 89000, category: 'aretes', image: '', featured: false, active: true, createdAt: new Date().toISOString() },
            { id: 8, name: 'Aretes Colgantes Elegance', description: 'Aretes colgantes con cristal en oro 18K', price: 110000, category: 'aretes', image: '', featured: true, active: true, createdAt: new Date().toISOString() },
            { id: 9, name: 'Stud Earrings Minimal', description: 'Aretes tipo topping minimalistas en oro 18K', price: 75000, category: 'aretes', image: '', featured: false, active: true, createdAt: new Date().toISOString() },
            { id: 10, name: 'Anillo Solitario Brillante', description: 'Anillo solitario con piedra en oro laminado 18K', price: 135000, category: 'anillos', image: '', featured: false, active: true, createdAt: new Date().toISOString() },
            { id: 11, name: 'Argollas Matrimonio', description: 'Par de argollas en oro laminado 18K', price: 250000, category: 'anillos', image: '', featured: true, active: true, createdAt: new Date().toISOString() },
            { id: 12, name: 'Anillo Compilation Stack', description: 'Set de 3 anillos para combinar en oro 18K', price: 95000, category: 'anillos', image: '', featured: false, active: true, createdAt: new Date().toISOString() }
        ]);
        console.log('  ✓ Productos iniciales creados');
    }

    // Testimonials
    if (!fs.existsSync(path.join(__dirname, 'data', 'testimonials.json')) || readJSON('testimonials.json').length === 0) {
        writeJSON('testimonials.json', [
            { id: 1, name: 'María Fernández', city: 'Bogotá', text: 'Mi collar Milano es hermoso, lo uso todos los días y sigue como nuevo después de 6 meses. ¡Excelente calidad!', stars: 5, active: true },
            { id: 2, name: 'Valentina López', city: 'Medellín', text: 'Compré un set completo para mi graduación y todos preguntaron de qué joyería era. El precio es increíble por la calidad.', stars: 5, active: true },
            { id: 3, name: 'Andrea Gutiérrez', city: 'Cali', text: 'Soy alérgica al níquel y con las joyas de Parra es Hermoso no he tenido ningún problema. ¡Las recomiendo totalmente!', stars: 5, active: true }
        ]);
        console.log('  ✓ Testimonios iniciales creados');
    }

    // Settings
    if (!fs.existsSync(path.join(__dirname, 'data', 'settings.json')) || Object.keys(readJSON('settings.json')).length === 0) {
        writeJSON('settings.json', {
            business: {
                name: 'Parra es Hermoso',
                description: 'Joyería en oro laminado 18K de alta calidad a precios accesibles',
                whatsapp: '573001234567',
                email: 'info@parraeshermoso.com',
                address: 'Colombia'
            },
            social: {
                instagram: 'https://instagram.com/parraeshermoso',
                facebook: 'https://facebook.com/parraeshermoso',
                tiktok: 'https://tiktok.com/@parraeshermoso'
            },
            design: {
                colors: {
                    primary: '#D4AF37',
                    secondary: '#1A1A1A',
                    accent: '#E91E63',
                    background: '#FFFFFF',
                    text: '#1A1A1A',
                    backgroundAlt: '#F5F5F5'
                },
                fonts: {
                    display: 'Playfair Display',
                    body: 'Poppins'
                },
                logo: '',
                favicon: '',
                heroImage: ''
            },
            sections: {
                hero: { visible: true, title: 'Brilla con la elegancia del Oro 18K', subtitle: 'Joyería en oro laminado de alta calidad a precios accesibles. Porque mereces lucir hermosa todos los días.', cta: 'Explora nuestra colección' },
                benefits: { visible: true },
                products: { visible: true, title: 'Nuestra Colección', subtitle: 'Descubre piezas únicas que combinan elegancia y accesibilidad' },
                about: { visible: true, title: '¿Por qué Oro Laminado 18K?', text: 'El oro laminado 18K es una técnica premium que fusiona una capa gruesa de oro puro sobre un metal base, creando piezas con la misma apariencia y brillo del oro macizo.' },
                testimonials: { visible: true, title: 'Lo que dicen nuestras clientas', subtitle: 'Historias reales de mujeres que brillan con Parra es Hermoso' },
                contact: { visible: true, title: '¿Tienes alguna pregunta?', text: 'Estamos aquí para ayudarte. Escríbenos por WhatsApp y te atenderemos de inmediato.' }
            }
        });
        console.log('  ✓ Configuración inicial creada');
    }
}

// ========================================
// START SERVER
// ========================================
console.log('\n  Inicializando Parra es Hermoso...');
initializeData();

app.listen(PORT, () => {
    console.log(`\n✨ Parra es Hermoso - Servidor activo`);
    console.log(`   Tienda:  http://localhost:${PORT}`);
    console.log(`   Admin:   http://localhost:${PORT}/admin`);
    console.log(`\n   Usuario: admin`);
    console.log(`   Contraseña: admin123\n`);
});
