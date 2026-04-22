# DSA Progress Tracker

A full-stack tracker for managing DSA topics and problems with per-user data isolation.

## Tech Stack

- Backend: Django + Django REST Framework + SimpleJWT
- Frontend: React (Create React App) + Axios
- Database: SQLite (default)
- Containerization: Docker + Docker Compose

## Project Structure

- `backend/` - Django API server
- `frontend/` - React client
- `docker-compose.yml` - local multi-container setup

## Features

- User registration and JWT login
- Track DSA topics
- Track problems by topic
- Difficulty support (`easy`, `medium`, `hard`)
- Solved/unsolved status tracking
- Progress stats endpoint with difficulty and topic breakdown
- User data isolation (each user sees only their own records)

## API Overview

Base URL: `http://localhost:8000/api`

Auth:
- `POST /auth/register/` - create account
- `POST /auth/token/` - login and receive JWT tokens
- `POST /auth/token/refresh/` - refresh access token

Core:
- `GET/POST /topics/`
- `GET/PUT/PATCH/DELETE /topics/{id}/`
- `GET/POST /problems/`
- `GET/PUT/PATCH/DELETE /problems/{id}/`
- `GET /progress/stats/`

Problem list filters:
- `?topic=<topic_id>`
- `?difficulty=easy|medium|hard`
- `?is_solved=true|false`

## Environment Variables

Backend (`backend/.env` for non-docker run):

```env
SECRET_KEY=your-secret-key
DEBUG=True
ALLOWED_HOSTS=127.0.0.1,localhost
CORS_ALLOWED_ORIGINS=http://localhost:3000
JWT_ACCESS_TOKEN_MINUTES=60
JWT_REFRESH_TOKEN_DAYS=7
```

Frontend:
- `REACT_APP_API_BASE_URL` (defaults to deployed backend in `frontend/src/api.js`)

For local development, set:

```env
REACT_APP_API_BASE_URL=http://localhost:8000/api
```

## Run with Docker (Recommended)

From project root:

```bash
docker compose up --build
```

Services:
- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8000`

To stop:

```bash
docker compose down
```

## Run without Docker

### Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install django djangorestframework djangorestframework-simplejwt django-cors-headers python-dotenv gunicorn psycopg2-binary
python manage.py migrate
python manage.py runserver
```

Backend runs on `http://localhost:8000`.

### Frontend

```bash
cd frontend
npm install
npm start
```

Frontend runs on `http://localhost:3000`.

## Testing

Backend tests:

```bash
cd backend
python manage.py test
```

## Notes

- The current frontend `App` is the default CRA starter UI; backend API is fully usable.
- Docker frontend install uses a safe fallback (`npm ci || npm install`) to handle lockfile mismatch scenarios.
