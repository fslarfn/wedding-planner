import { createClient } from "@supabase/supabase-js"

// Daftar lengkap kenangan untuk dashboard, termasuk yang disembunyikan.
//
// Anon key hanya boleh membaca kenangan yang tampil (lihat policy di
// supabase/photobooth.sql), jadi daftar penuh harus lewat service role di server.

export async function GET(request: Request) {
    const expected = process.env.PHOTOBOOTH_ADMIN_KEY
    if (!expected || request.headers.get("x-photobooth-key") !== expected) {
        return Response.json({ error: "Kunci admin tidak cocok." }, { status: 401 })
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !serviceKey) {
        return Response.json({ error: "SUPABASE_SERVICE_ROLE_KEY belum diatur." }, { status: 500 })
    }

    const supabase = createClient(url, serviceKey, { auth: { persistSession: false } })
    const { data, error } = await supabase
        .from("photobooth_photos")
        .select("*")
        .order("created_at", { ascending: false })

    if (error) return Response.json({ error: error.message }, { status: 500 })
    return Response.json({ items: data ?? [] })
}
