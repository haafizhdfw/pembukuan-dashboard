// ================================================
// CAFEBOOK — Supabase Config
// ================================================

const SUPABASE_URL = 'https://pklqkdvcijlyqejzfrxd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBrbHFrZHZjaWpseXFlanpmcnhkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkwMTQwMzgsImV4cCI6MjA5NDU5MDAzOH0.ET-Hn-hj9CrC-jgmJTrKWZAvGc9uZJjyn_tD6vDs9L0';

const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Helper: ambil cafe_id pertama (untuk sekarang single-cafe dulu)
async function getCafeId() {
  const { data } = await db.from('cafe').select('id').limit(1).single();
  return data?.id;
}
