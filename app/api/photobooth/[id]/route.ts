import { adminClient, missingServiceKey, rejectUnauthorized } from "@/lib/photobooth/adminAuth"

// Menghapus dan menyembunyikan kenangan hanya boleh lewat sini.
//
// Tabel photobooth_photos sengaja tidak memberi anon key hak update/delete, sebab
// anon key terbuka di bundle browser setiap tamu. Route ini memakai service role key
// yang hanya ada di server, dijaga satu kunci admin yang juga tidak ikut ke bundle
// (jangan diberi awalan NEXT_PUBLIC_).

const BUCKET = "photobooth"

/** Mengubah URL publik Storage kembali menjadi path di dalam bucket. */
function storagePath(imageUrl: string): string | null {
    const marker = `/storage/v1/object/public/${BUCKET}/`
    const at = imageUrl.indexOf(marker)
    return at === -1 ? null : decodeURIComponent(imageUrl.slice(at + marker.length))
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const rejected = rejectUnauthorized(request)
    if (rejected) return rejected

    const supabase = adminClient()
    if (!supabase) return missingServiceKey()

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
    const rejected = rejectUnauthorized(request)
    if (rejected) return rejected

    const supabase = adminClient()
    if (!supabase) return missingServiceKey()

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
