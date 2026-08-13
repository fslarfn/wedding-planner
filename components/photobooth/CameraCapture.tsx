"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Camera, ImageUp, Power, X } from "lucide-react"
import { GOLD, GREEN, INK } from "@/lib/photobooth/theme"

const sleep = (ms: number) => new Promise(res => setTimeout(res, ms))

type Props = {
    /** Berapa jepretan yang dibutuhkan bingkai terpilih. */
    count: number
    /** Rasio lebar/tinggi slot, supaya pratinjau sama persis dengan hasil akhir. */
    aspect: number
    onDone: (photos: ImageBitmap[]) => void
    onCancel: () => void
}

export default function CameraCapture({ count, aspect, onDone, onCancel }: Props) {
    const videoRef = useRef<HTMLVideoElement>(null)
    const streamRef = useRef<MediaStream | null>(null)
    const shotsRef = useRef<ImageBitmap[]>([])
    const fileInputRef = useRef<HTMLInputElement>(null)

    const [ready, setReady] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [taken, setTaken] = useState(0)
    const [countdown, setCountdown] = useState<number | null>(null)
    const [flash, setFlash] = useState(false)
    const [running, setRunning] = useState(false)

    const stopCamera = useCallback(() => {
        streamRef.current?.getTracks().forEach(t => t.stop())
        streamRef.current = null
    }, [])

    // Wajib dimatikan saat pindah layar; kalau tidak, lampu kamera tetap menyala dan
    // baterai HP tamu terkuras.
    useEffect(() => stopCamera, [stopCamera])

    // Kamera sengaja dinyalakan lewat tombol, bukan otomatis saat layar terbuka:
    // Safari iOS hanya mengizinkan permintaan kamera yang lahir dari sentuhan user.
    async function startCamera() {
        setError(null)

        if (!navigator.mediaDevices?.getUserMedia) {
            setError("Browser ini tidak mengizinkan akses kamera.")
            return
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                // Dibatasi 1440 supaya HP kelas bawah tidak kehabisan memori saat
                // menggabungkan beberapa jepretan sekaligus.
                video: { facingMode: "user", width: { ideal: 1440 }, height: { ideal: 1440 } },
                audio: false,
            })
            streamRef.current = stream
            if (videoRef.current) {
                videoRef.current.srcObject = stream
                await videoRef.current.play()
            }
            setReady(true)
        } catch {
            setError("Kamera tidak bisa dibuka. Izinkan akses kamera, atau pakai tombol di bawah.")
        }
    }

    async function grabFrame(): Promise<ImageBitmap | null> {
        const video = videoRef.current
        if (!video?.videoWidth) return null

        const canvas = document.createElement("canvas")
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        const ctx = canvas.getContext("2d")
        if (!ctx) return null

        // Pratinjau dicerminkan supaya terasa seperti bercermin. Hasilnya ikut
        // dicerminkan agar sama persis dengan yang dilihat tamu saat berpose.
        ctx.translate(canvas.width, 0)
        ctx.scale(-1, 1)
        ctx.drawImage(video, 0, 0)
        return createImageBitmap(canvas)
    }

    /**
     * Satu tekanan tombol = satu jepretan. Bingkai berisi beberapa foto sengaja tidak
     * memotret beruntun sendiri: tamu perlu jeda untuk berganti gaya, dan rentetan
     * otomatis membuat foto kedua dan ketiga tertangkap saat mereka belum siap.
     */
    async function captureOne() {
        if (running) return
        setRunning(true)

        for (let n = 3; n > 0; n--) {
            setCountdown(n)
            await sleep(900)
        }
        setCountdown(null)

        const shot = await grabFrame()
        setFlash(true)
        setTimeout(() => setFlash(false), 220)

        if (shot) {
            shotsRef.current.push(shot)
            setTaken(shotsRef.current.length)
        }
        setRunning(false)

        // Jepretan terakhir langsung lanjut ke pencetakan; tidak ada gunanya menahan
        // tamu di layar kamera setelah semua slot terisi.
        if (shotsRef.current.length >= count) {
            await sleep(500)
            stopCamera()
            onDone(shotsRef.current)
        }
    }

    function captureLabel() {
        if (running) return "Bersiap..."
        if (taken === 0) return count > 1 ? `Ambil Foto (1 dari ${count})` : "Ambil Foto"
        return `Foto Lagi (${taken + 1} dari ${count})`
    }

    async function handleFallbackFile(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]
        e.target.value = ""
        if (!file) return

        // imageOrientation "from-image" memastikan foto potret dari HP tidak miring,
        // sama seperti penanganan di lib/compressImage.ts.
        const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" })
        shotsRef.current.push(bitmap)
        setTaken(shotsRef.current.length)

        if (shotsRef.current.length >= count) {
            stopCamera()
            onDone(shotsRef.current)
        }
    }

    const sisa = count - taken

    return (
        <div className="w-full max-w-md mx-auto px-6 py-10 flex flex-col items-center gap-6">
            <button
                onClick={() => { stopCamera(); onCancel() }}
                className="self-start flex items-center gap-2 text-xs tracking-[0.2em] uppercase"
                style={{ color: INK, opacity: 0.6 }}
            >
                <X className="w-4 h-4" /> Batal
            </button>

            <div
                className="relative w-full overflow-hidden rounded-sm bg-black shadow-xl"
                style={{ aspectRatio: aspect }}
            >
                <video
                    ref={videoRef}
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                    style={{ transform: "scaleX(-1)" }}
                />

                {flash && <div className="absolute inset-0 bg-white" />}

                {countdown !== null && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                        <span className="text-8xl font-light text-white drop-shadow-lg">{countdown}</span>
                    </div>
                )}

                {!ready && !error && (
                    <div className="absolute inset-0 flex items-center justify-center px-8 text-center">
                        <p className="text-sm leading-relaxed text-white/70">
                            Nyalakan kamera untuk mulai berpose.
                        </p>
                    </div>
                )}

                {error && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-6 text-center" style={{ backgroundColor: GREEN }}>
                        <p className="text-sm leading-relaxed text-white/90">{error}</p>
                        <p className="text-[11px] leading-relaxed text-white/60">
                            Kalau halaman ini terbuka dari dalam aplikasi WhatsApp atau Instagram,
                            buka lewat menu &ldquo;Buka di Chrome/Safari&rdquo; supaya kamera bisa dipakai.
                        </p>
                    </div>
                )}
            </div>

            <p className="text-xs tracking-[0.25em] uppercase" style={{ color: GOLD }}>
                {taken} dari {count} foto
            </p>

            <div className="w-full space-y-3">
                {!ready || error ? (
                    <button
                        onClick={startCamera}
                        className="w-full py-4 text-xs tracking-[0.25em] uppercase text-white"
                        style={{ backgroundColor: GREEN }}
                    >
                        <Power className="inline w-4 h-4 mr-2" />
                        {error ? "Coba Lagi" : "Nyalakan Kamera"}
                    </button>
                ) : (
                    <button
                        onClick={captureOne}
                        disabled={running}
                        className="w-full py-4 text-xs tracking-[0.25em] uppercase text-white disabled:opacity-40"
                        style={{ backgroundColor: GREEN }}
                    >
                        <Camera className="inline w-4 h-4 mr-2" />
                        {captureLabel()}
                    </button>
                )}

                {error && (
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full py-4 text-xs tracking-[0.25em] uppercase border"
                        style={{ borderColor: GOLD, color: INK }}
                    >
                        <ImageUp className="inline w-4 h-4 mr-2" />
                        Pakai Kamera HP {sisa > 1 ? `(${sisa} foto lagi)` : ""}
                    </button>
                )}
            </div>

            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="user"
                onChange={handleFallbackFile}
                className="hidden"
            />
        </div>
    )
}
