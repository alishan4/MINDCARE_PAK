from supabase import create_client, Client
from app.core.config import SUPABASE_URL, SUPABASE_ANON_KEY

_supabase: Client = None

def get_supabase() -> Client:
    """
    Returns a singleton Supabase client using env vars.
    """
    global _supabase
    if _supabase is None:
        if SUPABASE_URL and SUPABASE_ANON_KEY:
            _supabase = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
        else:
            print("Supabase config missing.")
    return _supabase
