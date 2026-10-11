import bcrypt

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Safely verifies a plain text password against a bcrypt hash.
    Handles string/byte encoding and 72-byte max length bounds cleanly.
    """
    if not plain_password or not hashed_password:
        return False
    try:
        pw_bytes = plain_password.encode('utf-8')[:72]
        hash_bytes = hashed_password.encode('utf-8')
        return bcrypt.checkpw(pw_bytes, hash_bytes)
    except Exception:
        return False

def get_password_hash(password: str) -> str:
    """
    Generates a secure bcrypt password hash.
    """
    pw_bytes = password.encode('utf-8')[:72]
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(pw_bytes, salt).decode('utf-8')
