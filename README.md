# Moodaaz – E-Commerce Backend

**Moodaaz** is a scalable and modular **e-commerce backend API** built with **Node.js, Express.js, and MongoDB**.
The project follows a **clean and maintainable architecture** designed for modern, production-ready backend systems.

---

## Tech Stack

* **Node.js**
* **Express.js**
* **MongoDB (Mongoose)**
* **JWT Authentication**
* **express-validator**

---

## Key Features

* Modular and scalable backend architecture
* Unified authentication using **email or mobile (OTP based)**
* JWT based authorization
* Clean service–repository structure
* Centralized error handling
* Request validation and reusable utilities

---

## Getting Started

### Install Dependencies

```bash
git clone <repository-url>
cd moodaaz
npm install
```

### Environment Variables

Create a `.env` file in the root directory:

```
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
```

### Run the Server

```bash
npm run dev
```

---

## Project Structure

```
src
 ├── modules
 ├── services
 ├── repositories
 ├── middlewares
 ├── utils
 └── config
```

---

