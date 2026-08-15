"use client"

import { useEffect, useState } from "react"
import NextImage from "next/image"
import { ArrowLeft, Loader2 } from "lucide-react"
import { fetchMemories, formatStamp, type Memory } from "@/lib/photobooth/storage"
import { getFrame } from "@/lib/photobooth/frames"
import { GOLD, INK } from "@/lib/photobooth/theme"

// Ditampilkan bertahap. Satu polaroid berukuran 300-500 KB, jadi memuat seluruh
// galeri sekaligus berarti menarik puluhan megabyte lewat jaringan venue yang
// dipakai ratusan tamu bersamaan.
const PER_HALAMAN = 24

type Props = { names: string; onBack: () => void }

export default function MemoryGallery({ names, onBack }: Props) {
    const [items, setItems] = useState<Memory[]>([])
    const [loading, setLoading] = useState(true)
    const [tampil, setTampil] = useState(PER_HALAMAN)
    const [selected, setSelected] = useState<Memory | null>(null)

    useEffect(() => {
        // Barisnya murah; yang mahal gambarnya. Diambil banyak, dirender sedikit demi
        // sedikit.
        fetchMemories(120)
            .then(setItems)
            .catch(() => setItems([]))
            .finally(() => setLoading(false))
    }, [])

    return (
        <div className="w-full max-w-3xl mx-auto px-5 py-8">
            <button
                onClick={onBack}
                className="flex items-center gap-2 text-xs tracking-[0.2em] uppercase mb-8"
                style={{ color: INK, opacity: 0.6 }}
            >
                <ArrowLeft className="w-4 h-4" /> Kembali
            </button>

            <div className="text-center mb-10">
                <p className="text-[10px] tracking-[0.35em] uppercase" style={{ color: GOLD }}>
                    Wedding Memories Of
                </p>
                <h2 className="text-2xl mt-2" style={{ color: INK }}>{names}</h2>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="w-6 h-6 animate-spin" style={{ color: GOLD }} />
                </div>
            ) : items.length === 0 ? (
                <p className="text-center text-sm py-20" style={{ color: INK, opacity: 0.5 }}>
                    Belum ada kenangan. Jadilah yang pertama!
                </p>
            ) : (
                <>
                    <div className="columns-2 md:columns-3 gap-4 space-y-4">
                        {items.slice(0, tampil).map(item => {
                            // Rasio bingkai tersimpan di frame_id, jadi tinggi gambar sudah
                            // diketahui sebelum berkasnya tiba — tata letak tidak melompat.
                            const frame = getFrame(item.frame_id)
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => setSelected(item)}
                                    className="break-inside-avoid block w-full text-left bg-white p-2 pb-3 shadow-md"
                                >
                                    {/* next/image menyajikan versi seukuran tampilan lewat cache
                                        Vercel, bukan berkas 400 KB dari Supabase. */}
                                    <NextImage
                                        src={item.image_url}
                                        alt={item.guest_name}
                                        width={frame.width}
                                        height={frame.height}
                                        sizes="(max-width: 768px) 45vw, 30vw"
                                        className="w-full h-auto"
                                    />
                                    <p className="mt-2 text-[11px] tracking-[0.15em] uppercase truncate" style={{ color: INK }}>
                                        {item.guest_name}
                                    </p>
                                    <p className="text-[9px] tracking-[0.1em]" style={{ color: INK, opacity: 0.45 }}>
                                        {formatStamp(item.created_at)}
                                    </p>
                                </button>
                            )
                        })}
                    </div>

                    {tampil < items.length && (
                        <div className="text-center mt-10">
                            <button
                                onClick={() => setTampil(t => t + PER_HALAMAN)}
                                className="px-10 py-4 text-[11px] tracking-[0.3em] uppercase border"
                                style={{ borderColor: GOLD, color: INK }}
                            >
                                Muat Lebih Banyak
                            </button>
                        </div>
                    )}
                </>
            )}

            {selected && (
                <div
                    className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-5 bg-black/80 p-6"
                    onClick={() => setSelected(null)}
                >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={selected.image_url}
                        alt={selected.guest_name}
                        className="max-h-[70dvh] w-auto shadow-2xl"
                    />
                    <div className="text-center">
                        <p className="text-sm tracking-[0.2em] uppercase text-white">{selected.guest_name}</p>
                        <p className="text-[10px] tracking-[0.15em] text-white/60 mt-1">
                            {formatStamp(selected.created_at)}
                        </p>
                    </div>
                    <button className="text-[11px] tracking-[0.3em] uppercase text-white/80 underline underline-offset-4">
                        Tutup
                    </button>
                </div>
            )}
        </div>
    )
}
