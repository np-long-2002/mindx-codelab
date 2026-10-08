from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from app.core.config import settings

engine = create_engine(
    settings.DATABASE_URL,
    connect_args={"check_same_thread": False} if settings.DATABASE_URL.startswith("sqlite") else {}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def run_migrations():
    from sqlalchemy import inspect, text
    inspector = inspect(engine)
    table_names = inspector.get_table_names()

    if "quizzes" in table_names:
        quiz_cols = [c["name"] for c in inspector.get_columns("quizzes")]
        with engine.connect() as conn:
            if "is_assigned" not in quiz_cols:
                try:
                    conn.execute(text("ALTER TABLE quizzes ADD COLUMN is_assigned BOOLEAN DEFAULT 1"))
                    conn.commit()
                except Exception as e:
                    print(f"Migration quizzes.is_assigned: {e}")

    if "quiz_questions" in table_names:
        columns = [c["name"] for c in inspector.get_columns("quiz_questions")]
        with engine.connect() as conn:
            if "test_cases" not in columns:
                try:
                    conn.execute(text("ALTER TABLE quiz_questions ADD COLUMN test_cases JSON DEFAULT '[]'"))
                    conn.commit()
                except Exception as e:
                    print(f"Migration test_cases: {e}")
            if "question_type" not in columns:
                try:
                    conn.execute(text("ALTER TABLE quiz_questions ADD COLUMN question_type VARCHAR DEFAULT 'THEORY'"))
                    conn.commit()
                except Exception as e:
                    print(f"Migration question_type: {e}")



