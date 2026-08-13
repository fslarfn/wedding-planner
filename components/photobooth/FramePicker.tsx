"use client"

import { useRef, useState } from "react"
import { cn } from "@/lib/utils"
import { FRAMES, type Frame } from "@/lib/photobooth/frames"
import { GOLD, GREEN, INK } from "@/lib/photobooth/theme"

type Props = { value: Frame; onChange: (frame: Frame) => void; onConfirm: () => void }

export default function FramePicker({ value, onChange, onConfirm }: Props) {
    const trackRef = useRef<HTMLDivElement>(null)
    const [active, setActive] = useState(() => Math.max(0, FRAMES.findIndex(f => f.id === value.id)))

    // Carousel digeser jari, jadi bingkai aktif ditentukan dari posisi scroll,
    // bukan dari tombol panah.
    function handleScroll() {
        const el = trackRef.current
        if (!el) return
        const index = Math.round(el.scrollLeft / el.clientWidth)
        if (index !== active && FRAMES[index]) {
            setActive(index)
            onChange(FRAMES[index])
        }
    }

    function goTo(index: number) {
        const el = trackRef.current
        if (!el) return
        el.scrollTo({ left: index * el.clientWidth, behavior: "smooth" })
    }

    return (
        <div className="w-full max-w-md mx-auto px-6 py-8 flex flex-col items-center gap-6">
            <div
                ref={trackRef}
                onScroll={handleScroll}
                className="w-full flex overflow-x-auto snap-x snap-mandatory no-scrollbar"
            >
                {FRAMES.map(frame => (
                    <div key={frame.id} className="w-full shrink-0 snap-center flex justify-center px-2">
                        <div
                            className="max-h-[52dvh] shadow-xl"
                            style={{ aspectRatio: frame.width / frame.height, backgroundColor: "#1F1F1D" }}
                        >
                            {/* Aset bingkai berlubang transparan; latar gelap di belakangnya
                                membuat slot terbaca sebagai tempat foto. */}
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={frame.src} alt={frame.label} className="h-full w-full object-contain" />
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex items-center gap-2">
                {FRAMES.map((frame, i) => (
                    <button
                        key={frame.id}
                        onClick={() => goTo(i)}
                        aria-label={frame.label}
                        className={cn("h-1.5 rounded-full transition-all", i === active ? "w-6" : "w-1.5")}
                        style={{ backgroundColor: i === active ? GOLD : "#D6CEC2" }}
                    />
                ))}
            </div>

            <p className="text-xs tracking-[0.25em] uppercase" style={{ color: INK, opacity: 0.6 }}>
                {FRAMES[active]?.label}
            </p>

            <button
                onClick={onConfirm}
                className="w-full py-4 text-xs tracking-[0.3em] uppercase text-white"
                style={{ backgroundColor: GREEN }}
            >
                Pilih Bingkai
            </button>
        </div>
    )
}
