from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "data"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = f"sqlite:///{(DATA_DIR / 'pipeline.db').as_posix()}"
    token_secret: str = "mkulima-ingestion-dev-secret"
    public_base_url: str = "http://127.0.0.1:8088"
    min_supported_version: str = "0.1.0"
    consent_version: str = "mkulimascore-v1"
    seed_agent_email: str = "francis.o@mkulima"
    seed_agent_password: str = "dev-password"
    seed_agent_name: str = "Francis O."
    seed_institution_id: int = 1
    seed_institution_name: str = "Kiambu SACCO Network"
    platform_api_url: str = ""
    platform_api_token: str = ""
    platform_api_username: str = ""
    platform_api_password: str = ""
    platform_client_id: str = ""
    platform_client_secret: str = ""
    max_evidence_bytes: int = 15 * 1024 * 1024


settings = Settings()
DATA_DIR.mkdir(parents=True, exist_ok=True)
(DATA_DIR / "incoming").mkdir(parents=True, exist_ok=True)
