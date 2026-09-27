# AI Political Poster Maker — Backend API & Canvas Engine

[![Node.js](https://img.shields.io/badge/Node.js-v20+_LTS-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-5.x-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![MongoDB Atlas](https://img.shields.io/badge/MongoDB-Atlas_M0-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/atlas)
[![Cloudinary](https://img.shields.io/badge/Cloudinary-Media_CDN-3448C5?style=for-the-badge&logo=cloudinary&logoColor=white)](https://cloudinary.com/)
[![Google Gemini](https://img.shields.io/badge/Google_Gemini-2.5_Flash-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://aistudio.google.com/)

A scalable Node.js + Express + TypeScript backend powering the **AI Political Poster Maker**. It implements a high-resolution 1200×1600 pixel 2D canvas rendering engine with authentic Bengali TrueType typography (`Kalpurush.ttf`), Google Gemini AI layout consultation, Cloudinary streaming, and status polling.

🌐 **Connected Live Frontend:** [https://ai-political-poster-maker-client.vercel.app](https://ai-political-poster-maker-client.vercel.app)

---

## 🎨 Sample Generated Poster

Generated server-side at **1200 × 1600 pixels (Print Ready)** and streamed directly to Cloudinary:

<div align="center">
  <img src="docs/images/sample-poster.png" alt="Sample Rendered Political Poster" width="380" style="border-radius: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.2);" />
  <p><em>Rendered with node-canvas + Kalpurush.ttf TrueType font with zero text hallucinations.</em></p>
</div>

---

## 💡 AI-Assisted UI & Graphic Architecture

> **Design Attribution & Architectural Rationale:**  
> Special thanks to **Google Gemini** for assisting in the UI/UX design, layout composition, and aesthetic color palettes for traditional Bangladeshi political graphic styles.  
> 
> **Why Option B (AI Layout + Canvas) instead of Option A (Diffusion Models)?**  
> Image diffusion models (e.g., Stable Diffusion, DALL-E, Imagen) notoriously fail at complex non-Latin scripts, rendering Bengali conjunct consonants (যেমন: ক্ত, ক্ষ, ষ্ণ, ত্র) as illegible garbled scribbles. Furthermore, candidate faces become distorted when merged into AI backgrounds.  
> 
> In **Option B**, Google Gemini 2.5 Flash acts as the creative design consultant—analyzing the occasion, headline, and photos to output a structured JSON palette (hex colors, font sizes, vignette positions). The actual poster is then rendered server-side via **`node-canvas`** using the authentic **Kalpurush TrueType font**, guaranteeing:
> 1. **100% Correct Bengali Spelling:** Zero font hallucinations.
> 2. **Crisp 1200×1600 Resolution:** Vector-level text rendering.
> 3. **High Speed & Low Cost:** Returns structured JSON in ~1.2s at zero cost via Google AI Studio.

---

## ✨ Core Features & Capabilities

- **Non-Blocking Asynchronous Generation:** Returns `HTTP 202 Accepted` immediately (~100ms) with `status: 'generating'`, offloading Gemini layout calculation and canvas rendering to background execution.
- **Real-Time Status Polling:** `GET /api/v1/posters/:id` allows the client to poll every 2 seconds until the poster transitions to `completed` or `failed`.
- **Server-Side 2D Canvas Engine:** Draws background linear gradients, circular leader vignettes with gold borders (`drawCircularLeader`), candidate framed portrait, headline with drop shadows, designation banner, and footer credit bar.
- **Direct Cloudinary Buffer Streaming:** In-memory PNG buffer (`canvas.toBuffer('image/png')`) is streamed directly to Cloudinary folder `political_posters/generated` without temporary disk I/O.
- **In-Memory Rate Limiting:** Enforces an hourly quota of **5 posters per hour per user/IP** to protect Gemini API quotas and Cloudinary storage (`generationRateLimiter`).
- **Bounded Poster Regeneration:** Allows up to 3 regenerations per poster (`regenerationCount <= 3`) with custom headline tweaks.
- **Template Catalog Seeder:** Idempotent seed script (`npm run seed`) populating Victory Day, Campaign, and Memorial templates in MongoDB Atlas.
- **Secure Authentication:** JWT token authentication with bcrypt password hashing and modular middleware.

---

## 🛠️ Tech Stack

- **Runtime:** Node.js (CommonJS, TypeScript)
- **Framework:** Express.js 5.x
- **Graphics Engine:** `canvas` (`node-canvas` / Cairo Graphics) + `Kalpurush.ttf`
- **Database:** MongoDB Atlas via Mongoose 9.x
- **AI Engine:** `@google/generative-ai` (Gemini 2.5 Flash / 1.5 Flash fallback)
- **Media CDN:** Cloudinary SDK v2
- **File Upload:** Multer (memoryStorage)

---

## 📁 Project Structure

```
server/
├── src/
│   ├── assets/
│   │   └── fonts/
│   │       └── Kalpurush.ttf      # TrueType Bengali Unicode font (Tanbin Islam Siyam)
│   ├── config/
│   │   ├── cloudinary.ts          # Cloudinary v2 SDK configuration
│   │   └── db.ts                  # MongoDB Atlas connection handler
│   ├── controllers/
│   │   ├── auth.controller.ts     # User registration, login & profile
│   │   ├── poster.controller.ts   # Poster creation, polling, history & regeneration
│   │   ├── template.controller.ts # Template catalog endpoints
│   │   └── upload.controller.ts   # Cloudinary photo streaming upload
│   ├── middleware/
│   │   ├── auth.middleware.ts     # Bearer JWT verification
│   │   ├── rate-limit.middleware.ts # 5 posters/hour in-memory limiter
│   │   └── upload.middleware.ts   # Multer 5MB memoryStorage filter
│   ├── models/
│   │   ├── poster.model.ts        # Poster Mongoose schema & lifecycle states
│   │   ├── template.model.ts      # Template schema
│   │   └── user.model.ts          # User schema with bcrypt password hashing
│   ├── routes/
│   │   ├── auth.routes.ts         # /api/v1/auth
│   │   ├── poster.routes.ts       # /api/v1/posters
│   │   ├── template.routes.ts     # /api/v1/templates
│   │   └── upload.routes.ts       # /api/v1/upload
│   ├── seeds/
│   │   └── template.seed.ts       # Idempotent template seeder script
│   ├── services/
│   │   ├── canvas.service.ts      # 1200x1600 2D canvas poster renderer
│   │   └── gemini.service.ts      # Gemini Option B layout suggestion service
│   └── index.ts                   # Express server bootstrap & route mounting
├── docs/images/sample-poster.png  # Generated poster sample asset
├── render.yaml                    # Render.com cloud deployment blueprint
├── package.json
└── tsconfig.json
```

---

## 📡 API Endpoints Reference

### 1. Healthcheck
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/api/health` | Service health status and timestamp | Public |

### 2. Authentication
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `POST` | `/api/v1/auth/register` | Register new user account | Public |
| `POST` | `/api/v1/auth/login` | Login and retrieve Bearer JWT | Public |
| `GET` | `/api/v1/auth/me` | Fetch authenticated user profile | Bearer Token |

### 3. Media Upload
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `POST` | `/api/v1/upload` | Stream image (max 5MB) to Cloudinary | Public |

### 4. Template Catalog
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/api/v1/templates` | List all active templates with filters | Public |
| `GET` | `/api/v1/templates/:id` | Fetch template details by ID or slug | Public |

### 5. Poster Generation & Lifecycle
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `POST` | `/api/v1/posters` | Create poster & start background render | Bearer Token (Rate limited) |
| `GET` | `/api/v1/posters/:id` | Poll generation status & retrieve image | Public |
| `GET` | `/api/v1/posters/user/:userId` | Get user's poster history | Bearer Token |
| `POST` | `/api/v1/posters/:id/regenerate` | Re-generate poster (max 3 times) | Bearer Token (Rate limited) |

---

## 🚀 Getting Started Locally

### 1. Prerequisites
- Node.js v20+ or v22+
- MongoDB Atlas cluster connection string
- Cloudinary credentials
- Google Gemini API key

### 2. Installation
```bash
# Navigate to the server directory
cd server

# Install dependencies
npm install
```

### 3. Environment Variables
Create a `.env` file inside the `server/` directory:

```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:3000

# MongoDB Atlas
MONGODB_URI=your_mongodb_atlas_connection_string

# Cloudinary Setup
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# JWT Authentication
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d

# Google Gemini AI
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.5-flash
```

### 4. Seed the Database
Seed the 3 default political templates into MongoDB Atlas:
```bash
npm run seed
```

### 5. Start Development Server
```bash
npm run dev
```

Server will start on `http://localhost:5000`.

---

## ☁️ Deployment (Render.com)

The server repository includes a `render.yaml` blueprint for automatic deployment on [Render](https://render.com):

1. Connect `AI-Political-Poster-Maker-Server` to Render as a **Web Service**.
2. **Build Command:** `npm install --include=dev && npm run build`
3. **Start Command:** `npm run start`
4. Set environment variables in the Render dashboard:
   - `MONGODB_URI`
   - `JWT_SECRET`
   - `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
   - `GEMINI_API_KEY`, `GEMINI_MODEL=gemini-2.5-flash`
   - `CLIENT_URL=https://ai-political-poster-maker-client.vercel.app`

---

## 📄 License
This project is open-source and available under the [MIT License](LICENSE).
