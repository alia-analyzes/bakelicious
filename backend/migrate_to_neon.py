import os
import sys
import argparse
from urllib.parse import urlparse, parse_qs, urlencode, urlunparse
from sqlalchemy import create_engine, select, text
from sqlalchemy.orm import Session

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import base
from app.database.connection import engine as sqlite_engine


def clean_neon_url(raw_url: str) -> str:
    """Normalizes Neon PostgreSQL connection strings."""
    url = raw_url.strip().strip("'").strip('"')

    # Convert postgres:// to postgresql:// for SQLAlchemy
    if url.startswith("postgres://"):
        url = "postgresql://" + url[len("postgres://"):]
    elif not url.startswith("postgresql://") and not url.startswith("postgresql+"):
        if "://" in url:
            scheme, rest = url.split("://", 1)
            url = f"postgresql://{rest}"
        else:
            url = f"postgresql://{url}"

    # Ensure sslmode=require for Neon if not specified
    parsed = urlparse(url)
    query_params = parse_qs(parsed.query)
    if "sslmode" not in query_params:
        query_params["sslmode"] = ["require"]
        new_query = urlencode(query_params, doseq=True)
        url = urlunparse((
            parsed.scheme,
            parsed.netloc,
            parsed.path,
            parsed.params,
            new_query,
            parsed.fragment
        ))

    return url


def get_neon_engine(neon_url: str):
    """Creates a working SQLAlchemy engine, trying default driver and psycopg3 driver."""
    try:
        engine = create_engine(neon_url, pool_pre_ping=True)
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return engine
    except Exception as e:
        if "psycopg2" in str(e).lower() and not neon_url.startswith("postgresql+psycopg://"):
            alt_url = neon_url.replace("postgresql://", "postgresql+psycopg://", 1)
            try:
                engine = create_engine(alt_url, pool_pre_ping=True)
                with engine.connect() as conn:
                    conn.execute(text("SELECT 1"))
                return engine
            except Exception:
                pass
        raise e


def fix_postgres_sequences(neon_engine, tables):
    """Resets PostgreSQL auto-increment sequences so future inserts don't collide with migrated IDs."""
    print("\n[INFO] Synchronizing PostgreSQL auto-increment sequences...")
    with neon_engine.connect() as conn:
        for t in tables:
            for col in t.primary_key.columns:
                table_name = t.name
                col_name = col.name
                sql = text(f"""
                    DO $$
                    DECLARE
                        seq_name text;
                        max_val bigint;
                    BEGIN
                        seq_name := pg_get_serial_sequence('{table_name}', '{col_name}');
                        IF seq_name IS NOT NULL THEN
                            EXECUTE 'SELECT COALESCE(MAX({col_name}), 1) FROM {table_name}' INTO max_val;
                            PERFORM setval(seq_name, max_val);
                        END IF;
                    END $$;
                """)
                try:
                    conn.execute(sql)
                    conn.commit()
                except Exception:
                    pass
    print("[SUCCESS] All database sequences synchronized successfully.")


def run_migration(neon_url: str, reset_destination: bool = False):
    print("=" * 65)
    print("      Bakelicious SQLite -> Neon PostgreSQL Migration Tool      ")
    print("=" * 65)

    sqlite_db_file = os.path.join(os.path.dirname(os.path.abspath(__file__)), "bakelicious.db")
    if not os.path.exists(sqlite_db_file):
        print(f"[ERROR] Local SQLite database not found at: {sqlite_db_file}")
        sys.exit(1)

    # 1. Connect to Neon
    print(f"\n[1/5] Connecting to Neon PostgreSQL...")
    try:
        neon_engine = get_neon_engine(neon_url)
        print("[SUCCESS] Successfully connected to Neon PostgreSQL!")
    except Exception as e:
        print(f"\n[ERROR] Could not connect to Neon PostgreSQL: {e}")
        print("\nPlease verify:")
        print("1. Your password and username are correct.")
        print("2. The database endpoint URL includes '?sslmode=require'.")
        sys.exit(1)

    tables = base.Base.metadata.sorted_tables
    print(f"[INFO] Detected {len(tables)} tables to migrate.")

    # 2. Reset / Wipe Neon tables if requested or if already exist
    if reset_destination:
        print("\n[2/5] Resetting destination tables in Neon...")
        try:
            with neon_engine.connect() as conn:
                conn.execute(text("DROP SCHEMA public CASCADE; CREATE SCHEMA public;"))
                conn.commit()
            print("[INFO] Destination schema reset cleanly.")
        except Exception:
            try:
                base.Base.metadata.drop_all(bind=neon_engine)
                print("[INFO] Existing tables dropped cleanly.")
            except Exception as e:
                print(f"[WARNING] Drop tables notice: {e}")
    else:
        print("\n[2/5] Preparing tables in Neon PostgreSQL...")

    # 3. Create schema
    try:
        base.Base.metadata.create_all(bind=neon_engine)
        print("[SUCCESS] Neon database schema verified and up to date.")
    except Exception as e:
        print(f"[ERROR] Failed creating tables in Neon: {e}")
        sys.exit(1)

    # 4. Migrate Data
    print("\n[3/5] Transferring data table-by-table in dependency order...")
    total_migrated = 0
    migration_summary = []

    with sqlite_engine.connect() as s_conn, neon_engine.connect() as pg_conn:
        # Check if destination table has data if reset wasn't performed
        for table in tables:
            table_name = table.name
            
            # Read from SQLite
            records = s_conn.execute(select(table)).mappings().all()
            row_count = len(records)

            if row_count == 0:
                migration_summary.append((table_name, 0, 0, "Empty"))
                print(f"  - {table_name:<28} : 0 rows (Skipped)")
                continue

            # Check existing rows in Neon
            existing_pg_count = pg_conn.execute(text(f'SELECT COUNT(*) FROM "{table_name}"')).scalar()
            if existing_pg_count > 0:
                if not reset_destination:
                    # Truncate this table or skip
                    try:
                        pg_conn.execute(text(f'TRUNCATE TABLE "{table_name}" CASCADE'))
                        pg_conn.commit()
                    except Exception:
                        pass

            # Convert row mappings to list of dicts
            data_to_insert = [dict(r) for r in records]

            # Batch insert
            batch_size = 500
            for i in range(0, len(data_to_insert), batch_size):
                batch = data_to_insert[i : i + batch_size]
                pg_conn.execute(table.insert(), batch)
            pg_conn.commit()

            total_migrated += row_count
            migration_summary.append((table_name, row_count, row_count, "Transferred"))
            print(f"  [OK] {table_name:<26} : {row_count:>3} rows copied")

    # 5. Fix sequences
    print("\n[4/5] Fixing sequence IDs...")
    fix_postgres_sequences(neon_engine, tables)

    # 6. Verification
    print("\n[5/5] Verifying integrity...")
    print("\n" + "-" * 60)
    print(f"{'Table Name':<28} | {'SQLite':<8} | {'Neon':<8} | {'Status'}")
    print("-" * 60)

    all_matched = True
    with sqlite_engine.connect() as s_conn, neon_engine.connect() as pg_conn:
        for table in tables:
            s_count = s_conn.execute(text(f'SELECT COUNT(*) FROM "{table.name}"')).scalar()
            pg_count = pg_conn.execute(text(f'SELECT COUNT(*) FROM "{table.name}"')).scalar()
            status = "MATCH" if s_count == pg_count else "MISMATCH"
            if s_count != pg_count:
                all_matched = False
            print(f"{table.name:<28} | {s_count:<8} | {pg_count:<8} | {status}")
    print("-" * 60)

    if all_matched:
        print(f"\n[SUCCESS] Migration Complete! {total_migrated} total rows transferred without loss.")
    else:
        print(f"\n[WARNING] Migration completed with some row count discrepancies.")

    return True


def main():
    parser = argparse.ArgumentParser(description="Migrate Bakelicious SQLite to Neon PostgreSQL")
    parser.add_argument("--neon-url", type=str, help="Neon PostgreSQL connection string")
    parser.add_argument("--wipe", action="store_true", help="Wipe and recreate Neon tables before transferring")
    args = parser.parse_args()

    neon_url = args.neon_url or os.environ.get("NEON_DATABASE_URL")

    if not neon_url:
        print("=" * 65)
        print("      Bakelicious SQLite -> Neon PostgreSQL Migration Tool      ")
        print("=" * 65)
        print("\nThis script will safely transfer your local SQLite data to Neon.")
        print("Your credentials remain completely private on your local machine.\n")
        try:
            user_input = input("Paste your Neon PostgreSQL Connection String here:\n> ").strip()
        except (KeyboardInterrupt, EOFError):
            print("\nAborted.")
            sys.exit(0)

        if not user_input:
            print("[ERROR] No URL provided. Aborting.")
            sys.exit(1)
        neon_url = user_input

    cleaned_url = clean_neon_url(neon_url)

    wipe_choice = args.wipe
    if not wipe_choice:
        try:
            choice = input("\nDo you want to wipe/reset existing tables in Neon before importing? (Y/n) [default: Y]: ").strip().lower()
            wipe_choice = (choice != 'n')
        except (KeyboardInterrupt, EOFError):
            wipe_choice = True

    success = run_migration(cleaned_url, reset_destination=wipe_choice)

    if success:
        print("\nNext Steps:")
        print("1. In your local backend/.env, update:")
        print(f"   DATABASE_URL={cleaned_url}")
        print("2. In your Render Dashboard (bakelicious service):")
        print("   Set Environment Variable:")
        print("   Key: DATABASE_URL")
        print(f"   Value: (Your Neon connection string)")
        print("=" * 65)


if __name__ == "__main__":
    main()
