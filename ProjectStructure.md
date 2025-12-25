family-car-app/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py
│   │   ├── api/
│   │   │   ├── __init__.py
│   │   │   ├── auth.py
│   │   │   ├── reservations.py
│   │   │   ├── fuel_logs.py
│   │   │   ├── rules.py
│   │   │   ├── users.py
│   │   │   └── websocket.py
│   │   ├── core/
│   │   │   ├── __init__.py
│   │   │   ├── config.py
│   │   │   └── security.py
│   │   ├── database/
│   │   │   ├── __init__.py
│   │   │   └── connection.py
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   └── models.py
│   │   ├── schemas/
│   │   │   ├── __init__.py
│   │   │   └── schemas.py
│   │   └── services/
│   │       ├── __init__.py
│   │       ├── auth_service.py
│   │       ├── reservation_service.py
│   │       ├── fuel_service.py
│   │       └── websocket_manager.py
│   ├── requirements.txt
│   ├── .env.example
│   ├── run.py
│   └── schema.sql
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navigation.jsx
│   │   │   ├── ReservationList.jsx
│   │   │   ├── CreateReservation.jsx
│   │   │   └── CreateFuelLog.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   └── FuelLogs.jsx
│   │   ├── services/
│   │   │   ├── api.js
│   │   │   └── websocket.js
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── postcss.config.js
├── docs/
│   ├── DATABASE_SCHEMA.md
│   ├── REALTIME_EVENTS.md
│   ├── QUICKSTART.md
│   └── PROJECT_SUMMARY.md
├── README.md
└── .gitignore
