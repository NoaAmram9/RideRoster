# 🚗 Family Car Manager

A comprehensive web application for managing a shared family/household car with real-time updates, reservations, and fuel tracking.

## 📋 Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [API Documentation](#api-documentation)
- [Real-Time Updates](#real-time-updates)
- [Database Schema](#database-schema)
- [Project Structure](#project-structure)
- [Development](#development)
- [Testing](#testing)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)

## ✨ Features

### Core Features
- **User Authentication**: Secure login/registration with JWT tokens
- **Reservation System**: Create, view, and manage car reservations
- **Real-Time Updates**: WebSocket-based live updates for all users
- **Fuel Tracking**: Log fuel usage and track individual balances
- **Rules Engine**: Admin-defined rules for reservations
- **Role-Based Access**: Admin and regular user roles
- **Mobile-First Design**: Fully responsive UI optimized for mobile

### User Features
- View all reservations in a timeline/list
- Create new reservations with date and time selection
- Cancel own reservations
- Log fuel usage after trips
- View personal fuel balance and history
- Real-time notifications for reservation changes

### Admin Features
- Approve/reject pending reservations
- Override overlapping reservations
- Define and manage group rules
- View all users and their fuel balances

## 🏗️ Architecture

```
┌─────────────────────────────────────────┐
│         Frontend (React)                 │
│  - Mobile-first UI                       │
│  - State management with Context         │
│  - Real-time WebSocket connection        │
└──────────────┬──────────────────────────┘
               │ HTTP/WS
┌──────────────▼──────────────────────────┐
│         Backend (FastAPI)                │
│  - REST API endpoints                    │
│  - WebSocket handler                     │
│  - Business logic services               │
│  - JWT authentication                    │
└──────────────┬──────────────────────────┘
               │ SQL
┌──────────────▼──────────────────────────┐
│         Database (MySQL)                 │
│  - Users & cgroups                        │
│  - Reservations                          │
│  - Fuel Logs                             │
│  - Rules                                 │
└─────────────────────────────────────────┘
```

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI framework
- **React Router** - Client-side routing
- **Axios** - HTTP client
- **Tailwind CSS** - Utility-first CSS
- **date-fns** - Date manipulation
- **react-hot-toast** - Toast notifications
- **Vite** - Build tool

### Backend
- **Python 3.10+** - Programming language
- **FastAPI** - Web framework
- **SQLAlchemy** - ORM
- **MySQL Connector** - Database driver
- **python-jose** - JWT handling
- **passlib** - Password hashing
- **uvicorn** - ASGI server

### Database
- **MySQL 8.0+** - Relational database

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Python 3.10 or higher**
- **Node.js 18 or higher**
- **npm or yarn**
- **MySQL 8.0 or higher**
- **Git**

## 💻 Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd family-car-app
```

### 2. Database Setup

```bash
# Login to MySQL
mysql -u root -p

# Run the schema script
mysql -u root -p < backend/schema.sql

# Or manually:
# CREATE DATABASE family_car_db;
# USE family_car_db;
# (Then copy and paste the schema.sql contents)
```

### 3. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env

# Edit .env with your database credentials
nano .env  # or use your favorite editor
```

### 4. Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# The proxy configuration in vite.config.js handles API routing
```

## ⚙️ Configuration

### Backend Configuration (.env)

Edit `backend/.env`:

```env
# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=family_car_db

# Security (IMPORTANT: Change in production!)
SECRET_KEY=your-secret-key-min-32-characters-long-change-this
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080

# Application
DEBUG=True

# CORS
CORS_ORIGINS=["http://localhost:3000","http://localhost:5173"]
```

### Frontend Configuration

The frontend automatically proxies API requests to `localhost:8000`. No additional configuration needed for development.

## 🚀 Running the Application

### Start Backend Server

```bash
# In backend directory
cd backend
source venv/bin/activate  # On Windows: venv\Scripts\activate
python run.py
```

Backend will be available at: `http://localhost:8000`
API docs: `http://localhost:8000/docs`

### Start Frontend Development Server

```bash
# In frontend directory (new terminal)
cd frontend
npm run dev
```

Frontend will be available at: `http://localhost:3000`

### Default Login Credentials

```
Username: admin
Password: admin123
```

## 📚 API Documentation

Once the backend is running, visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### Main Endpoints

#### Authentication
- `POST /auth/login` - Login user
- `POST /auth/register` - Register new user
- `POST /auth/verify` - Verify token

#### Reservations
- `GET /reservations` - Get reservations (with filters)
- `POST /reservations` - Create reservation
- `PUT /reservations/{id}` - Update reservation
- `DELETE /reservations/{id}` - Cancel reservation

#### Fuel Logs
- `GET /fuel-logs` - Get fuel logs
- `POST /fuel-logs` - Create fuel log
- `GET /fuel-logs/my-summary` - Get user summary

#### Rules (Admin Only)
- `GET /rules` - Get all rules
- `POST /rules` - Create rule
- `PUT /rules/{id}` - Update rule
- `DELETE /rules/{id}` - Delete rule

#### Users
- `GET /users/me` - Get current user
- `GET /users` - Get group users

## 🔄 Real-Time Updates

The application uses WebSockets for real-time synchronization:

### WebSocket Connection

```javascript
// Connect with JWT token
ws://localhost:8000/ws?token=<your-jwt-token>
```

### Events

**Received from server:**
- `connected` - Connection established
- `reservation_created` - New reservation created
- `reservation_updated` - Reservation updated
- `reservation_deleted` - Reservation cancelled
- `fuel_log_created` - New fuel log created

All connected users in the same group receive updates in real-time.

## 🗄️ Database Schema

See `docs/DATABASE_SCHEMA.md` for detailed schema documentation.

### Main Tables
- `cgroups` - Family/household cgroups
- `users` - User accounts
- `reservations` - Car reservations
- `fuel_logs` - Fuel usage logs
- `rules` - Group rules

## 📁 Project Structure

```
family-car-app/
├── backend/
│   ├── app/
│   │   ├── api/           # API endpoints
│   │   ├── core/          # Core config & security
│   │   ├── database/      # Database connection
│   │   ├── models/        # SQLAlchemy models
│   │   ├── schemas/       # Pydantic schemas
│   │   └── services/      # Business logic
│   ├── schema.sql         # Database schema
│   ├── requirements.txt   # Python dependencies
│   ├── run.py            # Application entry point
│   └── .env              # Configuration
├── frontend/
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── context/       # Context providers
│   │   ├── pages/         # Page components
│   │   ├── services/      # API & WebSocket services
│   │   ├── App.jsx        # Main app component
│   │   └── main.jsx       # Entry point
│   ├── index.html         # HTML template
│   ├── package.json       # Node dependencies
│   └── vite.config.js     # Vite configuration
└── docs/
    └── DATABASE_SCHEMA.md # Database documentation
```

## 🔧 Development

### Backend Development

```bash
# Run with auto-reload
cd backend
python run.py

# Run tests (if you add them)
pytest

# Format code
black app/
```

### Frontend Development

```bash
# Run dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Database Migrations

For schema changes, update `schema.sql` and re-run:
```bash
mysql -u root -p family_car_db < backend/schema.sql
```

## 🧪 Testing

### Backend Testing
```bash
cd backend
pytest
```

### Frontend Testing
```bash
cd frontend
npm test
```

## 🚢 Deployment

### Backend Deployment

1. Set production environment variables
2. Use a production WSGI server (e.g., Gunicorn)
3. Set up SSL/TLS
4. Use a production database
5. Disable DEBUG mode

```bash
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker
```

### Frontend Deployment

```bash
cd frontend
npm run build
# Deploy the 'dist' folder to your hosting service
```

### Recommended Hosting
- **Frontend**: Vercel, Netlify, AWS S3 + CloudFront
- **Backend**: AWS EC2, DigitalOcean, Heroku, Railway
- **Database**: AWS RDS, DigitalOcean Managed Database

## 🐛 Troubleshooting

### Database Connection Issues
- Verify MySQL is running: `sudo service mysql status`
- Check credentials in `.env`
- Ensure database exists: `SHOW DATABASES;`

### WebSocket Connection Failed
- Check if backend is running on port 8000
- Verify CORS settings in `.env`
- Check browser console for errors

### Frontend Not Loading
- Clear browser cache
- Check console for errors
- Verify API proxy configuration
- Ensure backend is running

### Port Already in Use
```bash
# Kill process on port 8000
# On macOS/Linux:
lsof -ti:8000 | xargs kill -9

# On Windows:
netstat -ano | findstr :8000
taskkill /PID <PID> /F
```

## 📄 License

This project is licensed under the MIT License.

## 👥 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📞 Support

For issues and questions:
- Create an issue in the repository
- Check existing documentation
- Review API docs at `/docs`

---

**Built with ❤️ for families managing shared cars**
