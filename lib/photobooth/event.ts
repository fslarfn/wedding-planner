// Keterangan acara untuk seluruh halaman photobooth — halaman tamu maupun pamflet
// cetak. Dikumpulkan di sini supaya nama, tanggal, dan tagar tidak pernah berbeda
// antara yang dilihat tamu di layar dan yang tercetak di kertas.

import { supabase } from "@/lib/supabase"

/** Tagar acara, tercetak di bingkai polaroid dan di pamflet. */
export const HASHTAG = "#DITakenbySAL"

export type EventInfo = {
    names: string
    dateLabel: string
    heroPhotoUrl: string | null
    coverPhotoUrl: string | null
}

export async function getEventInfo(): Promise<EventInfo> {
    const { data } = await supabase
        .from("invitation_settings")
        .select("*")
        .order("updated_at", { ascending: true })
        .limit(1)
        .maybeSingle()

    return {
        names: coupleNames(data),
        dateLabel: eventDate(data),
        heroPhotoUrl: data?.hero_photo_url || data?.cover_photo_url || null,
        coverPhotoUrl: data?.cover_photo_url || null,
    }
}

// Mempelai wanita disebut lebih dulu — "Ditta & Faisal" — mengikuti penyebutan yang
// dipakai pasangan ini di dashboard.
function coupleNames(data: Record<string, string> | null) {
    const groom = data?.groom_nickname || data?.groom_name || "Mempelai Pria"
    const bride = data?.bride_nickname || data?.bride_name || "Mempelai Wanita"
    return `${bride} & ${groom}`
}

function eventDate(data: Record<string, string> | null) {
    const raw = data?.resepsi_date || data?.akad_date
    if (!raw) return ""
    const d = new Date(`${raw}T00:00:00`)
    if (Number.isNaN(d.getTime())) return ""
    return d.toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" })
}
