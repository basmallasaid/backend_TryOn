# TryOn Professional Backend

> AI-powered fashion platform — virtual try-on, garment analysis, wardrobe management, outfit matching, and clothing recycling/upcycling.

## Key Features

- **Virtual Try-On** — Upload a person image and a garment to generate a photo-realistic try-on using AI (KIE nano-banana-2 model); supports single garment and full outfit (top + bottom) modes.
- **AI Garment Analysis** — Upload clothing images for automatic detection of category, color palette, style, pattern, season suitability, and gender using Hugging Face Qwen3-VL. Results are cached by image hash.
- **Smart Wardrobe** — Save analyzed garments to a personal digital wardrobe; add, remove, clear items.
- **Outfit Matching** — Find matching items from your wardrobe and store products based on color harmony, style compatibility, and weather relevance.
- **Outfit Recommendations** — Generate scored full-outfit recommendations with rotation logic to avoid repetition; composite image generation included.
- **Weather-Aware Suggestions** — Integrates with Open-Meteo (free, no API key) to fetch real-time weather and rank outfits/matches accordingly.
- **Clothing Recycling & Upcycling** — Upload 1–3 garment images; AI (GPT-4o-mini) generates 3 creative upcycling/remix ideas; optionally generate visual previews via Qwen image generation.
- **AI Avatar Generation** — Create personalized avatars from detailed facial attributes (age, height, skin tone, face shape, hair color, etc.) using KIE image generation.
- **Push Notifications** — Expo push notification support with token registration, targeted sending, broadcasting, and automated event-based notifications (try-on complete, recycle ready, match found).
- **In-App Notifications** — Read/unread notification management with mark-as-read and clear-all.
- **Email Management** — Full admin-to-user and user-to-admin email system with threading, read tracking, filtering, and pagination.
- **Contact Form** — Public contact message submission with admin read/delete management.
- **User Authentication & Authorization**
  - Email/password registration and login with JWT.
  - Google OAuth 2.0 (web flow + mobile ID token).
  - Password reset via OTP sent by email.
  - Email verification.
  - Role-based access (user / admin).
- **User Profile Management** — Update profile, language preference, dark mode, notifications, avatar/mood image.
- **Favorites** — Save products, wardrobe items, or try-on results as favorites.
- **Subscription & Payments** — Stripe integration with `/api/webhooks/stripe` for subscription management (Pro monthly/yearly).
- **API Key Management** — Admin dashboard for managing external AI service keys (HF_TOKEN, KIE_API_KEY, DASHSCOPE_API_KEY).
- **Usage Limits** — Tier-based rate limiting for try-on, recycle, and avatar operations per user subscription.
- **Internationalization (i18n)** — Multi-language support via i18next with locale files.
- **Swagger API Documentation** — Interactive API docs at `/api-docs`.
- **Docker Support** — Production-ready Dockerfile.
- **Automated Notifications** — Configurable notification templates for try-on, recycle, and matching events with app/email/push channel control.
- **Seed Scripts** — Auto-seeds admin user, default API keys, and notification configs on first run.

## Tech Stack

| Category          | Technology                                              |
| ----------------- | ------------------------------------------------------- |
| Runtime           | Node.js 22                                              |
| Framework         | Express 5                                               |
| Database          | MongoDB (Mongoose ODM)                                  |
| Authentication    | JWT (jsonwebtoken), Passport.js, Google OAuth 2.0       |
| Payments          | Stripe                                                  |
| AI / ML           | Hugging Face (Qwen3-VL), DashScope/Qwen, KIE, GPT-4o    |
| Notifications     | Expo Server SDK (push), Nodemailer (email)              |
| File Upload       | Multer (memory storage)                                 |
| Image Processing  | Sharp                                                   |
| API Documentation | Swagger (swagger-jsdoc + swagger-ui-express)            |
| Internationalization | i18next, i18next-fs-backend, i18next-http-middleware |
| Dev Tools         | Nodemon                                                 |
| Containerization  | Docker                                                  |

## Prerequisites

- Node.js 22.x or later
- npm
- MongoDB instance (local or Atlas)
- (Optional) Docker

## Environment Variables

Create a `.env.development` or `.env.production` file in the project root:

| Variable                          | Description                                   |
| --------------------------------- | --------------------------------------------- |
| `NODE_ENV`                        | `development` or `production`                 |
| `PORT`                            | Server port (default: 5000 dev / 8080 prod)   |
| `API_URL`                         | Public API base URL                           |
| `MONGO_URI`                       | MongoDB connection string                     |
| `MONGO_DB_NAME`                   | Database name                                 |
| `JWT_SECRET`                      | Secret key for signing JWT tokens             |
| `GOOGLE_CLIENT_ID`                | Google OAuth client ID                        |
| `GOOGLE_CLIENT_SECRET`            | Google OAuth client secret                    |
| `EMAIL_USER`                      | Gmail address for sending emails              |
| `EMAIL_PASS`                      | Gmail app password                            |
| `ADMIN_EMAIL`                     | Admin user email (auto-seeded)                |
| `ADMIN_ENC_KEY`                   | Admin password encryption key                 |
| `CLIENT_URL`                      | Frontend URL (CORS & OAuth redirect)          |
| `STRIPE_SECRET_KEY`               | Stripe secret key                             |
| `STRIPE_PRO_MONTHLY_PRICE_ID`     | Stripe price ID for monthly Pro plan          |
| `STRIPE_PRO_YEARLY_PRICE_ID`      | Stripe price ID for yearly Pro plan           |
| `STRIPE_WEBHOOK_SECRET`           | Stripe webhook signing secret                 |
| `DASHSCOPE_API_KEY`               | DashScope API key for Qwen image generation   |
| `DASHSCOPE_ENDPOINT`              | DashScope endpoint URL                        |
| `KIE_API_key`                     | KIE API key for try-on / avatar generation    |
| `HF_TOKEN`                        | Hugging Face token for garment classification |
| `API_KEY`                         | Generic API key (legacy)                      |

## Installation & Setup

```bash
# 1. Clone the repository
git clone <repository-url>
cd backend_TryOn

# 2. Install dependencies
npm install

# 3. Create environment file
cp .env.development .env.development  # edit with your values

# 4. Start MongoDB (if running locally)
#    or ensure MONGO_URI points to your Atlas cluster

# 5. Run in development mode with hot reload
npm run dev

# 6. For production
npm start
```

### Docker

```bash
docker build -t tryon-backend .
docker run -p 8080:8080 --env-file .env.production tryon-backend
```

## Project Architecture

```
backend_TryOn/
├── src/
│   ├── app.js                      # Express app setup, middleware, route mounting, seeding
│   ├── server.js                   # Entry point — DB connect, seed, scheduler, listen
│   ├── config/
│   │   ├── db.js                   # MongoDB/Mongoose connection
│   │   ├── passport.js             # Google OAuth strategy
│   │   ├── swagger.js              # Swagger/OpenAPI spec definition
│   │   ├── mail.js                 # Nodemailer transporter (Gmail)
│   │   └── api.js                  # External API configuration
│   ├── models/                     # Mongoose schemas
│   │   ├── User.js                 # User with roles, usage tracking, favorites
│   │   ├── WardrobeItem.js         # Digital wardrobe garments
│   │   ├── Analysis.js             # Garment analysis results
│   │   ├── Product.js              # Store products
│   │   ├── Store.js                # Store management
│   │   ├── MatchHistory.js         # Outfit match history
│   │   ├── Recommendation.js       # Generated outfit recommendations
│   │   ├── RecycleSession.js       # Upcycling/recycling sessions
│   │   ├── Avatar.js               # AI-generated avatars
│   │   ├── Notification.js         # In-app notifications
│   │   ├── NotificationLog.js      # Push notification logs
│   │   ├── AutomatedNotification.js # Configurable notification templates
│   │   ├── Email.js                # Email management
│   │   ├── ContactMessage.js       # Contact form submissions
│   │   ├── ApiKey.js               # External API key store
│   │   ├── UserToken.js            # Push notification tokens
│   │   ├── OutfitUsage.js          # Outfit usage tracking
│   │   └── ...
│   ├── routes/                     # Express route definitions
│   │   ├── authRoutes.js           # /api/auth/*
│   │   ├── userRoutes.js           # /api/users/*
│   │   ├── paymentRoutes.js        # /api/payments/*
│   │   ├── webhookRoutes.js        # /api/webhooks/*
│   │   ├── analyzeRoutes.js        # /api/analyze/*
│   │   ├── wardrobeRoutes.js       # /api/wardrobe/*
│   │   ├── matchesRoutes.js        # /api/matches/*
│   │   ├── recommendationsRoutes.js # /api/recommendations/*
│   │   ├── virtualTryOnRoutes.js   # /api/virtual-tryon/*
│   │   ├── recycleRoutes.js        # /api/recycle/*
│   │   ├── weatherRoutes.js        # /api/weather/*
│   │   ├── avatarRoutes.js         # /api/avatars/*
│   │   ├── notificationRoutes.js   # /api/notifications/*
│   │   ├── emailRoutes.js          # /api/emails/*
│   │   ├── contactRoutes.js        # /api/contact/*
│   │   ├── storeRoutes.js          # /api/stores/*
│   │   ├── productRoutes.js        # /api/products/*
│   │   ├── apiKeyRoutes.js         # /api/api-keys/*
│   │   └── automatedNotificationRoutes.js # /api/automated-notifications/*
│   ├── controllers/                # Request handlers
│   ├── services/                   # Business logic & external API integrations
│   │   ├── analyze.js              # AI garment analysis
│   │   ├── classify.js             # Garment classification
│   │   ├── virtualTryOn.js         # Virtual try-on generation
│   │   ├── recycleService.js       # Upcycling analysis & image generation
│   │   ├── recommendationEngine.js # Outfit scoring & rotation
│   │   ├── matching.js             # Item-to-item matching
│   │   ├── weather.js              # Open-Meteo integration
│   │   ├── wardrobe.js             # Wardrobe data access
│   │   ├── notificationService.js  # Push notification dispatcher
│   │   ├── notificationScheduler.js # Scheduled notification cron
│   │   ├── emailService.js         # Email sending
│   │   ├── storeService.js         # Store CRUD
│   │   ├── productService.js       # Product CRUD
│   │   ├── imageGenerationService.js # AI image generation
│   │   ├── compositeService.js     # Outfit composite image generation
│   │   ├── normalizer.js           # Data normalization utilities
│   │   └── translationService.js   # i18n translation
│   ├── middlewares/                # Express middleware
│   │   ├── authMiddleware.js       # JWT authentication
│   │   ├── adminMiddleware.js      # Admin role check
│   │   ├── errorMiddleware.js      # Global error handler
│   │   ├── extractKeys.js          # API key injection from DB
│   │   ├── i18nMiddleware.js       # Internationalization
│   │   ├── usageLimit.js           # Subscription-based rate limiting
│   │   └── logger.js               # Request logging
│   ├── utils/                      # Utilities
│   │   ├── generateToken.js        # JWT token generation
│   │   ├── sendEmail.js            # Email sending helper
│   │   └── adminPassword.js        # Admin password encryption
│   └── i18n/                       # Translation files
│       └── locales/
├── scripts/
│   └── encrypt-admin-password.js   # Admin password encryption script
├── tests/
│   └── testStore.js
├── Dockerfile                      # Production Docker image
├── .env.development                # Development environment
├── .env.production                 # Production environment
└── package.json
```

## API Endpoints Overview

### Authentication (`/api/auth`)
| Method | Endpoint             | Description                       |
| ------ | -------------------- | --------------------------------- |
| POST   | `/signup`            | Register a new user               |
| POST   | `/login`             | Login with email & password       |
| POST   | `/forgot-password`   | Request password reset OTP        |
| POST   | `/verify-otp`        | Verify OTP for password reset     |
| PUT    | `/reset-password`    | Reset password after OTP          |
| PUT    | `/change-password`   | Change password (authenticated)   |
| POST   | `/logout`            | Logout (authenticated)            |
| POST   | `/send-verification` | Send email verification link      |
| GET    | `/verify-email/:token` | Verify email via link           |
| GET    | `/google`            | Initiate Google OAuth login       |
| GET    | `/google/callback`   | Google OAuth callback             |
| POST   | `/google/mobile`     | Mobile Google login via ID token  |

### Users (`/api/users`)
| Method | Endpoint            | Description                        |
| ------ | ------------------- | ---------------------------------- |
| GET    | `/`                 | List all users (admin)             |
| POST   | `/`                 | Create admin user (admin)          |
| GET    | `/:id`              | Get user by ID                     |
| PUT    | `/profile`          | Update profile                     |
| POST   | `/settings`         | Get user settings                  |
| PUT    | `/settings/language` | Update language preference        |
| PUT    | `/settings/notifications` | Toggle notifications           |
| PUT    | `/settings/dark-mode` | Update dark mode preference      |
| DELETE | `/account`          | Delete account                     |
| PUT    | `/user-image`       | Update profile image               |
| DELETE | `/user-image`       | Remove profile image               |
| GET    | `/favorites`        | Get favorites                      |
| POST   | `/favorites`        | Add favorite                       |
| PUT    | `/favorites/:id`    | Update favorite                    |
| DELETE | `/favorites/:id`    | Remove favorite                    |
| GET    | `/latest-tryon`     | Get try-on history                 |
| POST   | `/latest-tryon`     | Add try-on record                  |
| DELETE | `/latest-tryon/:id` | Remove try-on record               |
| GET    | `/latest-recycle`   | Get recycle history                |
| POST   | `/latest-recycle`   | Add recycle record                 |
| DELETE | `/latest-recycle/:id` | Remove recycle record            |
| GET    | `/stats`            | Get user statistics (admin)        |
| GET    | `/usage`            | Get usage limits & consumed credits|

### Virtual Try-On (`/api/virtual-tryon`)
| Method | Endpoint    | Description                             |
| ------ | ----------- | --------------------------------------- |
| POST   | `/`         | Generate try-on (person + garment)      |
| POST   | `/outfit`   | Generate try-on (person + top + bottom)  |

### Garment Analysis (`/api/analyze`)
| Method | Endpoint    | Description                       |
| ------ | ----------- | --------------------------------- |
| GET    | `/`         | Get analysis history              |
| POST   | `/`         | Analyze garment image             |
| GET    | `/:id`      | Get analysis by ID                |
| PUT    | `/:id`      | Update analysis                   |
| DELETE | `/:id`      | Delete analysis                   |
| DELETE | `/`         | Clear all analyses                |

### Wardrobe (`/api/wardrobe`)
| Method | Endpoint          | Description                    |
| ------ | ----------------- | ------------------------------ |
| GET    | `/`               | Get all wardrobe items         |
| POST   | `/from-analysis`  | Add garment from analysis      |
| DELETE | `/`               | Clear wardrobe                 |
| DELETE | `/:id`            | Delete wardrobe item           |

### Matches (`/api/matches`)
| Method | Endpoint                | Description                          |
| ------ | ----------------------- | ------------------------------------ |
| GET    | `/`                     | Get match history                    |
| POST   | `/`                     | Find matches for a wardrobe item     |
| POST   | `/product/:productId`   | Find matches for a store product     |
| POST   | `/analysis/:analysisId` | Find matches for an analyzed image   |

### Recommendations (`/api/recommendations`)
| Method | Endpoint | Description                          |
| ------ | -------- | ------------------------------------ |
| GET    | `/`      | Get recommendation history           |
| POST   | `/`      | Generate outfit recommendations      |
| DELETE | `/`      | Clear recommendations                |

### Recycling / Upcycling (`/api/recycle`)
| Method | Endpoint               | Description                         |
| ------ | ---------------------- | ----------------------------------- |
| POST   | `/analyze`             | Analyze garments for upcycling      |
| POST   | `/:id/generate/:ideaId` | Generate image for one idea        |
| POST   | `/:id/generate-all`    | Generate images for all ideas       |
| GET    | `/:id`                 | Get recycle session details         |

### Weather (`/api/weather`)
| Method | Endpoint | Description                       |
| ------ | -------- | --------------------------------- |
| GET    | `/`      | Get current weather by lat/lon    |

### Avatars (`/api/avatars`)
| Method | Endpoint  | Description               |
| ------ | --------- | ------------------------- |
| GET    | `/`       | Get user avatars          |
| POST   | `/`       | Create AI avatar          |
| GET    | `/:id`    | Get avatar by ID          |
| PUT    | `/:id`    | Update avatar             |
| DELETE | `/:id`    | Delete avatar             |

### Payments (`/api/payments`)
| Method | Endpoint                  | Description                  |
| ------ | ------------------------- | ---------------------------- |
| POST   | `/create-checkout-session` | Create Stripe checkout      |
| POST   | `/cancel-subscription`     | Cancel active subscription  |
| POST   | `/sync-subscription`       | Sync subscription status    |

### Notifications (`/api/notifications`)
| Method | Endpoint               | Description                          |
| ------ | ---------------------- | ------------------------------------ |
| GET    | `/`                    | Get in-app notifications             |
| GET    | `/all`                 | Get all notifications (admin)        |
| POST   | `/register`            | Register Expo push token             |
| POST   | `/send-by-email`       | Send push by user email (admin)      |
| POST   | `/send-to-user`        | Send push to specific user (admin)   |
| POST   | `/broadcast`           | Broadcast push to all (admin)        |
| POST   | `/send-test`           | Send test notification (admin)       |
| POST   | `/tryon-ready`         | Send try-on ready push               |
| PATCH  | `/read-all`            | Mark all as read                     |
| PATCH  | `/:id/read`            | Mark single as read                  |
| DELETE | `/`                    | Clear all notifications              |
| DELETE | `/:id`                 | Delete notification                  |
| GET    | `/scheduled`           | Get scheduled notifications (admin)  |
| DELETE | `/scheduled/:id`       | Cancel scheduled (admin)             |

### Emails (`/api/emails`)
| Method | Endpoint                 | Description                    |
| ------ | ------------------------ | ------------------------------ |
| POST   | `/contact-admin`         | Send message to admin          |
| GET    | `/sent`                  | View sent messages             |
| GET    | `/admin-replies`         | View admin replies             |
| GET    | `/conversation`          | Full conversation with admin   |
| (Admin) |                      |                                |
| POST   | `/admin/send-to-user`    | Send email to user             |
| POST   | `/admin/send-to-all`     | Send email to all users        |
| GET    | `/admin/all`             | View all emails                |
| GET    | `/admin/thread/:parentEmailId` | View email thread        |
| POST   | `/admin/reply/:parentEmailId`  | Reply to user message    |
| PATCH  | `/admin/mark-read/:id`   | Mark email read/unread         |
| PATCH  | `/admin/mark-all-read`   | Mark all as read               |
| GET    | `/admin/unread-count`    | Get unread count               |
| GET    | `/admin/filter`          | Filter emails                  |

### Stores (`/api/stores`)
| Method | Endpoint | Description                 |
| ------ | -------- | --------------------------- |
| GET    | `/`      | List stores (filterable)    |
| POST   | `/`      | Create store (admin)        |
| GET    | `/:id`   | Get store by ID             |
| PUT    | `/:id`   | Update store (admin)        |
| DELETE | `/:id`   | Delete store (admin)        |

### Products (`/api/products`)
| Method | Endpoint | Description                  |
| ------ | -------- | ---------------------------- |
| GET    | `/`      | List products (filterable)   |
| POST   | `/`      | Create product (admin)       |
| GET    | `/:id`   | Get product by ID            |
| PUT    | `/:id`   | Update product (admin)       |
| DELETE | `/:id`   | Delete product (admin)       |

### Webhooks (`/api/webhooks`)
| Method | Endpoint  | Description              |
| ------ | --------- | ------------------------ |
| POST   | `/stripe` | Stripe webhook endpoint  |

### Contact (`/api/contact`)
| Method | Endpoint      | Description                     |
| ------ | ------------- | ------------------------------- |
| POST   | `/`           | Submit contact message (public) |
| GET    | `/`           | Get all messages (admin)        |
| PUT    | `/:id/read`   | Mark as read (admin)            |
| DELETE | `/:id`        | Delete message (admin)          |

### API Keys (`/api/api-keys`)
| Method | Endpoint | Description             |
| ------ | -------- | ----------------------- |
| GET    | `/`      | List all API keys       |
| GET    | `/:id`   | Get API key by ID       |
| PUT    | `/:id`   | Update API key          |
| DELETE | `/:id`   | Delete API key          |

### Automated Notifications (`/api/automated-notifications`)
| Method | Endpoint        | Description                      |
| ------ | --------------- | -------------------------------- |
| GET    | `/`             | List notification configs (admin)|
| PUT    | `/:operation`   | Update config by operation (admin) |

## API Documentation

Interactive Swagger docs are available at `/api-docs` when the server is running.

---

Built with Node.js, Express, MongoDB, and AI-powered services.
