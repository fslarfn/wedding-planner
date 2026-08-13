import { createClient } from "@supabase/supabase-js"

// Menghapus dan menyembunyikan kenangan hanya boleh lewat sini.
//
// Tabel photobooth_photos sengaja tidak memberi anon key hak update/delete, sebab
// anon key terbuka di bundle browser setiap tamu. Route ini memakai service role key
// yang hanya ada di server, dijaga satu kunci admin yang juga tidak ikut ke bundle
// (jangan diberi awalan NEXT_PUBLIC_).

const BUCKET = "photobooth"

function adminClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !serviceKey) return null
    return createClient(url, serviceKey, { auth: { persistSession: false } })
}

function authorized(request: Request) {
    const expected = process.env.PHOTOBOOTH_ADMIN_KEY
    if (!expected) return false
    return request.headers.get("x-photobooth-key") === expected
}

/** Mengubah URL publik Storage kembali menjadi path di dalam bucket. */
function storagePath(imageUrl: string): string | null {
    const marker = `/storage/v1/object/public/${BUCKET}/`
    const at = imageUrl.indexOf(marker)
    return at === -1 ? null : decodeURIComponent(imageUrl.slice(at + marker.length))
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
    if (!authorized(request)) {
        return Response.json({ error: "Kunci admin tidak cocok." }, { status: 401 })
    }

    const supabase = adminClient()
    if (!supabase) {
        return Response.json({ error: "SUPABASE_SERVICE_ROLE_KEY belum diatur." }, { status: 500 })
    }

    const { id } = await params

    const { data: row, error: findError } = await supabase
        .from("photobooth_photos")
        .select("image_url")
        .eq("id", id)
        .maybeSingle()
    if (findError) return Response.json({ error: findError.message }, { status: 500 })
    if (!row) return Response.json({ error: "Kenangan tidak ditemukan." }, { status: 404 })

    // Filenya dibuang lebih dulu; kalau baris database gagal terhapus setelah ini,
    // yang tersisa hanya baris tanpa gambar — jauh lebih mudah dibereskan daripada
    // file yatim yang tidak tercatat di mana pun.
    const path = storagePath(row.image_url)
    if (path) await supabase.storage.from(BUCKET).remove([path])

    const { error: deleteError } = await supabase.from("photobooth_photos").delete().eq("id", id)
    if (deleteError) return Response.json({ error: deleteError.message }, { status: 500 })

    return Response.json({ ok: true })
}

/** Menyembunyikan atau menampilkan kembali kenangan di galeri tamu. */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
    if (!authorized(request)) {
        return Response.json({ error: "Kunci admin tidak cocok." }, { status: 401 })
    }

    const supabase = adminClient()
    if (!supabase) {
        return Response.json({ error: "SUPABASE_SERVICE_ROLE_KEY belum diatur." }, { status: 500 })
    }

    const { id } = await params
    const body = await request.json().catch(() => null)
    if (typeof body?.is_hidden !== "boolean") {
        return Response.json({ error: "Kolom is_hidden wajib berupa boolean." }, { status: 400 })
    }

    const { error } = await supabase
        .from("photobooth_photos")
        .update({ is_hidden: body.is_hidden })
        .eq("id", id)
    if (error) return Response.json({ error: error.message }, { status: 500 })

    return Response.json({ ok: true })
}
