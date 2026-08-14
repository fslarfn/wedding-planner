import type { Metadata } from "next"
import { getEventInfo, HASHTAG } from "@/lib/photobooth/event"
import PhotoboothFlow from "@/components/photobooth/PhotoboothFlow"

// Ratusan tamu bisa memindai QR dalam waktu berdekatan, jadi halaman ini di-cache dan
// disegarkan berkala — bukan dirender ulang tiap permintaan — tapi tetap ikut berubah
// kalau nama atau tanggal di pengaturan undangan diperbarui tanpa perlu deploy ulang.
export const revalidate = 60

export async function generateMetadata(): Promise<Metadata> {
    const { names, coverPhotoUrl } = await getEventInfo()
    const title = `Photobooth Pernikahan ${names}`
    const description = "Abadikan momen indah hari ini dan tinggalkan kenangan untuk kami."

    return {
        title,
        description,
        openGraph: { title, description, images: coverPhotoUrl ? [coverPhotoUrl] : undefined },
    }
}

export default async function KenanganPage() {
    const { names, dateLabel, heroPhotoUrl } = await getEventInfo()

    return (
        <PhotoboothFlow
            names={names}
            hashtag={HASHTAG}
            dateLabel={dateLabel}
            heroPhotoUrl={heroPhotoUrl}
        />
    )
}
