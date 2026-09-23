import os
import logging
from sqlalchemy import create_engine, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

logger = logging.getLogger("poweroptix.database")
logging.basicConfig(level=logging.INFO)

MYSQL_URL = os.getenv("MYSQL_URL", "mysql+pymysql://root:root@localhost:3306/poweroptix")
SQLITE_URL = os.getenv("SQLITE_URL", "sqlite:///./poweroptix.db")

engine = None
SessionLocal = None
DB_TYPE = "sqlite"
DB_NAME = "poweroptix"
DB_ERROR_REASON = None

def init_db_engine():
    global engine, SessionLocal, DB_TYPE, DB_NAME, DB_ERROR_REASON
    
    # Try MySQL first if configured or available
    try:
        mysql_engine = create_engine(MYSQL_URL, connect_args={"connect_timeout": 3})
        with mysql_engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        logger.info("==================================================")
        logger.info("Database Status: MySQL Connected (PRIMARY DATABASE)")
        logger.info(f"Host: localhost | Database: {DB_NAME}")
        logger.info("==================================================")
        engine = mysql_engine
        DB_TYPE = "mysql"
        DB_ERROR_REASON = None
    except Exception as e:
        DB_ERROR_REASON = str(e)
        logger.info("==================================================")
        logger.info("Database Status: SQLite FALLBACK (Development Mode)")
        logger.info(f"Reason: {e}")
        logger.info("==================================================")
        engine = create_engine(
            SQLITE_URL, 
            connect_args={"check_same_thread": False} if "sqlite" in SQLITE_URL else {}
        )
        DB_TYPE = "sqlite"

    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

init_db_engine()

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
