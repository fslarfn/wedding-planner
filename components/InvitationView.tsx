"use client"

import { useEffect, useRef, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Playfair_Display, Great_Vibes } from "next/font/google"
import { motion, AnimatePresence } from "framer-motion"
import { supabase } from "@/lib/supabase"
import { cn } from "@/lib/utils"
import {
    Heart, MapPin, Calendar, Copy, Check, Send, ChevronDown,
    Instagram, Loader2, PartyPopper, Quote as QuoteIcon, Coffee,
    X, ChevronLeft, ChevronRight, Volume2, VolumeX,
} from "lucide-react"

const playfair = Playfair_Display({ subsets: ["latin"], weight: ["400", "500", "600", "700"] })
const scriptFont = Great_Vibes({ subsets: ["latin"], weight: "400" })

// Palet & mood: krem hangat + hijau tua + aksen emas — terinspirasi gaya
// "luxury botanical" undangan digital, dipadu ornamen & interaksi buatan sendiri
// (bottom nav mengambang, reveal animation, toggle musik) supaya tidak identik.
const INK = "#2B2B26"
const CREAM = "#FBF8F2"
const GREEN = "#24463A"
const GREEN_SOFT = "#EEF2ED"
const GOLD = "#B08D57"

type LoveStoryItem = { date: string; title: string; description: string }
type BankAccount = { bank: string; no_rek: string; atas_nama: string }
type GalleryItem = { id: string; image_url: string; caption: string }
type Rsvp = { id: string; guest_name: string; attendance: string; pax: number; message: string; created_at: string }

function formatTanggalPanjang(dateStr?: string | null) {
    if (!dateStr) return ""
    const d = new Date(dateStr + "T00:00:00")
    return d.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
}

function useCountdown(targetDate?: string | null) {
    const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 })

    useEffect(() => {
        if (!targetDate) return
        const target = new Date(targetDate + "T00:00:00").getTime()

        const tick = () => {
            const diff = Math.max(0, target - Date.now())
            setTimeLeft({
                days: Math.floor(diff / (1000 * 60 * 60 * 24)),
                hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
                minutes: Math.floor((diff / (1000 * 60)) % 60),
                seconds: Math.floor((diff / 1000) % 60),
            })
        }
        tick()
        const interval = setInterval(tick, 1000)
        return () => clearInterval(interval)
    }, [targetDate])

    return timeLeft
}

function addToCalendarLink(dateStr: string, title: string, details: string) {
    const start = dateStr.replace(/-/g, "")
    const end = new Date(new Date(dateStr + "T00:00:00").getTime() + 86400000).toISOString().slice(0, 10).replace(/-/g, "")
    const url = new URL("https://calendar.google.com/calendar/render")
    url.searchParams.set("action", "TEMPLATE")
    url.searchParams.set("text", title)
    url.searchParams.set("dates", `${start}/${end}`)
    url.searchParams.set("details", details)
    return url.toString()
}

// Variasi arah reveal saat elemen discroll — meniru gaya "inv-kiri/kanan/atas/zoom/fade"
// pada referensi, dipadu dengan framer-motion (bukan sekadar fade-up seragam).
type RevealDirection = "up" | "left" | "right" | "zoom" | "fade"

const REVEAL_VARIANTS: Record<RevealDirection, { initial: Record<string, number>; animate: Record<string, number> }> = {
    up: { initial: { opacity: 0, y: 32 }, animate: { opacity: 1, y: 0 } },
    left: { initial: { opacity: 0, x: -48 }, animate: { opacity: 1, x: 0 } },
    right: { initial: { opacity: 0, x: 48 }, animate: { opacity: 1, x: 0 } },
    zoom: { initial: { opacity: 0, scale: 0.85 }, animate: { opacity: 1, scale: 1 } },
    fade: { initial: { opacity: 0 }, animate: { opacity: 1 } },
}

function Reveal({
    children, className, style, direction = "up", delay = 0,
}: {
    children: React.ReactNode
    className?: string
    style?: React.CSSProperties
    direction?: RevealDirection
    delay?: number
}) {
    const variant = REVEAL_VARIANTS[direction]
    return (
        <motion.div
            initial={variant.initial}
            whileInView={variant.animate}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay }}
            className={className}
            style={style}
        >
            {children}
        </motion.div>
    )
}

function CornerOrnament({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 120 120" className={className} aria-hidden>
            <path d="M4 4 C 40 4, 4 40, 4 4 Z" fill="none" />
            <path d="M6 60 C 6 30 30 6 60 6" stroke={GOLD} strokeWidth="1" fill="none" opacity="0.55" />
            <path d="M6 44 C 6 24 24 6 44 6" stroke={GOLD} strokeWidth="1" fill="none" opacity="0.4" />
            <circle cx="6" cy="6" r="2.5" fill={GOLD} opacity="0.6" />
        </svg>
    )
}

export default function InvitationView() {
    const searchParams = useSearchParams()
    const guestName = searchParams.get("to") || ""

    const [settings, setSettings] = useState<any>(null)
    const [gallery, setGallery] = useState<GalleryItem[]>([])
    const [wishes, setWishes] = useState<Rsvp[]>([])
    const [loading, setLoading] = useState(true)
    const [isOpened, setIsOpened] = useState(false)
    const [copiedIdx, setCopiedIdx] = useState<number | null>(null)
    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
    const [musicPlaying, setMusicPlaying] = useState(false)
    const audioRef = useRef<HTMLAudioElement>(null)

    // RSVP Form
    const [form, setForm] = useState({ guest_name: guestName, attendance: "Hadir", pax: "1", message: "" })
    const [submitting, setSubmitting] = useState(false)
    const [submitted, setSubmitted] = useState(false)
    const [nextEventDate, setNextEventDate] = useState<string | null>(null)

    useEffect(() => {
        fetchData()
    }, [])

    useEffect(() => {
        setForm(f => ({ ...f, guest_name: guestName || f.guest_name }))
    }, [guestName])

    useEffect(() => {
        if (!settings) return
        const dates = [settings.akad_date, settings.resepsi_date].filter(Boolean) as string[]
        const future = dates.filter(d => new Date(d + "T00:00:00").getTime() >= Date.now())
        setNextEventDate((future.length > 0 ? future.sort()[0] : dates.sort()[0]) || null)
    }, [settings])

    async function fetchData() {
        setLoading(true)
        const [{ data: settingsData }, { data: galleryData }, { data: wishesData }] = await Promise.all([
            supabase.from('invitation_settings').select('*').order('updated_at', { ascending: true }).limit(1).maybeSingle(),
            supabase.from('invitation_gallery').select('*').order('sort_order', { ascending: true }),
            supabase.from('invitation_rsvp').select('*').order('created_at', { ascending: false }).limit(100),
        ])
        setSettings(settingsData)
        if (galleryData) setGallery(galleryData)
        if (wishesData) setWishes(wishesData)
        setLoading(false)
    }

    const countdown = useCountdown(nextEventDate)

    function handleOpen() {
        setIsOpened(true)
        if (audioRef.current) {
            audioRef.current.play().then(() => setMusicPlaying(true)).catch(() => setMusicPlaying(false))
        }
    }

    function toggleMusic() {
        if (!audioRef.current) return
        if (musicPlaying) {
            audioRef.current.pause()
            setMusicPlaying(false)
        } else {
            audioRef.current.play().then(() => setMusicPlaying(true)).catch(() => { })
        }
    }

    async function handleSubmitRsvp(e: React.FormEvent) {
        e.preventDefault()
        if (!form.guest_name.trim()) return
        setSubmitting(true)
        const { data } = await supabase.from('invitation_rsvp').insert([{
            guest_name: form.guest_name.trim(),
            attendance: form.attendance,
            pax: parseInt(form.pax) || 1,
            message: form.message.trim(),
        }]).select().single()

        if (data) setWishes(prev => [data, ...prev])
        setSubmitted(true)
        setForm(f => ({ ...f, message: "" }))
        setSubmitting(false)
    }

    function copyAccount(text: string, idx: number) {
        navigator.clipboard.writeText(text)
        setCopiedIdx(idx)
        setTimeout(() => setCopiedIdx(null), 2000)
    }

    if (loading) {
        return (
            <div className="h-dvh w-full flex items-center justify-center" style={{ color: GREEN }}>
                <Loader2 className="w-8 h-8 animate-spin" />
            </div>
        )
    }

    const groomNick = settings?.groom_nickname || settings?.groom_name || "Mempelai Pria"
    const brideNick = settings?.bride_nickname || settings?.bride_name || "Mempelai Wanita"

    return (
        <div className={cn("min-h-dvh w-full", playfair.className)} style={{ backgroundColor: CREAM, color: INK }}>

            {settings?.music_url && <audio ref={audioRef} src={settings.music_url} loop />}

            {/* ============ COVER / OPENING GATE ============ */}
            <AnimatePresence>
                {!isOpened && (
                    <motion.div
                        key="cover"
                        className="fixed inset-0 z-50"
                        exit={{ opacity: 0, transition: { duration: 0.9, ease: "easeInOut" } }}
                    >
                        {settings?.cover_photo_url ? (
                            <motion.img
                                src={settings.cover_photo_url}
                                alt=""
                                className="absolute inset-0 w-full h-full object-cover"
                                initial={{ scale: 1 }}
                                exit={{ scale: 1.08, transition: { duration: 1.1, ease: "easeInOut" } }}
                            />
                        ) : (
                            <div className="absolute inset-0" style={{ backgroundImage: `linear-gradient(160deg, ${GREEN}, #12241d)` }} />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-l from-black/75 via-black/25 to-transparent" />

                        <div className="relative z-10 h-full w-full flex flex-col md:flex-row">
                            <div className="flex-1" />

                            <motion.div
                                className="relative flex-none md:flex-1 flex flex-col items-center justify-center text-center text-white px-8 py-10 md:px-14 overflow-y-auto"
                                exit={{ opacity: 0, y: -24, transition: { duration: 0.6, ease: "easeIn" } }}
                            >
                                <CornerOrnament className="absolute top-5 left-5 w-12 h-12 opacity-60" />
                                <CornerOrnament className="absolute top-5 right-5 w-12 h-12 rotate-90 opacity-60" />

                                <Reveal direction="fade">
                                    <p className="uppercase tracking-[0.3em] text-[11px] text-white/70 mb-3">The Wedding Of</p>
                                </Reveal>
                                <Reveal direction="zoom" delay={0.15}>
                                    <h1 className="text-3xl md:text-4xl tracking-wide">{brideNick} &amp; {groomNick}</h1>
                                </Reveal>
                                {nextEventDate && <p className="mt-2 text-white/70 text-xs tracking-widest">{formatTanggalPanjang(nextEventDate)}</p>}

                                {guestName && (
                                    <div className="mt-6 text-sm text-white/80">
                                        Kepada Yth. Bapak/Ibu/Saudara/i<br />
                                        <span className="font-semibold text-white text-base">{guestName}</span>
                                    </div>
                                )}
                                <p className="mt-3 text-[11px] italic text-white/40 max-w-[240px] font-sans">
                                    *Mohon maaf apabila ada kesalahan penulisan nama/gelar.
                                </p>

                                <motion.button
                                    onClick={handleOpen}
                                    whileTap={{ scale: 0.92 }}
                                    className="mt-7 inline-flex items-center gap-2 text-white px-7 py-3 rounded-full font-medium shadow-lg transition-transform hover:scale-105 border"
                                    style={{ backgroundColor: "rgba(255,255,255,0.12)", borderColor: GOLD }}
                                >
                                    <Heart className="w-4 h-4" style={{ color: GOLD }} /> Buka Undangan
                                </motion.button>
                            </motion.div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ============ MAIN CONTENT ============ */}
            <div className={cn("transition-opacity duration-700 delay-200", isOpened ? "opacity-100" : "opacity-0 pointer-events-none")}>

                {/* HERO (+ Countdown menyatu di foto yang sama, full layar) */}
                <section id="beranda" className="relative min-h-dvh flex flex-col">
                    {settings?.hero_photo_url ? (
                        <img src={settings.hero_photo_url} alt="" className="absolute inset-0 w-full h-full object-cover" />
                    ) : (
                        <div className="absolute inset-0" style={{ backgroundImage: `linear-gradient(160deg, ${GREEN}, #12241d)` }} />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />

                    <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center text-white px-8 py-10">
                        <p className="uppercase tracking-[0.3em] text-[11px] text-white/70 mb-4"></p>
                        <h1 className="text-4xl md:text-5xl">{brideNick} &amp; {groomNick}</h1>
                        {nextEventDate && <p className="mt-4 text-white/85 text-sm tracking-wide">{formatTanggalPanjang(nextEventDate)}</p>}
                    </div>

                    {nextEventDate && (
                        <Reveal className="relative z-10 px-8 pb-10 text-center text-white">
                            <p className="uppercase tracking-[0.3em] text-[11px] mb-1" style={{ color: GOLD }}>Save The Date</p>
                            <h2 className="text-xl mb-4">Menuju Hari Bahagia</h2>
                            <div className="flex justify-center gap-2.5">
                                {[
                                    { label: "Hari", value: countdown.days },
                                    { label: "Jam", value: countdown.hours },
                                    { label: "Menit", value: countdown.minutes },
                                    { label: "Detik", value: countdown.seconds },
                                ].map((item, i) => (
                                    <Reveal key={item.label} direction="zoom" delay={i * 0.08} className="rounded-xl px-3 py-2.5 w-16 backdrop-blur-sm" style={{ backgroundColor: "rgba(255,255,255,0.15)" }}>
                                        <div className="text-2xl font-semibold text-white">{item.value}</div>
                                        <div className="text-[9px] uppercase tracking-wide mt-1 text-white/70">{item.label}</div>
                                    </Reveal>
                                ))}
                            </div>
                        </Reveal>
                    )}

                    <ChevronDown className="relative z-10 w-5 h-5 mx-auto mb-6 animate-bounce text-white/60" />
                </section>

                {/* QUOTE */}
                {settings?.quote_text && (
                    <section className={cn(
                        "relative min-h-dvh flex px-8 pb-14 text-center overflow-hidden",
                        settings?.quote_image_url ? "items-start pt-20 md:pt-24" : "items-center py-14"
                    )}>
                        {settings?.quote_image_url ? (
                            <>
                                <img src={settings.quote_image_url} alt="" className="absolute inset-0 w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/25" />
                            </>
                        ) : (
                            <div className="absolute inset-0" style={{ backgroundColor: GREEN_SOFT }} />
                        )}
                        <Reveal
                            className={cn(
                                "relative z-10 max-w-xl mx-auto",
                                settings?.quote_image_url && "rounded-2xl px-6 py-8 backdrop-blur-md"
                            )}
                            style={settings?.quote_image_url ? { backgroundColor: "rgba(20,20,18,0.45)" } : undefined}
                        >
                            <QuoteIcon className="w-8 h-8 mx-auto mb-6" style={{ color: GOLD }} />
                            <p className={cn(
                                "text-lg md:text-xl leading-relaxed italic",
                                settings?.quote_image_url ? "text-white" : "opacity-80"
                            )}>
                                {settings.quote_text}
                            </p>
                        </Reveal>
                    </section>
                )}

                {/* COUPLE PROFILE */}
                <div className="px-8 py-10">
                    <div className="max-w-xl mx-auto grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] md:items-center gap-10 text-center">
                        <Reveal direction="left">
                            <CoupleCard
                                photoUrl={settings?.bride_closeup_url}
                                name={settings?.bride_name}
                                nickname={settings?.bride_nickname}
                                parents={settings?.bride_parents}
                                childOrder={settings?.bride_child_order}
                                childLabel="Putri"
                                instagram={settings?.bride_instagram}
                                role="The Bride"
                            />
                        </Reveal>
                        <Reveal direction="zoom" delay={0.2} className="flex justify-center">
                            <Heart className="w-5 h-5" style={{ color: GOLD }} />
                        </Reveal>
                        <Reveal direction="right">
                            <CoupleCard
                                photoUrl={settings?.groom_closeup_url}
                                name={settings?.groom_name}
                                nickname={settings?.groom_nickname}
                                parents={settings?.groom_parents}
                                childOrder={settings?.groom_child_order}
                                childLabel="Putra"
                                instagram={settings?.groom_instagram}
                                role="The Groom"
                            />
                        </Reveal>
                    </div>
                </div>

                {/* LOVE STORY */}
                {settings?.love_story?.length > 0 && (
                    <section id="cerita" className="px-8 py-14" style={{ backgroundColor: GREEN_SOFT }}>
                        <div className="max-w-xl mx-auto">
                            <Reveal>
                                <p className="uppercase tracking-[0.3em] text-[18px] text-center mb-1" style={{ color: GOLD }}>Our Journey</p>
                                <h2 className="text-center text-2xl mb-10"></h2>
                            </Reveal>
                            <div className="space-y-10 relative before:absolute before:left-[8px] before:top-2 before:bottom-2 before:w-px before:bg-[#B08D57] before:opacity-30">
                                {settings.love_story.map((item: LoveStoryItem, idx: number) => (
                                    <Reveal key={idx} direction={idx % 2 === 0 ? "right" : "left"} className="relative pl-9">
                                        <span className="absolute left-0 top-2 w-4 h-4 rounded-full ring-4" style={{ backgroundColor: GOLD, ["--tw-ring-color" as any]: GREEN_SOFT }} />
                                        <p className="text-sm font-bold uppercase tracking-wide" style={{ color: GOLD }}>{item.date}</p>
                                        <h3 className="text-2xl md:text-3xl mt-1.5">{item.title}</h3>
                                        <p className="text-base opacity-70 mt-3 leading-relaxed font-sans">{item.description}</p>
                                    </Reveal>
                                ))}
                            </div>

                            {/* BONUS: MINI GAME */}
                            <Reveal direction="zoom" className="mt-14 text-center">
                                <p className="uppercase tracking-[0.3em] text-[11px] mb-1" style={{ color: GOLD }}>Bonus</p>
                                <h3 className="text-xl mb-2">Mainkan Kisah Cinta Kami</h3>
                                <p className="text-sm opacity-60 mb-6 font-sans">
                                    Bantu Faisal menempuh perjalanan menuju Ditta lewat game kecil ini
                                </p>
                                <div
                                    className="mx-auto rounded-xl overflow-hidden shadow-lg border"
                                    style={{ borderColor: "#00000012", maxWidth: 350 }}
                                >
                                    <iframe
                                        src="/petualangan-cinta.html"
                                        title="Petualangan Cinta — Ditta & Faisal"
                                        className="w-full"
                                        style={{ height: 440, border: 0, display: "block" }}
                                        loading="lazy"
                                    />
                                </div>
                            </Reveal>
                        </div>
                    </section>
                )}

                {/* EVENTS */}
                <section id="acara" className="px-8 py-14">
                    <div className="max-w-xl mx-auto">
                        <Reveal>
                            <p className="uppercase tracking-[0.3em] text-[11px] text-center mb-1" style={{ color: GOLD }}>Akad &amp; Resepsi</p>
                            <h2 className="text-center text-2xl mb-10">Jadwal Acara</h2>
                        </Reveal>
                        <div className="space-y-5 md:grid md:grid-cols-2 md:gap-5 md:space-y-0">
                            {settings?.akad_date && (
                                <Reveal>
                                    <EventCard
                                        title="Akad Nikah"
                                        date={settings.akad_date}
                                        time={settings.akad_time}
                                        venue={settings.akad_venue}
                                        address={settings.akad_address}
                                        mapsUrl={settings.akad_maps_url}
                                        onAddCalendar={() => window.open(addToCalendarLink(settings.akad_date, `Akad Nikah ${brideNick} & ${groomNick}`, settings.akad_venue || ""), "_blank")}
                                    />
                                </Reveal>
                            )}
                            {settings?.resepsi_date && (
                                <Reveal>
                                    <EventCard
                                        title="Resepsi"
                                        date={settings.resepsi_date}
                                        time={settings.resepsi_time}
                                        venue={settings.resepsi_venue}
                                        address={settings.resepsi_address}
                                        mapsUrl={settings.resepsi_maps_url}
                                        onAddCalendar={() => window.open(addToCalendarLink(settings.resepsi_date, `Resepsi ${brideNick} & ${groomNick}`, settings.resepsi_venue || ""), "_blank")}
                                    />
                                </Reveal>
                            )}
                            {!settings?.akad_date && !settings?.resepsi_date && (
                                <p className="text-center opacity-50 font-sans text-sm md:col-span-2">Jadwal acara akan segera diumumkan.</p>
                            )}
                        </div>
                    </div>
                </section>

                {/* GALLERY */}
                {gallery.length > 0 && (
                    <section id="galeri" className="px-8 py-14" style={{ backgroundColor: GREEN_SOFT }}>
                        <div className="max-w-2xl mx-auto">
                            <Reveal>
                                <p className="uppercase tracking-[0.3em] text-[11px] text-center mb-1" style={{ color: GOLD }}>Moments</p>
                                <h2 className="text-center text-2xl mb-2">Galeri</h2>
                                <p className="text-center opacity-50 text-xs mb-10 font-sans">Ketuk foto untuk memperbesar</p>
                            </Reveal>
                            <div className="grid grid-cols-3 auto-rows-[100px] sm:auto-rows-[120px] md:auto-rows-[150px] gap-2">
                                {gallery.map((item, idx) => (
                                    <Reveal
                                        key={item.id}
                                        direction="zoom"
                                        delay={Math.min(idx * 0.05, 0.3)}
                                        className={cn(idx % 5 === 0 ? "col-span-2 row-span-2" : "col-span-1 row-span-1")}
                                    >
                                        <button
                                            onClick={() => setLightboxIndex(idx)}
                                            className="relative block w-full h-full overflow-hidden rounded-lg group"
                                        >
                                            <img
                                                src={item.image_url}
                                                alt={item.caption || "Galeri"}
                                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                            {item.caption && (
                                                <span className="absolute bottom-1.5 left-2 right-2 text-[10px] text-white opacity-0 group-hover:opacity-100 transition-opacity line-clamp-1 text-left font-sans">
                                                    {item.caption}
                                                </span>
                                            )}
                                        </button>
                                    </Reveal>
                                ))}
                            </div>
                        </div>
                    </section>
                )}

                {/* GIFT / AMPLOP DIGITAL */}
                {settings?.bank_accounts?.length > 0 && (
                    <section id="amplop" className="px-8 py-14">
                        <div className="max-w-xl mx-auto">
                            <Reveal>
                                <p className="uppercase tracking-[0.3em] text-[11px] text-center mb-1" style={{ color: GOLD }}>Wedding Gift</p>
                                <h2 className="text-center text-2xl mb-2">Amplop Digital</h2>
                                <p className="text-center opacity-60 text-sm mb-8 font-sans">
                                    Doa restu Anda adalah karunia terindah. Jika ingin memberi tanda kasih, kami sediakan sarana berikut.
                                </p>
                            </Reveal>
                            <div className="space-y-3">
                                {settings.bank_accounts.map((acc: BankAccount, idx: number) => (
                                    <Reveal key={idx} className="rounded-xl border p-5 flex items-center justify-between font-sans" style={{ borderColor: "#00000012" }}>
                                        <div>
                                            <p className="text-xs uppercase tracking-wide font-bold" style={{ color: GOLD }}>{acc.bank}</p>
                                            <p className="font-mono text-lg mt-1">{acc.no_rek}</p>
                                            <p className="text-xs opacity-50 mt-0.5">a.n. {acc.atas_nama}</p>
                                        </div>
                                        <button
                                            onClick={() => copyAccount(acc.no_rek, idx)}
                                            className="p-2.5 rounded-full transition-colors"
                                            style={{ backgroundColor: GREEN_SOFT }}
                                        >
                                            {copiedIdx === idx ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" style={{ color: GREEN }} />}
                                        </button>
                                    </Reveal>
                                ))}
                            </div>
                        </div>
                    </section>
                )}

                {/* RSVP */}
                <section id="rsvp" className="px-8 py-14 font-sans" style={{ backgroundColor: GREEN_SOFT }}>
                    <div className="max-w-xl mx-auto">
                        <Reveal>
                            <p className="uppercase tracking-[0.3em] text-[11px] text-center mb-1" style={{ color: GOLD }}>Confirmation</p>
                            <h2 className={cn("text-center text-2xl mb-2", playfair.className)}>RSVP &amp; Ucapan</h2>
                            <p className="text-center opacity-60 text-sm mb-8">
                                Mohon konfirmasi kehadiran Anda dan tinggalkan doa terbaik untuk kami.
                            </p>
                        </Reveal>

                        {submitted ? (
                            <div className="text-center bg-white/70 border rounded-xl p-8" style={{ borderColor: "#00000010" }}>
                                <PartyPopper className="w-8 h-8 mx-auto mb-3" style={{ color: GREEN }} />
                                <p className="font-medium" style={{ color: GREEN }}>Terima kasih atas konfirmasi dan doanya!</p>
                                <button onClick={() => setSubmitted(false)} className="text-xs underline mt-3 opacity-60">Kirim ucapan lain</button>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmitRsvp} className="space-y-3 bg-white rounded-xl p-5 border" style={{ borderColor: "#00000010" }}>
                                <input
                                    required
                                    className="w-full h-11 rounded-md border px-3 text-sm focus:outline-none"
                                    style={{ borderColor: "#00000018" }}
                                    placeholder="Nama Anda"
                                    value={form.guest_name}
                                    onChange={e => setForm({ ...form, guest_name: e.target.value })}
                                />
                                <div className="grid grid-cols-2 gap-3">
                                    <select
                                        className="h-11 rounded-md border px-3 text-sm"
                                        style={{ borderColor: "#00000018" }}
                                        value={form.attendance}
                                        onChange={e => setForm({ ...form, attendance: e.target.value })}
                                    >
                                        <option value="Hadir">Hadir</option>
                                        <option value="Tidak Hadir">Tidak Hadir</option>
                                        <option value="Ragu-ragu">Ragu-ragu</option>
                                    </select>
                                    <input
                                        type="number"
                                        min={1}
                                        className="h-11 rounded-md border px-3 text-sm"
                                        style={{ borderColor: "#00000018" }}
                                        placeholder="Jumlah tamu"
                                        value={form.pax}
                                        onChange={e => setForm({ ...form, pax: e.target.value })}
                                    />
                                </div>
                                <textarea
                                    className="w-full rounded-md border px-3 py-2 text-sm min-h-[90px]"
                                    style={{ borderColor: "#00000018" }}
                                    placeholder="Tulis ucapan dan doa untuk kami..."
                                    value={form.message}
                                    onChange={e => setForm({ ...form, message: e.target.value })}
                                />
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="w-full h-11 rounded-md text-white font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                                    style={{ backgroundColor: GREEN }}
                                >
                                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                    Kirim
                                </button>
                            </form>
                        )}

                        {/* Wishes List */}
                        <div className="mt-6 space-y-3 max-h-96 overflow-y-auto pr-1">
                            {wishes.map(w => (
                                <div key={w.id} className="bg-white border rounded-lg p-4" style={{ borderColor: "#00000010" }}>
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="font-semibold text-sm">{w.guest_name}</span>
                                        <span className={cn(
                                            "text-[10px] font-bold uppercase px-2 py-0.5 rounded-full",
                                            w.attendance === "Hadir" ? "bg-green-50 text-green-600" :
                                                w.attendance === "Tidak Hadir" ? "bg-red-50 text-red-500" : "bg-amber-50 text-amber-600"
                                        )}>
                                            {w.attendance}
                                        </span>
                                    </div>
                                    {w.message && <p className="text-sm opacity-70">{w.message}</p>}
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* CLOSING / TERIMA KASIH */}
                <section className="relative min-h-dvh flex items-center justify-center px-8 py-16 text-center overflow-hidden text-white">
                    {settings?.closing_photo_url ? (
                        <img src={settings.closing_photo_url} alt="" className="absolute inset-0 w-full h-full object-cover" />
                    ) : (
                        <div className="absolute inset-0" style={{ backgroundImage: `linear-gradient(160deg, ${GREEN}, #12241d)` }} />
                    )}
                    <div className="absolute inset-0 bg-black/45" />

                    <Reveal className="relative z-10 max-w-md mx-auto">
                        <p className={cn("text-5xl md:text-6xl mb-6", scriptFont.className)}>Terima Kasih</p>
                        <p className="text-sm leading-relaxed text-white/90 font-sans">
                            Merupakan suatu kebahagiaan dan kehormatan bagi kami, apabila Bapak/Ibu/Saudara/i,
                            berkenan hadir dan memberikan do&apos;a restu kepada kami.
                        </p>
                        <p className="text-sm font-bold text-white mt-5 mb-8 font-sans">
                            Wassalamu&apos;alaikum warahmatullahi wabarakatuh
                        </p>

                        <p className="uppercase tracking-[0.3em] text-[11px] text-white/70 mb-2 font-sans">Kami yang Berbahagia</p>
                        <p className="text-3xl italic">{brideNick} &amp; {groomNick}</p>
                    </Reveal>
                </section>

                {/* FOOTER */}
                <footer className="px-8 py-6 text-center font-sans" style={{ backgroundColor: "#12241d" }}>
                    <p className="text-xs text-white/50 flex items-center justify-center gap-1.5 flex-wrap">
                        <Coffee className="w-3.5 h-3.5" style={{ color: GOLD }} />
                        Undangan online ini dibuat oleh kami berdua, dengan penuh suka cita, di Stuja Coffee.
                    </p>
                </footer>
            </div>

            {/* MUSIC TOGGLE */}
            {isOpened && settings?.music_url && (
                <button
                    onClick={toggleMusic}
                    className="fixed top-[calc(1.25rem+env(safe-area-inset-top))] right-5 z-40 w-10 h-10 rounded-full flex items-center justify-center shadow-lg text-white"
                    style={{ backgroundColor: GREEN }}
                    title={musicPlaying ? "Matikan musik" : "Putar musik"}
                >
                    <div className={cn(musicPlaying && "animate-spin")} style={{ animationDuration: "6s" }}>
                        {musicPlaying ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                    </div>
                </button>
            )}

            {/* GALLERY LIGHTBOX */}
            <AnimatePresence>
                {lightboxIndex !== null && gallery.length > 0 && (
                    <motion.div
                        key="lightbox"
                        className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setLightboxIndex(null)}
                    >
                        <button
                            onClick={() => setLightboxIndex(null)}
                            className="absolute top-5 right-5 text-white/70 hover:text-white p-2"
                        >
                            <X className="w-6 h-6" />
                        </button>

                        {gallery.length > 1 && (
                            <button
                                onClick={(e) => { e.stopPropagation(); setLightboxIndex(i => (i! - 1 + gallery.length) % gallery.length) }}
                                className="absolute left-2 md:left-6 text-white/60 hover:text-white p-2"
                            >
                                <ChevronLeft className="w-8 h-8" />
                            </button>
                        )}

                        <motion.div
                            key={lightboxIndex}
                            initial={{ opacity: 0, scale: 0.94 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.94 }}
                            transition={{ duration: 0.25 }}
                            className="max-w-lg w-full"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <img
                                src={gallery[lightboxIndex].image_url}
                                alt={gallery[lightboxIndex].caption || ""}
                                className="w-full max-h-[75vh] object-contain rounded-lg"
                            />
                            {gallery[lightboxIndex].caption && (
                                <p className="text-center text-white/80 text-sm mt-3 font-sans">{gallery[lightboxIndex].caption}</p>
                            )}
                        </motion.div>

                        {gallery.length > 1 && (
                            <button
                                onClick={(e) => { e.stopPropagation(); setLightboxIndex(i => (i! + 1) % gallery.length) }}
                                className="absolute right-2 md:right-6 text-white/60 hover:text-white p-2"
                            >
                                <ChevronRight className="w-8 h-8" />
                            </button>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

function CloseupPhoto({ src, className }: { src: string; className?: string }) {
    return (
        <div className={cn("w-24 h-24 md:w-28 md:h-28 rounded-full overflow-hidden border-2 shadow-lg mx-auto", className)} style={{ borderColor: GOLD }}>
            <img src={src} alt="" className="w-full h-full object-cover" />
        </div>
    )
}

function CoupleCard({
    photoUrl, name, nickname, parents, childOrder, childLabel, instagram, role,
}: {
    photoUrl?: string; name?: string; nickname?: string; parents?: string
    childOrder?: string; childLabel: "Putri" | "Putra"; instagram?: string; role: string
}) {
    return (
        <div>
            {photoUrl && <CloseupPhoto src={photoUrl} className="mb-4" />}
            <p className="uppercase tracking-[0.3em] text-[10px] mb-2 font-sans" style={{ color: GOLD }}>{role}</p>
            <h3 className="text-2xl">{name || "-"}</h3>
            {nickname && nickname !== name && <p className="text-sm mt-0.5 font-sans" style={{ color: GOLD }}>&ldquo;{nickname}&rdquo;</p>}
            {parents && (
                <p className="text-sm opacity-60 mt-3 font-sans">
                    {childLabel}{childOrder ? ` ${childOrder}` : ""} dari<br />
                    {parents}
                </p>
            )}
            {instagram && (
                <a
                    href={`https://instagram.com/${instagram}`}
                    target="_blank"
                    className="inline-flex items-center gap-1.5 mt-3 text-xs opacity-50 hover:opacity-100 transition-opacity font-sans"
                >
                    <Instagram className="w-3.5 h-3.5" /> @{instagram}
                </a>
            )}
        </div>
    )
}

function EventCard({
    title, date, time, venue, address, mapsUrl, onAddCalendar,
}: {
    title: string; date: string; time?: string; venue?: string; address?: string; mapsUrl?: string; onAddCalendar: () => void
}) {
    return (
        <div className="rounded-xl border p-6 text-center font-sans" style={{ borderColor: "#00000012" }}>
            <p className={cn("text-xl mb-2", playfair.className)}>{title}</p>
            <p className="text-sm opacity-60">{formatTanggalPanjang(date)}</p>
            {time && <p className="text-sm opacity-60">{time}</p>}
            {venue && <p className="font-medium mt-3">{venue}</p>}
            {address && <p className="text-xs opacity-50 mt-1">{address}</p>}

            <div className="flex gap-2 mt-4 justify-center">
                {mapsUrl && (
                    <a href={mapsUrl} target="_blank" className="inline-flex items-center gap-1.5 text-xs px-3 py-2 rounded-full transition-colors" style={{ backgroundColor: GREEN_SOFT, color: GREEN }}>
                        <MapPin className="w-3.5 h-3.5" /> Lihat Peta
                    </a>
                )}
                <button onClick={onAddCalendar} className="inline-flex items-center gap-1.5 text-xs px-3 py-2 rounded-full transition-colors" style={{ backgroundColor: GREEN_SOFT, color: GREEN }}>
                    <Calendar className="w-3.5 h-3.5" /> Simpan Tanggal
                </button>
            </div>
        </div>
    )
}
