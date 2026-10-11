# 🛍️ Scatch — Mini E-Commerce Platform

Scatch is a full-stack e-commerce web application built with **Node.js**, **Express**, **MongoDB (Mongoose)**, and **EJS**. It supports user authentication, product browsing, a shopping cart, and an admin/owner panel for product management.

---

##  Features

- 🔐 **User Authentication** — Register, login, and logout using JWT stored in cookies
- 🛒 **Shopping Cart** — Add products to cart and view a live price breakdown
- 📦 **Product Management (Admin)** — Owners can create and manage products with image uploads
- 🖼️ **Image Uploads** — Product images handled via Multer (in-memory buffer storage)
- 🎨 **Dynamic Theming** — Each product supports custom background/panel/text colors
- 💬 **Flash Messages** — User feedback for errors and success states

---

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js |
| Framework | Express 5 |
| Database | MongoDB + Mongoose |
| Templating | EJS |
| Auth | JWT (jsonwebtoken) + bcrypt |
| File Uploads | Multer (memory storage) |
| Sessions/Flash | express-session + connect-flash |
| Styling | Tailwind CSS |

---

## 📂 Project Structure

```
scatch/
├── app.js                      # Express app entry point
├── .env                        # Environment secrets (not committed)
├── config/
│   ├── development.json        # MongoDB URI config
│   ├── keys.js                 # JWT/session keys
│   ├── mongoose-connection.js  # DB connection setup
│   └── multer-config.js        # Multer upload config
├── controllers/
│   └── authController.js       # Register/login/logout logic
├── middlewares/
│   └── isLoggedIn.js           # JWT verification middleware
├── models/
│   ├── user-model.js           # User schema
│   └── product-model.js        # Product schema
├── routes/
│   ├── index.js                # Home, shop, cart routes
│   ├── usersRouter.js          # /users/* routes
│   ├── ownersRouter.js         # /owners/* admin routes
│   └── productsRouter.js       # /products/* routes
├── util/
│   └── generateToken.js        # JWT generation utility
├── views/
│   ├── index.ejs
│   ├── shop.ejs
│   ├── cart.ejs
│   ├── admin.ejs
│   ├── createproducts.ejs
│   ├── owner-login.ejs
│   └── partials/
│       ├── header.ejs
│       └── footer.ejs
└── public/
    └── images/
```

---

## ⚙️ Setup & Installation

### Prerequisites
- Node.js (v18+ recommended)
- MongoDB running locally on `127.0.0.1:27017`, or a MongoDB Atlas URI

### 1. Clone & Install
```bash
git clone <repo-url>
cd scatch
npm install
```

### 2. Environment Variables
Create a `.env` file in the project root:
```env
JWT_KEY=your_jwt_secret_here
EXPRESS_SESSION_SECRET=your_session_secret_here
MONGODB_URI=mongodb://127.0.0.1:27017/scatch
```

### 3. Run the App
```bash
npm start
# or
node app.js
```

### 4. Access
| Page | URL |
|---|---|
| Homepage (login/register) | `http://localhost:3000/` |
| Shop | `http://localhost:3000/shop` |
| Cart | `http://localhost:3000/cart` |
| Owner Login | `http://localhost:3000/owners/login` |
| Admin Dashboard | `http://localhost:3000/owners/admin` |

---

## 🔑 Data Models

**User**
```js
{
  fullname: String,
  email: String,
  password: String,     // bcrypt hashed
  cart: [ObjectId],      // refs → Product
  order: [Array],
  contact: Number,
  role: String            // 'customer' | 'admin'
}
```

**Product**
```js
{
  image: Buffer,
  name: String,
  price: Number,
  discount: { type: Number, default: 0 },
  bgcolor: String,
  panelcolor: String,
  textcolor: String
}
```

---

## 🛡️ Access Control

| Route | Access |
|---|---|
| `GET /` | Public |
| `GET /shop` | Logged-in users |
| `GET /addtocart/:id` | Logged-in users |
| `GET /cart` | Logged-in users |
| `POST /owners/products/create` | Owner/Admin only |
| `GET /owners/admin` | Owner/Admin only |
| `POST /users/register`, `/login` | Public |

---



## 📄 License

This project is for educational/personal use. Add a license of your choice (MIT recommended) if distributing publicly.
