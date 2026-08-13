import { headers } from "next/headers"
import PhotoboothAdmin from "@/components/photobooth/PhotoboothAdmin"

// Alamat halaman tamu dibaca dari header permintaan, bukan dari window di browser,
// supaya tidak ada perbedaan antara tampilan server dan klien saat hidrasi.
export default async function PhotoboothAdminPage() {
    const h = await headers()
    const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000"
    const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https")

    return <PhotoboothAdmin link={`${proto}://${host}/kenangan`} />
}
