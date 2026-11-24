#!/usr/bin/env python3
import os
import sys
import json
import logging
import uuid
from datetime import datetime
import psycopg2
from psycopg2 import sql, extras
from dotenv import load_dotenv

# Cargar variables de entorno (.env)
load_dotenv()

# Configuración de logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Obtener la URL de la base de datos desde el .env
DATABASE_URL = os.getenv('DATABASE_URL')

JSON_FILE = 'airline.json'
TABLE_NAME = 'airlines'

def get_db_connection():
    """Establece y retorna una conexión a PostgreSQL usando el .env"""
    if not DATABASE_URL:
        logger.error("No se encontró DATABASE_URL en el archivo .env")
        sys.exit(1)
    try:
        # psycopg2 acepta directamente la URL de conexión
        conn = psycopg2.connect(DATABASE_URL)
        return conn
    except psycopg2.Error as e:
        logger.error(f"Error conectando a la base de datos: {e}")
        sys.exit(1)

def ensure_table_exists(conn) -> None:
    """Verifica que la tabla exista."""
    create_table_sql = sql.SQL("""
        CREATE TABLE IF NOT EXISTS {} (
            id TEXT PRIMARY KEY,
            iata TEXT NOT NULL UNIQUE,
            icao TEXT NOT NULL UNIQUE,
            official_name TEXT NOT NULL,
            display_name TEXT NOT NULL,
            logo_url TEXT,
            active BOOLEAN NOT NULL DEFAULT true,
            created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP(3) NOT NULL
        )
    """).format(sql.Identifier(TABLE_NAME))

    try:
        with conn.cursor() as cur:
            cur.execute(create_table_sql)
            conn.commit()
            logger.info(f"Tabla '{TABLE_NAME}' verificada/creada exitosamente.")
    except psycopg2.Error as e:
        logger.error(f"Error creando la tabla: {e}")
        conn.rollback()
        sys.exit(1)

def load_airlines_from_json(file_path: str):
    """Lee el archivo JSON y prepara los datos."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        required_fields = {'iata', 'officialName', 'icao', 'logoUrl'}
        airlines = []
        now = datetime.now()

        for idx, item in enumerate(data):
            missing = required_fields - set(item.keys())
            if missing:
                logger.warning(f"Registro {idx} omitido por falta de campos: {missing}")
                continue

            iata = item['iata'].strip().upper()
            icao = item['icao'].strip().upper()
            official_name = item['officialName'].strip()
            display_name = official_name
            logo_url = item['logoUrl'].strip()

            # Prisma usa cuid(), pero en Python es más fácil usar UUID para el seed
            # El schema de Prisma dice que id es String @id @default(cuid())
            # Como estamos insertando directo en SQL, generamos un UUID válido.
            airlines.append({
                'id': str(uuid.uuid4()), 
                'iata': iata,
                'icao': icao,
                'official_name': official_name,
                'display_name': display_name,
                'logo_url': logo_url,
                'active': True,
                'updated_at': now
            })

        logger.info(f"Se prepararon {len(airlines)} aerolíneas desde el JSON.")
        return airlines
    except Exception as e:
        logger.error(f"Error leyendo el JSON: {e}")
        sys.exit(1)

def upsert_airlines(conn, airlines):
    """Inserta o actualiza las aerolíneas en la base de datos."""
    upsert_sql = sql.SQL("""
        INSERT INTO {} (id, iata, icao, official_name, display_name, logo_url, active, updated_at)
        VALUES (%(id)s, %(iata)s, %(icao)s, %(official_name)s, %(display_name)s, %(logo_url)s, %(active)s, %(updated_at)s)
        ON CONFLICT (iata) DO UPDATE SET
            icao = EXCLUDED.icao,
            official_name = EXCLUDED.official_name,
            display_name = EXCLUDED.display_name,
            logo_url = EXCLUDED.logo_url,
            active = EXCLUDED.active,
            updated_at = EXCLUDED.updated_at
    """).format(sql.Identifier(TABLE_NAME))

    try:
        with conn.cursor() as cur:
            extras.execute_batch(cur, upsert_sql, airlines, page_size=100)
            conn.commit()
            logger.info(f"Se insertaron/actualizaron {len(airlines)} aerolíneas exitosamente.")
    except psycopg2.Error as e:
        logger.error(f"Error al insertar/actualizar datos: {e}")
        conn.rollback()
        sys.exit(1)

def main():
    logger.info("Iniciando carga de aerolíneas a la BD local...")
    conn = get_db_connection()
    ensure_table_exists(conn)
    airlines = load_airlines_from_json(JSON_FILE)
    if airlines:
        upsert_airlines(conn, airlines)
    else:
        logger.warning("No hay datos para insertar.")
    conn.close()
    logger.info("Proceso finalizado.")

if __name__ == "__main__":
    main()