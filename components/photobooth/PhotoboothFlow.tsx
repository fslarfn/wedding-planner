"use client"

import { useCallback, useRef, useState } from "react"
import NextImage from "next/image"
import { AnimatePresence, motion } from "framer-motion"
import { Playfair_Display, Great_Vibes } from "next/font/google"
import { ArrowLeft, Camera, Images } from "lucide-react"
import { FRAMES, type Frame } from "@/lib/photobooth/frames"
import { renderPolaroid } from "@/lib/photobooth/renderPolaroid"
import { saveMemory } from "@/lib/photobooth/storage"
import { GOLD, GREEN, INK } from "@/lib/photobooth/theme"
import CameraCapture from "./CameraCapture"
import FramePicker from "./FramePicker"
import MemoryGallery from "./MemoryGallery"
import PrintingAnimation from "./PrintingAnimation"
import ResultCard, { type SaveState } from "./ResultCard"

const playfair = Playfair_Display({ subsets: ["latin"], weight: ["400", "500", "600"] })
const scriptFont = Great_Vibes({ subsets: ["latin"], weight: "400" })

const sleep = (ms: number) => new Promise(res => setTimeout(res, ms))

// Animasi mesin cetak butuh waktu untuk terbaca sebagai animasi; tanpa jeda minimum,
// hasil render yang cepat membuatnya berkedip sekilas lalu hilang.
const MIN_PRINT_MS = 2200

type Step = "intro" | "nama" | "bingkai" | "kamera" | "mencetak" | "hasil" | "galeri"

type Props = { names: string; dateLabel: string; heroPhotoUrl: string | null }

export default function PhotoboothFlow({ names, dateLabel, heroPhotoUrl }: Props) {
    const [step, setStep] = useState<Step>("intro")
    const [guestName, setGuestName] = useState("")
    const [frame, setFrame] = useState<Frame>(FRAMES[0])
    const [result, setResult] = useState<{ url: string; blob: Blob } | null>(null)
    const [saveState, setSaveState] = useState<SaveState>("idle")
    const [renderError, setRenderError] = useState<string | null>(null)

    const objectUrlRef = useRef<string | null>(null)

    const releaseResult = useCallback(() => {
        if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current)
        objectUrlRef.current = null
    }, [])

    const handleCaptured = useCallback(async (photos: ImageBitmap[]) => {
        setStep("mencetak")
        setRenderError(null)

        try {
            const [blob] = await Promise.all([
                renderPolaroid(frame, photos, { names, date: dateLabel }),
                sleep(MIN_PRINT_MS),
            ])

            releaseResult()
            const url = URL.createObjectURL(blob)
            objectUrlRef.current = url
            setResult({ url, blob })
            setStep("hasil")

            // Kegagalan menyimpan tidak boleh membatalkan hasil: tamu tetap bisa
            // mengunduh polaroidnya walau koneksi di venue sedang buruk.
            setSaveState("saving")
            try {
                await saveMemory(blob, guestName.trim(), frame.id)
                setSaveState("saved")
            } catch {
                setSaveState("error")
            }
        } catch {
            setRenderError("Gagal menyusun foto. Coba ulangi sekali lagi, ya.")
        } finally {
            photos.forEach(p => p.close())
        }
    }, [frame, names, dateLabel, guestName, releaseResult])

    function retake() {
        releaseResult()
        setResult(null)
        setSaveState("idle")
        setStep("nama")
    }

    const slot = frame.slots[0]
    const slotAspect = (slot.w * frame.width) / (slot.h * frame.height)

    return (
        <div className={`${playfair.className} min-h-dvh`} style={{ color: INK }}>
            <AnimatePresence mode="wait">
                <motion.div
                    key={step}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.35 }}
                >
                    {step === "intro" && (
                        <section className="min-h-dvh flex flex-col">
                            <div className="relative flex-1 min-h-[45dvh] flex items-center justify-center overflow-hidden">
                                {heroPhotoUrl ? (
                                    <>
                                        <NextImage
                                            src={heroPhotoUrl}
                                            alt=""
                                            fill
                                            priority
                                            sizes="100vw"
                                            className="object-cover"
                                        />
                                        <div className="absolute inset-0 bg-black/45" />
                                    </>
                                ) : (
                                    <div className="absolute inset-0" style={{ backgroundColor: GREEN }} />
                                )}

                                <div className="relative text-center px-8 py-16 text-white">
                                    <p className="text-[10px] tracking-[0.4em] uppercase opacity-80">
                                        Kenangan Pernikahan
                                    </p>
                                    <h1 className={`${scriptFont.className} text-5xl mt-4`}>{names}</h1>
                                    {dateLabel && (
                                        <p className="text-[11px] tracking-[0.3em] uppercase mt-4 opacity-80">
                                            {dateLabel}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="px-8 py-12 text-center">
                                <p className="text-sm leading-relaxed max-w-xs mx-auto" style={{ opacity: 0.75 }}>
                                    Mari rayakan hari ini melalui sudut pandangmu.
                                </p>

                                <button
                                    onClick={() => setStep("nama")}
                                    className="w-full max-w-sm mx-auto mt-8 py-4 text-xs tracking-[0.3em] uppercase text-white"
                                    style={{ backgroundColor: GREEN }}
                                >
                                    <Camera className="inline w-4 h-4 mr-2" /> Tambahkan Momen
                                </button>

                                <button
                                    onClick={() => setStep("galeri")}
                                    className="mt-6 text-[11px] tracking-[0.25em] uppercase underline underline-offset-8"
                                    style={{ color: GOLD }}
                                >
                                    <Images className="inline w-4 h-4 mr-2" /> Jelajahi Kenangan
                                </button>
                            </div>
                        </section>
                    )}

                    {step === "nama" && (
                        <section className="min-h-dvh flex flex-col justify-center px-8 max-w-md mx-auto w-full">
                            <button
                                onClick={() => setStep("intro")}
                                className="self-start flex items-center gap-2 text-xs tracking-[0.2em] uppercase mb-12"
                                style={{ opacity: 0.6 }}
                            >
                                <ArrowLeft className="w-4 h-4" /> Kembali
                            </button>

                            <div className="text-center">
                                <p className="text-[10px] tracking-[0.35em] uppercase" style={{ color: GOLD }}>
                                    Kenangan Pernikahan
                                </p>
                                <h2 className={`${scriptFont.className} text-4xl mt-2`}>{names}</h2>
                            </div>

                            <p className="text-center text-lg tracking-[0.15em] uppercase mt-14">
                                Dari siapa<br />kenangan ini?
                            </p>

                            <input
                                value={guestName}
                                onChange={e => setGuestName(e.target.value)}
                                placeholder="Nama kamu..."
                                maxLength={40}
                                className="mt-8 w-full bg-transparent border-b py-3 text-center text-lg outline-none placeholder:opacity-40"
                                style={{ borderColor: GOLD }}
                            />

                            <button
                                onClick={() => setStep("bingkai")}
                                disabled={!guestName.trim()}
                                className="mt-12 w-full py-4 text-xs tracking-[0.3em] uppercase text-white disabled:opacity-30"
                                style={{ backgroundColor: GREEN }}
                            >
                                Selanjutnya
                            </button>
                        </section>
                    )}

                    {step === "bingkai" && (
                        <section className="min-h-dvh flex flex-col justify-center">
                            <FramePicker
                                value={frame}
                                onChange={setFrame}
                                onConfirm={() => setStep("kamera")}
                            />
                        </section>
                    )}

                    {step === "kamera" && (
                        <section className="min-h-dvh flex flex-col justify-center">
                            <CameraCapture
                                count={frame.slots.length}
                                aspect={slotAspect}
                                onDone={handleCaptured}
                                onCancel={() => setStep("bingkai")}
                            />
                        </section>
                    )}

                    {step === "mencetak" && (
                        <section className="min-h-dvh flex flex-col justify-center">
                            {renderError ? (
                                <div className="text-center px-8">
                                    <p className="text-sm" style={{ opacity: 0.7 }}>{renderError}</p>
                                    <button
                                        onClick={() => setStep("bingkai")}
                                        className="mt-8 px-10 py-4 text-xs tracking-[0.3em] uppercase text-white"
                                        style={{ backgroundColor: GREEN }}
                                    >
                                        Ulangi
                                    </button>
                                </div>
                            ) : (
                                <PrintingAnimation />
                            )}
                        </section>
                    )}

                    {step === "hasil" && result && (
                        <section className="min-h-dvh flex flex-col justify-center">
                            <ResultCard
                                url={result.url}
                                blob={result.blob}
                                guestName={guestName}
                                saveState={saveState}
                                onRetake={retake}
                                onGallery={() => setStep("galeri")}
                            />
                        </section>
                    )}

                    {step === "galeri" && (
                        <MemoryGallery names={names} onBack={() => setStep(result ? "hasil" : "intro")} />
                    )}
                </motion.div>
            </AnimatePresence>
        </div>
    )
}
