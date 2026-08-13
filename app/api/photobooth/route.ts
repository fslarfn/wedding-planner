import { adminClient, missingServiceKey, rejectUnauthorized } from "@/lib/photobooth/adminAuth"

// Daftar lengkap kenangan untuk dashboard, termasuk yang disembunyikan.
//
// Anon key hanya boleh membaca kenangan yang tampil (lihat policy di
// supabase/photobooth.sql), jadi daftar penuh harus lewat service role di server.

export async function GET(request: Request) {
    const rejected = rejectUnauthorized(request)
    if (rejected) return rejected

    const supabase = adminClient()
    if (!supabase) return missingServiceKey()

    const { data, error } = await supabase
        .from("photobooth_photos")
        .select("*")
        .order("created_at", { ascending: false })

    if (error) return Response.json({ error: error.message }, { status: 500 })
    return Response.json({ items: data ?? [] })
}
