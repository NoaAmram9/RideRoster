# Quick Start Guide

Get the Family Car Manager running in 5 minutes!

## Prerequisites Check

```bash
# Check Python version (needs 3.10+)
python --version

# Check Node.js version (needs 18+)
node --version

# Check MySQL (needs 8.0+)
mysql --version
```

## Step 1: Database Setup (2 minutes)

```bash
# Login to MySQL
mysql -u root -p

# Create database and run schema
CREATE DATABASE family_car_db;
USE family_car_db;
SOURCE backend/schema.sql;  # Or copy-paste schema.sql contents

# Exit MySQL
exit;
```

## Step 2: Backend Setup (1 minute)

```bash
# Navigate to backend
cd backend

# Create virtual environment
python -m venv venv

# Activate it
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env

# Edit .env with your MySQL password
# You can use: nano .env  or  code .env
```

**Edit these lines in .env:**
```env
DB_PASSWORD=your_mysql_password_here
SECRET_KEY=change-this-to-something-random-and-long
```

## Step 3: Frontend Setup (1 minute)

```bash
# Open new terminal, navigate to frontend
cd frontend

# Install dependencies
npm install
```

## Step 4: Run Everything (1 minute)

### Terminal 1: Backend
```bash
cd backend
source venv/bin/activate  # On Windows: venv\Scripts\activate
python run.py
```

You should see:
```
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Application startup complete.
```

### Terminal 2: Frontend
```bash
cd frontend
npm run dev
```

You should see:
```
  VITE v5.0.11  ready in 500 ms

  ➜  Local:   http://localhost:3000/
```

## Step 5: Login

Open http://localhost:3000 in your browser.

**Default credentials:**
- Username: `admin`
- Password: `admin123`

## Verify Everything Works

1. ✅ You see the login page
2. ✅ You can login with admin/admin123
3. ✅ Dashboard loads with no reservations
4. ✅ Click "New Reservation" and create one
5. ✅ You see the reservation appear immediately

## What's Next?

### Create Additional Users
1. Logout
2. Click "Register here"
3. Create a new user (uncheck "I am the car owner")
4. Login with new user
5. See the reservation created by admin!

### Test Real-Time Updates
1. Open two browser windows side-by-side
2. Login as different users in each
3. Create a reservation in one window
4. See it appear instantly in the other! 🎉

### Explore Features
- **Dashboard**: View and manage reservations
- **Fuel Logs**: Track fuel usage
- **Rules** (Admin only): Set group rules

## Common Issues

### "Connection refused" error
→ Backend not running. Start with `python run.py`

### "Cannot connect to database"
→ Check MySQL is running: `sudo service mysql start`
→ Verify password in `.env` file

### "Port already in use"
→ Kill the process:
```bash
# On macOS/Linux
lsof -ti:8000 | xargs kill -9

# On Windows
netstat -ano | findstr :8000
taskkill /PID <PID> /F
```

### Frontend shows blank page
→ Check browser console for errors
→ Verify backend is running on port 8000
→ Try clearing cache: Ctrl+Shift+R

## API Documentation

Once backend is running, visit:
- http://localhost:8000/docs (Swagger UI)
- http://localhost:8000/redoc (ReDoc)

## Architecture Overview

```
Frontend (React)          Backend (FastAPI)         Database (MySQL)
     :3000        ←→           :8000          ←→      family_car_db
                   HTTP/WS                    SQL
```

## Project Structure

```
family-car-app/
├── backend/           # Python FastAPI server
│   ├── app/          # Application code
│   └── run.py        # Entry point
├── frontend/         # React application
│   ├── src/          # Source code
│   └── index.html    # HTML template
└── docs/             # Documentation
```

## Development Tips

### Hot Reload
Both frontend and backend automatically reload on code changes!

### View Logs
- **Backend**: Terminal running `python run.py`
- **Frontend**: Browser console (F12)

### Database GUI
Use MySQL Workbench or phpMyAdmin to view data visually

## Next Steps

- Read the full [README.md](../README.md)
- Check [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md)
- Explore [REALTIME_EVENTS.md](REALTIME_EVENTS.md)
- Customize the app for your needs!

---

**Need help?** Check the Troubleshooting section in README.md

**Ready to deploy?** See the Deployment section in README.md
