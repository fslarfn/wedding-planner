import type { Metadata } from "next"
import { supabase } from "@/lib/supabase"
import PhotoboothFlow from "@/components/photobooth/PhotoboothFlow"

// Tagar acara, dicetak di bawah nama pada setiap bingkai polaroid. Satu-satunya
// tempat untuk mengubahnya.
const HASHTAG = "#DITakenbySAL"

// Ratusan tamu bisa memindai QR dalam waktu berdekatan, jadi halaman ini di-cache dan
// disegarkan berkala — bukan dirender ulang tiap permintaan — tapi tetap ikut berubah
// kalau nama atau tanggal di pengaturan undangan diperbarui tanpa perlu deploy ulang.
export const revalidate = 60

// Nama & tanggal diambil dari pengaturan undangan supaya tidak ada konfigurasi kembar
// yang harus diperbarui dua kali. Pola query sama dengan app/undangan/page.tsx.
async function getSettings() {
    const { data } = await supabase
        .from("invitation_settings")
        .select("*")
        .order("updated_at", { ascending: true })
        .limit(1)
        .maybeSingle()
    return data
}

// Mempelai wanita disebut lebih dulu — "Ditta & Faisal" — mengikuti penyebutan yang
// dipakai pasangan ini di dashboard. Satu-satunya sumber nama untuk seluruh halaman
// photobooth: beranda, judul tab, dan tulisan di bingkai polaroid.
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

export async function generateMetadata(): Promise<Metadata> {
    const data = await getSettings()
    const names = coupleNames(data)
    const title = `Photobooth Pernikahan ${names}`
    const description = "Abadikan momen indah hari ini dan tinggalkan kenangan untuk kami."
    const image = data?.cover_photo_url || undefined

    return {
        title,
        description,
        openGraph: { title, description, images: image ? [image] : undefined },
    }
}

export default async function PhotoboothPage() {
    const data = await getSettings()

    return (
        <PhotoboothFlow
            names={coupleNames(data)}
            hashtag={HASHTAG}
            dateLabel={eventDate(data)}
            heroPhotoUrl={data?.hero_photo_url || data?.cover_photo_url || null}
        />
    )
}
