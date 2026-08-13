// Penjagaan route admin photobooth, dipakai bersama oleh semua endpoint di
// app/api/photobooth.

import { createClient, type SupabaseClient } from "@supabase/supabase-js"

/**
 * Mengembalikan Response kalau permintaan harus ditolak, atau null kalau lolos.
 *
 * Kunci yang belum diatur di server dan kunci yang salah ketik dulu menghasilkan
 * balasan yang sama persis, sehingga mustahil membedakan "saya salah ketik" dari
 * "variabelnya memang belum sampai ke deployment". Keduanya sekarang dipisah.
 */
export function rejectUnauthorized(request: Request): Response | null {
    const expected = process.env.PHOTOBOOTH_ADMIN_KEY?.trim()

    if (!expected) {
        return Response.json(
            {
                error:
                    "PHOTOBOOTH_ADMIN_KEY belum ada di server ini. Tambahkan di Environment " +
                    "Variables (centang Production), lalu deploy ulang — mengubah variabel " +
                    "saja tidak berpengaruh pada deployment yang sudah jalan.",
            },
            { status: 503 },
        )
    }

    // Nilai yang ditempel ke dashboard Vercel kerap membawa spasi atau baris baru
    // yang tak terlihat, begitu juga yang diketik di HP.
    if (request.headers.get("x-photobooth-key")?.trim() !== expected) {
        return Response.json({ error: "Kunci admin tidak cocok." }, { status: 401 })
    }

    return null
}

/** Klien Supabase berhak penuh; hanya boleh hidup di server. */
export function adminClient(): SupabaseClient | null {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !serviceKey) return null
    return createClient(url, serviceKey, { auth: { persistSession: false } })
}

export function missingServiceKey(): Response {
    return Response.json(
        {
            error:
                "SUPABASE_SERVICE_ROLE_KEY belum ada di server ini. Tambahkan di Environment " +
                "Variables lalu deploy ulang.",
        },
        { status: 503 },
    )
}
