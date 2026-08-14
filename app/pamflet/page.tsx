import type { Metadata } from "next"
import { headers } from "next/headers"
import { Playfair_Display, Great_Vibes } from "next/font/google"
import { getEventInfo, HASHTAG } from "@/lib/photobooth/event"
import PrintButton from "@/components/photobooth/PrintButton"

const playfair = Playfair_Display({ subsets: ["latin"], weight: ["400", "500", "600"] })
const scriptFont = Great_Vibes({ subsets: ["latin"], weight: "400" })

export const metadata: Metadata = {
    title: "Pamflet Photobooth A4",
    robots: { index: false, follow: false },
}

// Ukuran ditulis dalam milimeter, bukan piksel, supaya hasil cetaknya sama di
// pencetak mana pun. Warna latar wajib dipaksa ikut tercetak — bawaan browser
// membuang latar berwarna demi menghemat tinta, dan pamflet ini akan jadi kertas
// putih polos tanpa itu.
const CSS = `
@page { size: A4 portrait; margin: 0; }

.lembar, .lembar * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }

.lembar {
  width: 210mm;
  height: 297mm;
  position: relative;
  background: #FBF8F2;
  color: #2B2B26;
  padding: 20mm 18mm;
  display: flex;
  flex-direction: column;
  align-items: center;
  overflow: hidden;
}

.garis-luar { position: absolute; inset: 9mm; border: 0.7mm solid #B08D57; }
.garis-dalam { position: absolute; inset: 11mm; border: 0.25mm solid #B08D57; opacity: .55; }

/* Tiga kelompok dengan ruang sisa dibagi rata: nama sepanjang apa pun tidak membuat
   isinya menumpuk di atas dan meninggalkan satu celah menganga di bawah. */
.isi { position: relative; z-index: 1; display: flex; flex-direction: column;
       align-items: center; justify-content: space-between;
       text-align: center; width: 100%; height: 100%; }
.isi > section { display: flex; flex-direction: column; align-items: center; width: 100%; }

.eyebrow { font-size: 3.4mm; letter-spacing: 1.6mm; text-transform: uppercase; color: #B08D57; }
.nama { font-size: 24mm; line-height: 1.05; margin-top: 3mm; }
.tanggal { font-size: 3.2mm; letter-spacing: 1mm; text-transform: uppercase;
           color: #6E6A60; margin-top: 3mm; }

.pemisah { display: flex; align-items: center; gap: 3mm; margin: 6mm 0; }
.pemisah span { display: block; width: 22mm; height: 0.25mm; background: #B08D57; }
.pemisah i { display: block; width: 2mm; height: 2mm; background: #B08D57; transform: rotate(45deg); }

.ajakan { font-size: 6mm; letter-spacing: 0.6mm; }
.kartu-qr { margin-top: 5mm; padding: 5mm; background: #fff; border: 0.5mm solid #B08D57; }
.kartu-qr img { display: block; width: 78mm; height: 78mm; }
.pindai { margin-top: 4mm; font-size: 3.2mm; letter-spacing: 1.1mm;
          text-transform: uppercase; color: #24463A; }

.langkah { display: flex; gap: 6mm; margin-top: 7mm; width: 100%; }
.langkah > div { flex: 1; }
.langkah b { display: block; font-family: Georgia, serif; font-size: 6mm;
             color: #B08D57; font-weight: 400; }
.langkah p { margin-top: 1.5mm; font-size: 3.1mm; line-height: 1.5; color: #4A473F; }

.catatan { margin-top: 6mm; font-size: 2.7mm; line-height: 1.5; color: #8A8579;
           max-width: 120mm; }

.tagar { font-size: 7mm; letter-spacing: 0.4mm; }
.tautan { margin-top: 2mm; font-size: 3mm; letter-spacing: 0.6mm; color: #8A8579; }

.bunga { position: absolute; bottom: 13mm; width: 32mm; z-index: 0; }
.bunga-kiri { left: 13mm; }
.bunga-kanan { right: 13mm; transform: scaleX(-1); }

@media print {
  .layar { display: none !important; }
  body { background: #fff !important; }
  .lembar { box-shadow: none; margin: 0; }
}
`

export default async function PamfletPage() {
    const { names, dateLabel } = await getEventInfo()

    const h = await headers()
    const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000"
    const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https")

    return (
        <div className={playfair.className}>
            <style dangerouslySetInnerHTML={{ __html: CSS }} />

            <div className="layar mx-auto max-w-[210mm] px-6 py-8 text-center">
                <h1 className="text-lg font-semibold text-slate-800">Pamflet Photobooth — A4</h1>
                <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-500">
                    Cetak di kertas A4, lalu laminating. Di dialog cetak pilih ukuran <b>A4</b>,
                    skala <b>100%</b>, margin <b>None</b>, dan aktifkan <b>Background graphics</b>
                    supaya warna latarnya ikut tercetak.
                </p>
                <div className="mt-5">
                    <PrintButton />
                </div>
            </div>

            <div className="flex justify-center pb-10 print:pb-0">
                <div className="lembar shadow-2xl print:shadow-none">
                    <div className="garis-luar" />
                    <div className="garis-dalam" />

                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/photobooth/ornamen/spray.svg" alt="" className="bunga bunga-kiri" />
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/photobooth/ornamen/spray.svg" alt="" className="bunga bunga-kanan" />

                    <div className="isi">
                        <section>
                            <p className="eyebrow">Kenangan Pernikahan</p>
                            <p className={`nama ${scriptFont.className}`}>{names}</p>
                            {dateLabel && <p className="tanggal">{dateLabel}</p>}

                            <div className="pemisah">
                                <span /><i /><span />
                            </div>

                            <p className="ajakan">Abadikan Momenmu</p>
                        </section>

                        <section>
                        <div className="kartu-qr">
                            {/* Diminta 1200px supaya tetap tajam saat dicetak 78mm. */}
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src="/api/photobooth/qr?size=1200" alt="QR photobooth" />
                        </div>

                        <p className="pindai">Pindai untuk berfoto</p>

                        <div className="langkah">
                            <div>
                                <b>1</b>
                                <p>Pindai QR dengan kamera bawaan HP</p>
                            </div>
                            <div>
                                <b>2</b>
                                <p>Tulis namamu, lalu pilih bingkai</p>
                            </div>
                            <div>
                                <b>3</b>
                                <p>Berpose, unduh, bagikan ke Story</p>
                            </div>
                        </div>

                        <p className="catatan">
                            Bila halaman terbuka di dalam aplikasi WhatsApp atau Instagram,
                            pilih &ldquo;Buka di browser&rdquo; agar kamera dapat digunakan.
                        </p>
                        </section>

                        <section>
                            <p className="tagar">{HASHTAG}</p>
                            <p className="tautan">{`${proto}://${host}/kenangan`}</p>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    )
}
