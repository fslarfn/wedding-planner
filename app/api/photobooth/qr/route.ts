import QRCode from "qrcode"
import { GREEN } from "@/lib/photobooth/theme"

// QR code menuju halaman photobooth, untuk dicetak jadi standee atau kartu meja.
// Dibuat di server supaya library QR tidak ikut terkirim ke browser tamu.
//
// Alamatnya dibaca dari header permintaan, bukan parameter, supaya QR tidak bisa
// diarahkan ke situs lain oleh siapa pun yang menebak-nebak URL endpoint ini.

const MIN_SIZE = 200
const MAX_SIZE = 2048

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const requested = Number(searchParams.get("size")) || 600
    const size = Math.min(MAX_SIZE, Math.max(MIN_SIZE, Math.round(requested)))

    const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host")
    const proto = request.headers.get("x-forwarded-proto") ?? "https"
    const target = `${proto}://${host}/kenangan`

    const png = await QRCode.toBuffer(target, {
        width: size,
        margin: 2,
        // Toleransi galat tinggi supaya QR tetap terbaca walau tercetak kecil,
        // kena lipatan kartu meja, atau dipindai dari sudut miring.
        errorCorrectionLevel: "H",
        color: { dark: GREEN, light: "#FFFFFF" },
    })

    return new Response(new Uint8Array(png), {
        headers: {
            "Content-Type": "image/png",
            "Content-Disposition": `inline; filename="qr-photobooth-${size}.png"`,
            "Cache-Control": "public, max-age=3600",
        },
    })
}
