# 🔧 ReservaTuCancha — Backend

> API REST construida con **NestJS** + **TypeScript** + **MongoDB**

---

## 📁 Estructura de carpetas

```
Backend/
├── src/
│   ├── main.ts                         # Bootstrap + Swagger + ValidationPipe
│   ├── app.module.ts                   # Módulo raíz (imports globales)
│   │
│   ├── common/
│   │   ├── decorators/
│   │   │   └── roles.decorator.ts      # @Roles(UserRole.OWNER)
│   │   ├── guards/
│   │   │   ├── jwt-auth.guard.ts       # Protege rutas con JWT
│   │   │   └── roles.guard.ts          # Verifica rol del usuario
│   │   ├── filters/                    # HttpExceptionFilter global
│   │   ├── interceptors/               # Logging, Transform response
│   │   ├── pipes/                      # ValidationPipe global
│   │   └── dto/
│   │       └── pagination.dto.ts       # page, limit reutilizable
│   │
│   ├── config/
│   │   ├── database.config.ts
│   │   └── jwt.config.ts
│   │
│   ├── database/
│   │   └── database.module.ts          # Conexión MongoDB vía ConfigService
│   │
│   └── modules/
│       ├── auth/                       # Login JWT para owner/admin
│       │   ├── auth.module.ts
│       │   ├── auth.controller.ts      # POST /auth/login, GET /auth/me
│       │   ├── auth.service.ts
│       │   ├── strategies/
│       │   │   └── jwt.strategy.ts     # Valida Bearer token
│       │   └── dto/
│       │       └── login.dto.ts
│       │
│       ├── users/                      # Propietarios y admins
│       │   ├── users.module.ts
│       │   ├── users.service.ts
│       │   └── schemas/
│       │       └── user.schema.ts      # role: 'owner' | 'admin'
│       │
│       ├── courts/                     # Canchas deportivas
│       │   ├── courts.module.ts
│       │   ├── courts.controller.ts    # CRUD + filtros públicos
│       │   ├── courts.service.ts
│       │   ├── schemas/
│       │   │   └── court.schema.ts     # sport enum + availability[]
│       │   └── dto/
│       │       └── create-court.dto.ts
│       │
│       ├── bookings/                   # Reservas sin login
│       │   ├── bookings.module.ts
│       │   ├── bookings.controller.ts  # POST público + cancel por token
│       │   ├── bookings.service.ts     # Genera cancelToken + reviewToken
│       │   ├── schemas/
│       │   │   └── booking.schema.ts   # guestName/Email/Phone (no userId)
│       │   └── dto/
│       │       └── create-booking.dto.ts
│       │
│       ├── payments/                   # Stripe integration
│       │   ├── payments.module.ts
│       │   ├── payments.controller.ts  # /create-intent + /webhook
│       │   ├── payments.service.ts     # PaymentIntent + webhook handler
│       │   └── schemas/
│       │       └── payment.schema.ts
│       │
│       ├── reviews/                    # Reseñas por token (sin login)
│       │   ├── reviews.module.ts
│       │   ├── reviews.controller.ts
│       │   ├── reviews.service.ts      # Recalcula averageRating en Court
│       │   └── schemas/
│       │       └── review.schema.ts
│       │
│       ├── notifications/              # Emails transaccionales
│       │   ├── notifications.module.ts
│       │   └── notifications.service.ts # SendGrid: confirmación, reseña, cancelación
│       │
│       └── analytics/                  # Stats por propietario y globales
│           ├── analytics.module.ts
│           ├── analytics.controller.ts
│           └── analytics.service.ts    # Aggregations MongoDB
│
├── test/
├── .env.example
├── Dockerfile
├── nest-cli.json
├── package.json
└── tsconfig.json
```

---

## ⚙️ Configuración

### 1. Variables de entorno

```bash
cp .env.example .env
```

Edita `.env` con tus valores:

```env
PORT=4000
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster0.xxxxx.mongodb.net/reservatucancha
JWT_SECRET=un_secreto_muy_largo_y_seguro_min_32_caracteres
JWT_EXPIRES_IN=7d
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
SENDGRID_API_KEY=SG.xxxxx
SENDGRID_FROM_EMAIL=noreply@reservatucancha.com
FRONTEND_URL=http://localhost:3000
```

### 2. Instalar y levantar

```bash
npm install
npm run start:dev
```

La API queda en **http://localhost:4000/api**
Swagger docs en **http://localhost:4000/api/docs**

---

## 🔐 Autenticación

Solo **propietarios** y **admins** necesitan autenticarse. Los clientes operan de forma anónima usando tokens en URLs.

```
POST /api/auth/login
Body: { "email": "...", "password": "..." }
Response: { "accessToken": "eyJ...", "user": { ... } }
```

Usa el token como `Authorization: Bearer <token>` en las rutas protegidas.

### Guards disponibles

| Guard          | Uso                                          |
|----------------|----------------------------------------------|
| `JwtAuthGuard` | `@UseGuards(JwtAuthGuard)` — verifica JWT    |
| `RolesGuard`   | `@Roles(UserRole.OWNER)` — verifica rol      |

---

## 🎯 Flujo de reserva (guest)

```
1. POST /api/bookings
   → Verifica disponibilidad del slot
   → Genera cancelToken (UUID) y reviewToken (UUID)
   → Guarda booking con status: 'pending'
   → Envía email de confirmación con link de cancelación

2. POST /api/payments/create-intent
   → Crea Stripe PaymentIntent
   → Devuelve clientSecret al frontend

3. Stripe webhook → POST /api/payments/webhook
   → payment_intent.succeeded → booking.status = 'confirmed'
   → Envía email de confirmación de pago

4. GET /api/bookings/cancel?token=<uuid>
   → Cambia status a 'cancelled'
   → Envía email de cancelación
   → (Reembolso Stripe si aplica)

5. 24h después → Cron job envía email con reviewToken
   POST /api/reviews (con reviewToken)
   → Crea review y recalcula averageRating en la cancha
```

---

## 📊 MongoDB — Decisiones de diseño

### `bookings` — sin `userId`

La colección `bookings` almacena directamente los datos del cliente:

```typescript
guestName:   string    // "Juan Pérez"
guestEmail:  string    // "juan@email.com"
guestPhone:  string    // "+573001234567"
cancelToken: string    // UUID único por reserva
reviewToken: string    // UUID único por reserva
```

Esto elimina la necesidad de autenticación para el flujo completo de reserva.

### `courts` — availability embebida

Los horarios disponibles se embeben directamente en el documento de la cancha como un array de `AvailabilitySlot`, evitando joins costosos en el momento de consultar disponibilidad.

### Índices creados

```
bookings: courtId+date, guestEmail, cancelToken, reviewToken, status
courts:   sport+isActive, location.city, ownerId, averageRating
reviews:  courtId, reviewToken
users:    email, role
```

---

## 🛒 Integración Stripe

### Flujo de pago

```
Frontend                    Backend                     Stripe
   |                           |                            |
   |-- POST /create-intent --> |                            |
   |                           |-- createPaymentIntent --> |
   |                           |<-- { clientSecret } ----- |
   |<-- { clientSecret } ----- |                            |
   |                           |                            |
   |-- confirmPayment() -----> Stripe                      |
   |                           |                            |
   |                           |<-- webhook: succeeded ---- |
   |                           |-- booking.confirmed ----> DB
   |                           |-- email confirmación ---> Cliente
```

### Webhook local (desarrollo)

```bash
# Instalar Stripe CLI
stripe listen --forward-to localhost:4000/api/payments/webhook
```

---

## 📧 Emails enviados (SendGrid)

| Trigger                    | Destinatario | Contenido                              |
|----------------------------|:------------:|----------------------------------------|
| Reserva creada             | Cliente      | Detalles + link de cancelación         |
| Pago confirmado (webhook)  | Cliente      | Confirmación de pago                   |
| Reserva cancelada          | Cliente      | Confirmación de cancelación            |
| 24h post-reserva           | Cliente      | Link único para dejar reseña           |

---

## 🧪 Testing

```bash
npm run test          # Unit tests (Jest)
npm run test:e2e      # E2E tests
npm run test:watch    # Watch mode
```

---

## 🐳 Docker

```bash
# Build
docker build -t reservatucancha-backend .

# Run
docker run -p 4000:4000 --env-file .env reservatucancha-backend
```

---

## 🚀 Deploy en Railway

```bash
# Instalar Railway CLI
npm install -g @railway/cli

# Login y deploy
railway login
railway init
railway up

# Variables de entorno en Railway dashboard
# Agrega todas las del .env.example
```

---

*ReservaTuCancha Backend — NestJS + MongoDB 🇨🇴*
