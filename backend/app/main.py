from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
import app.models  # register all models
from app.routers import auth, problems, submissions, quizzes

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="MindX-CodeLab API",
    description="Backend API for MindX-CodeLab - Python Online Coding & Assessment Platform",
    version="1.0.0"
)

# CORS setup for Vite frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api")
app.include_router(problems.router, prefix="/api")
app.include_router(submissions.router, prefix="/api")
app.include_router(quizzes.router, prefix="/api")

@app.get("/api/health")
def health_check():
    return {"status": "ok", "service": "MindX-CodeLab Backend"}

