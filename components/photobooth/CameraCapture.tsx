"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Camera, ImageUp, Power, SwitchCamera, X } from "lucide-react"
import { GOLD, GREEN, INK } from "@/lib/photobooth/theme"

const sleep = (ms: number) => new Promise(res => setTimeout(res, ms))

type Facing = "user" | "environment"

const FACING_LABEL: Record<Facing, string> = {
    user: "kamera depan",
    environment: "kamera belakang",
}

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

    const [facing, setFacing] = useState<Facing>("user")
    const [ready, setReady] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [note, setNote] = useState<string | null>(null)
    const [taken, setTaken] = useState(0)
    const [countdown, setCountdown] = useState<number | null>(null)
    const [flash, setFlash] = useState(false)
    const [running, setRunning] = useState(false)
    const [switching, setSwitching] = useState(false)

    // Hanya kamera depan yang dicerminkan, supaya terasa seperti bercermin. Kamera
    // belakang dibiarkan apa adanya — kalau ikut dicerminkan, tulisan apa pun di
    // latar belakang akan terbaca terbalik.
    const mirrored = facing === "user"

    const stopCamera = useCallback(() => {
        streamRef.current?.getTracks().forEach(t => t.stop())
        streamRef.current = null
    }, [])

    // Wajib dimatikan saat pindah layar; kalau tidak, lampu kamera tetap menyala dan
    // baterai HP tamu terkuras.
    useEffect(() => stopCamera, [stopCamera])

    /**
     * @param strict Memaksa sisi kamera yang diminta. Dipakai saat tamu menekan tombol
     *               ganti kamera, supaya perangkat tanpa kamera itu menolak dengan
     *               jelas alih-alih diam-diam memberi kamera yang sama.
     */
    async function openStream(mode: Facing, strict: boolean): Promise<MediaStream> {
        return navigator.mediaDevices.getUserMedia({
            // Dibatasi 1440 supaya HP kelas bawah tidak kehabisan memori saat
            // menggabungkan beberapa jepretan sekaligus.
            video: {
                facingMode: strict ? { exact: mode } : mode,
                width: { ideal: 1440 },
                height: { ideal: 1440 },
            },
            audio: false,
        })
    }

    async function attach(stream: MediaStream) {
        streamRef.current = stream
        if (videoRef.current) {
            videoRef.current.srcObject = stream
            await videoRef.current.play()
        }
        setReady(true)
    }

    // Kamera sengaja dinyalakan lewat tombol, bukan otomatis saat layar terbuka:
    // Safari iOS hanya mengizinkan permintaan kamera yang lahir dari sentuhan user.
    async function startCamera() {
        setError(null)
        setNote(null)

        if (!navigator.mediaDevices?.getUserMedia) {
            setError("Browser ini tidak mengizinkan akses kamera.")
            return
        }

        try {
            await attach(await openStream(facing, false))
        } catch {
            setError("Kamera tidak bisa dibuka. Izinkan akses kamera, atau pakai tombol di bawah.")
        }
    }

    async function switchCamera() {
        if (running || switching) return

        const next: Facing = facing === "user" ? "environment" : "user"
        setSwitching(true)
        setNote(null)

        // Banyak HP tidak bisa membuka dua kamera sekaligus, jadi yang lama dimatikan
        // dulu — dan dinyalakan kembali kalau yang baru ternyata tidak ada.
        stopCamera()

        try {
            await attach(await openStream(next, true))
            setFacing(next)
        } catch {
            setNote(`${FACING_LABEL[next][0].toUpperCase()}${FACING_LABEL[next].slice(1)} tidak tersedia di HP ini.`)
            try {
                await attach(await openStream(facing, false))
            } catch {
                setReady(false)
                setError("Kamera terputus. Nyalakan ulang, ya.")
            }
        } finally {
            setSwitching(false)
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

        // Dicerminkan di sini, bukan saat menyusun polaroid, supaya tiap jepretan
        // membawa sisi kameranya sendiri — tamu boleh berganti kamera di tengah sesi.
        if (mirrored) {
            ctx.translate(canvas.width, 0)
            ctx.scale(-1, 1)
        }
        ctx.drawImage(video, 0, 0)
        return createImageBitmap(canvas)
    }

    /**
     * Satu tekanan tombol = satu jepretan. Bingkai berisi beberapa foto sengaja tidak
     * memotret beruntun sendiri: tamu perlu jeda untuk berganti gaya, dan rentetan
     * otomatis membuat foto kedua dan ketiga tertangkap saat mereka belum siap.
     */
    async function captureOne() {
        if (running || switching) return
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
                    style={{ transform: mirrored ? "scaleX(-1)" : "none" }}
                />

                {flash && <div className="absolute inset-0 bg-white" />}

                {ready && !error && (
                    <button
                        onClick={switchCamera}
                        disabled={running || switching}
                        aria-label="Ganti kamera depan atau belakang"
                        title="Ganti kamera depan/belakang"
                        className="absolute top-3 right-3 p-3 rounded-full bg-black/45 text-white backdrop-blur-sm disabled:opacity-40"
                    >
                        <SwitchCamera className="w-5 h-5" />
                    </button>
                )}

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

            <div className="text-center space-y-1">
                <p className="text-xs tracking-[0.25em] uppercase" style={{ color: GOLD }}>
                    {taken} dari {count} foto
                </p>
                {ready && !error && (
                    <p className="text-[10px] tracking-[0.2em] uppercase" style={{ color: INK, opacity: 0.45 }}>
                        {switching ? "Mengganti kamera..." : `Memakai ${FACING_LABEL[facing]}`}
                    </p>
                )}
                {note && (
                    <p className="text-[11px] leading-relaxed pt-1" style={{ color: INK, opacity: 0.7 }}>
                        {note}
                    </p>
                )}
            </div>

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
                        disabled={running || switching}
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
                capture={facing}
                onChange={handleFallbackFile}
                className="hidden"
            />
        </div>
    )
}
