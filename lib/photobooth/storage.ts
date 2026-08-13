// Penyimpanan kenangan photobooth: unggah gambar jadi ke Storage, lalu catat barisnya
// di tabel supaya bisa ditampilkan di galeri tamu dan dashboard.
//
// Mengikuti pola yang sudah dipakai di app/(protected)/invitation/page.tsx:
// upload -> getPublicUrl -> insert.

import { supabase } from "@/lib/supabase"

const BUCKET = "photobooth"

export type Memory = {
    id: string
    guest_name: string
    image_url: string
    frame_id: string
    voice_url: string | null
    created_at: string
}

export async function saveMemory(blob: Blob, guestName: string, frameId: string): Promise<Memory> {
    // Dikelompokkan per tanggal supaya isi bucket masih terbaca manusia saat acara
    // menghasilkan ratusan file.
    const folder = new Date().toISOString().slice(0, 10)
    const path = `${folder}/${crypto.randomUUID()}.jpg`

    const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(path, blob, { contentType: "image/jpeg" })
    if (uploadError) throw uploadError

    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path)

    const { data, error } = await supabase
        .from("photobooth_photos")
        .insert([{ guest_name: guestName, image_url: urlData.publicUrl, frame_id: frameId }])
        .select()
        .single()
    if (error) throw error

    return data as Memory
}

export async function fetchMemories(limit = 60): Promise<Memory[]> {
    const { data, error } = await supabase
        .from("photobooth_photos")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit)
    if (error) throw error
    return (data ?? []) as Memory[]
}

/** "12 JUL 2026 · 16.37 WIB" — acara selalu dalam WIB, apa pun zona waktu pembaca. */
export function formatStamp(iso: string): string {
    const d = new Date(iso)
    const tanggal = d.toLocaleDateString("id-ID", {
        day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Jakarta",
    })
    const jam = d.toLocaleTimeString("id-ID", {
        hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta",
    }).replace(":", ".")
    return `${tanggal.toUpperCase()} · ${jam} WIB`
}
