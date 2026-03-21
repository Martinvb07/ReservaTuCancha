# 🏟️ ReservaTuCancha

> Plataforma web para reserva de canchas deportivas en Colombia — **sin registro requerido para clientes**.

![Stack](https://img.shields.io/badge/Frontend-Next.js_14-black?logo=next.js)
![Stack](https://img.shields.io/badge/Backend-NestJS-red?logo=nestjs)
![Stack](https://img.shields.io/badge/Database-MongoDB-green?logo=mongodb)
![Stack](https://img.shields.io/badge/Pagos-Stripe-blueviolet?logo=stripe)
![License](https://img.shields.io/badge/license-MIT-blue)

---

## 📋 Descripción

**ReservaTuCancha** permite a usuarios reservar canchas de **Fútbol ⚽**, **Pádel 🎾** y **Voley Playa 🏐** de forma rápida y sin fricción. Los clientes no necesitan crear cuenta — solo ingresan sus datos en el momento de la reserva y reciben confirmación por email.

Los propietarios de canchas y administradores tienen acceso a un panel de control completo con gestión de reservas y analytics.

---

## 🏗️ Estructura del monorepo

```
ReservaTuCancha/
├── Backend/          # API REST — NestJS + TypeScript + MongoDB
├── Frontend/         # Web App — Next.js 14 + shadcn/ui + TypeScript
├── README.md         # Este archivo
└── docker-compose.yml
```

---

## 🎯 Flujo principal

```
Cliente visita la web
        ↓
Busca canchas (filtros: deporte, ciudad, precio)
        ↓
Elige cancha → selecciona fecha y hora
        ↓
Llena datos: nombre, email, teléfono   ← SIN LOGIN
        ↓
Paga con Stripe (tarjeta / PSE)
        ↓
Recibe email con confirmación + link de cancelación
        ↓
24h después → email con link único para dejar reseña
```

---

## 🧑‍💼 Roles

| Rol          | Autenticación | Acceso                                      |
|--------------|:-------------:|---------------------------------------------|
| **Cliente**  | ❌ No requerida | Buscar, reservar, cancelar con token        |
| **Propietario** | ✅ JWT      | Panel de canchas, reservas, analytics       |
| **Admin**    | ✅ JWT        | Panel global, usuarios, reportes            |

---

## 🗄️ Colecciones MongoDB

| Colección       | Descripción                               |
|-----------------|-------------------------------------------|
| `users`         | Propietarios y admins (con passwordHash)  |
| `courts`        | Canchas con horarios y ubicación          |
| `bookings`      | Reservas con datos del cliente (guest)    |
| `payments`      | Transacciones Stripe                      |
| `reviews`       | Reseñas vinculadas por token único        |
| `notifications` | Log de emails y SMS enviados              |

---

## ⚡ Inicio rápido

### Prerequisitos

- Node.js 20+
- MongoDB Atlas (cuenta gratuita en [mongodb.com](https://www.mongodb.com/cloud/atlas))
- Cuenta Stripe (modo test en [stripe.com](https://stripe.com))
- Cuenta SendGrid (plan gratis en [sendgrid.com](https://sendgrid.com))

### 1. Clonar y configurar entornos

```bash
# Backend
cd Backend
cp .env.example .env
# Editar .env con tus credenciales

# Frontend
cd ../Frontend
cp .env.example .env.local
# Editar .env.local con tus credenciales
```

### 2. Instalar dependencias

```bash
# Backend
cd Backend && npm install

# Frontend
cd ../Frontend && npm install
```

### 3. Inicializar componentes shadcn/ui

```bash
cd Frontend
npx shadcn@latest init
# Instalar componentes usados:
npx shadcn@latest add button card input label textarea badge separator
npx shadcn@latest add avatar dropdown-menu skeleton toast
```

### 4. Levantar en desarrollo

```bash
# Terminal 1 — Backend (puerto 4000)
cd Backend && npm run start:dev

# Terminal 2 — Frontend (puerto 3000)
cd Frontend && npm run dev
```

### 5. Abrir en el navegador

| Servicio       | URL                              |
|----------------|----------------------------------|
| Web            | http://localhost:3000            |
| API            | http://localhost:4000/api        |
| Swagger docs   | http://localhost:4000/api/docs   |

---

## 🐳 Docker Compose (opcional)

```yaml
# docker-compose.yml (crear en la raíz)
version: '3.8'
services:
  backend:
    build: ./Backend
    ports: ["4000:4000"]
    env_file: ./Backend/.env

  frontend:
    build: ./Frontend
    ports: ["3000:3000"]
    env_file: ./Frontend/.env.local
    depends_on: [backend]
```

```bash
docker-compose up --build
```

---

## 📡 Endpoints principales

```
# Públicos (sin autenticación)
GET    /api/courts                  Listar canchas
GET    /api/courts/:id              Detalle de cancha
POST   /api/bookings                Crear reserva (guest)
GET    /api/bookings/cancel?token=  Cancelar con token
GET    /api/bookings/slots          Slots ocupados
GET    /api/reviews/court/:id       Reseñas de cancha
POST   /api/reviews                 Enviar reseña con token
POST   /api/payments/create-intent  Crear PaymentIntent

# Propietario (JWT Bearer)
GET    /api/courts/owner/my-courts  Mis canchas
POST   /api/courts                  Crear cancha
PATCH  /api/courts/:id              Editar cancha
GET    /api/bookings/owner          Reservas de mis canchas
GET    /api/analytics/owner         Stats del propietario

# Admin (JWT Bearer)
GET    /api/users                   Todos los usuarios
GET    /api/analytics/admin         Stats globales
```

---

## 🚀 Deploy

| Servicio  | Recomendado            | Alternativa     |
|-----------|------------------------|-----------------|
| Backend   | Railway / Render       | AWS EC2 + Docker|
| Frontend  | Vercel                 | Netlify         |
| Database  | MongoDB Atlas          | Railway MongoDB |
| Media     | Cloudinary             | AWS S3          |
| Emails    | SendGrid               | Resend          |

---

## 🛠️ Tech Stack completo

### Backend
- **NestJS** 10 + TypeScript
- **MongoDB** + Mongoose ODM
- **JWT** + Passport (auth propietarios/admin)
- **Stripe** (pagos en línea)
- **SendGrid** (emails transaccionales)
- **class-validator** + **class-transformer** (validación DTOs)
- **Swagger** (documentación API)
- **bcryptjs** (hashing contraseñas)
- **uuid** (generación de tokens de cancelación/reseña)

### Frontend
- **Next.js 14** (App Router + SSR/SSG)
- **TypeScript** strict
- **shadcn/ui** + **Radix UI** + **Tailwind CSS**
- **React Query v5** (cache y fetching)
- **Zustand** (estado global)
- **NextAuth.js** (sesión propietarios/admin)
- **React Hook Form** + **Zod** (formularios)
- **Stripe.js** (checkout)
- **date-fns** (fechas en español)
- **Sonner** (notificaciones toast)
- **Lucide React** (iconos)

---

## 📄 Licencia

MIT — Libre para uso personal y comercial.

---

*Hecho con ❤️ en Colombia 🇨🇴*
