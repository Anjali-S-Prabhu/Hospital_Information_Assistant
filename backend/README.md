# Hospital Information Assistant - Backend API

This directory contains the production-grade, Clean Architecture backend for the **Hospital Information Assistant** built with **FastAPI**, **SQLAlchemy**, and integrated with AI (LangChain + Groq), Vector Search (Qdrant), and Cloud Storage (AWS S3).

---

## 🛠️ Technology Stack

- **Framework**: Python 3.11, FastAPI
- **Database**: PostgreSQL (Neon Serverless) & SQLAlchemy ORM
- **Authentication**: JWT, OAuth2 Password Bearer flow, Passlib (bcrypt)
- **AI & Chatbot**: LangChain Core, ChatGroq LLM (Llama-3 8B)
- **RAG & Search**: FastEmbed (BAAI/bge-small-en-v1.5) & Qdrant Cloud Vector DB
- **File Uploads**: AWS S3 Storage (boto3)
- **Deployment**: Docker, Docker Compose

---

## 📁 Project Structure

```text
backend/
├── app/
│   ├── core/           # Configuration loaders and encryption/security helpers
│   ├── models/         # SQLAlchemy Database models (User, Patient, Appointment, UploadedFile)
│   ├── schemas/        # Pydantic V2 Request & Response schemas (Data validation)
│   ├── services/       # Core business logic layer (Auth, Patients, Appointments, AI Chat, RAG)
│   ├── routers/        # FastAPI endpoints/routers (Auth, Patients, Appointments, AI Chat, RAG, Uploads)
│   ├── utils/          # Auxiliary file size and extension validation helpers
│   ├── database.py     # Connection pool & database session initialization
│   ├── dependencies.py # FastAPI dependencies (JWT extractors, role checks)
│   └── main.py         # Application root setup, CORS, middleware, and entry point
├── Dockerfile          # Multi-stage production container build instructions
├── .dockerignore       # Docker image build file excludes
├── requirements.txt    # Python package dependencies
└── .env.example        # Environment variable configuration template
```

---

## 🚀 Local Installation & Setup

### 1. Prerequisites
- Python 3.11 or higher installed.
- Access to a PostgreSQL instance (or Neon DB).
- AWS Account with an S3 Bucket and programmatic user credentials.
- Groq API Key (generate from [Groq Console](https://console.groq.com/)).
- Qdrant Cloud instance cluster URL and API key.

### 2. Setup Virtual Environment
Create and activate a virtual environment in the `backend/` folder:
```bash
# Windows Power Shell
python -m venv venv
venv\Scripts\Activate.ps1

# Linux / macOS
python3 -m venv venv
source venv/bin/activate
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

### 4. Configure Environment Variables
Copy `.env.example` to a new file named `.env`:
```bash
cp .env.example .env
```
Fill in the credentials in `.env` (e.g. database URL, secret key, AWS tokens, Groq keys, Qdrant cluster URLs).

### 5. Launch the Server
Start the Uvicorn development server:
```bash
uvicorn app.main:app --reload
```
The API is now running locally at: `http://127.0.0.1:8000`

---

## 📖 API Documentation & Testing

Once the server is running, you can explore, test, and run sample requests against every endpoint using the built-in Interactive Swagger UI:

- **Swagger Documentation**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **ReDoc Documentation**: [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)

---

## 🐳 Docker Deployment

To build the container image and run it locally:
```bash
docker build -t hospital-backend .
docker run -p 8000:8000 --env-file .env hospital-backend
```
To run the full stack (frontend, backend, DB integrations), use Docker Compose at the project root level.
