import os

class Settings:
    PROJECT_NAME: str = "MindX-CodeLab API"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "mindx-codelab-super-secret-key-2026")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    DATABASE_URL: str = "sqlite:///./mindx_codelab.db"

settings = Settings()

