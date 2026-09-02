# Gold Steep - Joyeria Oro Laminado 18K

Tienda en linea de joyeria con panel de administracion completo.

## Inicio Rapido

### Requisitos
- [Node.js](https://nodejs.org) v18 o superior
- npm (viene con Node.js)

### Instalacion Local

```bash
# Clonar el repositorio
git clone https://github.com/TU-USUARIO/parra-es-hermoso.git
cd parra-es-hermoso

# Instalar dependencias
npm install

# Iniciar el servidor
npm start
```

O en Windows, haz doble clic en `iniciar.bat`

### URLs

- **Tienda**: http://localhost:3000
- **Admin**: http://localhost:3000/admin

### Credenciales del Admin

| Campo | Valor |
|-------|-------|
| Usuario | `admin` |
| Contrasena | `admin123` |

## Despliegue en Render (Gratis)

1. Crear cuenta en [GitHub](https://github.com)
2. Crear cuenta en [Render](https://render.com)
3. Subir el codigo a GitHub:
   ```bash
   git init
   git add .
   git commit -m "MVP inicial"
   git remote add origin https://github.com/TU-USUARIO/parra-es-hermoso.git
   git push -u origin main
   ```
4. En Render: New + > Web Service
5. Conectar repositorio de GitHub
6. Configurar:
   - Build Command: `npm install`
   - Start Command: `npm start`
7. ¡Deploy!

Tu tienda estara en: `https://parra-es-hermoso.onrender.com`

## Funcionalidades

### Tienda Publica
- Catalogo de productos con filtros
- Carrito de compras
- Contacto por WhatsApp
- Redes sociales
- Diseno responsive (movil, tablet, escritorio)

### Panel de Administracion
- Dashboard con estadisticas
- CRUD de productos (crear, leer, actualizar, eliminar)
- CRUD de categorias
- CRUD de testimonios
- Personalizacion de colores
- Cambio de tipografia
- Subida de logo, favicon e imagenes
- Control de secciones visibles/ocultas
- Configuracion del negocio (WhatsApp, email, redes)

## Tecnologias

- **Backend**: Node.js, Express
- **Frontend**: HTML5, CSS3, JavaScript vanilla
- **Base de datos**: JSON (archivos locales)
- **Autenticacion**: bcryptjs, express-session
- **Subida de archivos**: multer

## Estructura del Proyecto

```
parra-es-hermoso/
├── server.js              # Servidor Express
├── package.json           # Dependencias
├── iniciar.bat            # Inicio rapido (Windows)
├── data/                  # Base de datos JSON
├── uploads/               # Imagenes subidas
├── public/                # Tienda publica
│   ├── index.html
│   ├── css/styles.css
│   └── js/main.js
└── admin/                 # Panel de administracion
    ├── index.html
    ├── css/admin.css
    └── js/admin.js
```

## Licencia

MIT
