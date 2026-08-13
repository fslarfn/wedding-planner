"use client"

import { useState } from "react"
import { Download, Images, RotateCcw, Share2 } from "lucide-react"
import { GOLD, GREEN, INK } from "@/lib/photobooth/theme"

export type SaveState = "idle" | "saving" | "saved" | "error"

type Props = {
    url: string
    blob: Blob
    guestName: string
    saveState: SaveState
    onRetake: () => void
    onGallery: () => void
}

function fileNameFor(guestName: string) {
    const slug = guestName.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
    return `kenangan-${slug || "tamu"}.jpg`
}

export default function ResultCard({ url, blob, guestName, saveState, onRetake, onGallery }: Props) {
    const [shareNote, setShareNote] = useState<string | null>(null)

    function download() {
        const a = document.createElement("a")
        a.href = url
        a.download = fileNameFor(guestName)
        a.click()
    }

    async function share() {
        const file = new File([blob], fileNameFor(guestName), { type: "image/jpeg" })
        // Web Share API adalah jalur paling andal ke Instagram Story dari web; kalau
        // browser tidak mendukungnya, unduh saja lalu tamu unggah manual.
        if (navigator.canShare?.({ files: [file] })) {
            try {
                await navigator.share({ files: [file], title: "Kenangan pernikahan" })
                return
            } catch {
                // Tamu membatalkan lembar berbagi — bukan kesalahan, tidak perlu pesan.
                return
            }
        }
        download()
        setShareNote("Browser ini belum bisa berbagi langsung, fotonya sudah diunduh.")
    }

    return (
        <div className="w-full max-w-md mx-auto px-6 py-10 flex flex-col items-center gap-6">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt="Hasil photobooth" className="max-h-[55dvh] w-auto shadow-2xl" />

            <p className="text-xs tracking-[0.25em] uppercase" style={{ color: GOLD }}>
                {saveState === "saving" && "Menyimpan kenangan..."}
                {saveState === "saved" && "Kenangan tersimpan"}
                {saveState === "error" && "Gagal tersimpan — fotonya tetap bisa diunduh"}
            </p>

            <div className="w-full space-y-3">
                <button
                    onClick={share}
                    className="w-full py-4 text-xs tracking-[0.3em] uppercase text-white"
                    style={{ backgroundColor: GREEN }}
                >
                    <Share2 className="inline w-4 h-4 mr-2" /> Bagikan
                </button>
                <button
                    onClick={download}
                    className="w-full py-4 text-xs tracking-[0.3em] uppercase border"
                    style={{ borderColor: GOLD, color: INK }}
                >
                    <Download className="inline w-4 h-4 mr-2" /> Unduh
                </button>
            </div>

            {shareNote && (
                <p className="text-[11px] text-center leading-relaxed" style={{ color: INK, opacity: 0.6 }}>
                    {shareNote}
                </p>
            )}

            <div className="flex items-center gap-6 pt-2">
                <button
                    onClick={onRetake}
                    className="flex items-center gap-2 text-[11px] tracking-[0.2em] uppercase"
                    style={{ color: INK, opacity: 0.7 }}
                >
                    <RotateCcw className="w-4 h-4" /> Foto Lagi
                </button>
                <button
                    onClick={onGallery}
                    className="flex items-center gap-2 text-[11px] tracking-[0.2em] uppercase"
                    style={{ color: INK, opacity: 0.7 }}
                >
                    <Images className="w-4 h-4" /> Jelajahi Kenangan
                </button>
            </div>
        </div>
    )
}
