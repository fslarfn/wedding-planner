"use client"

import { useCallback, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { fetchMemories, formatStamp, type Memory } from "@/lib/photobooth/storage"
import {
    Camera, Check, Copy, Download, Eye, EyeOff, KeyRound, Loader2, QrCode, Trash2,
} from "lucide-react"

// Kunci admin disimpan di browser pengelola, bukan di bundle aplikasi, supaya tamu
// tidak bisa memanggil endpoint hapus. Nilainya harus sama dengan PHOTOBOOTH_ADMIN_KEY
// di Environment Variables.
const KEY_STORAGE = "photobooth_admin_key"

const KEY_REJECTED =
    "Kunci admin ditolak. Daftar di bawah hanya menampilkan kenangan yang terlihat tamu."

type AdminMemory = Memory & { is_hidden: boolean }
type LoadResult = { items: AdminMemory[]; key: string | null; error: string | null }

/** Daftar publik lewat anon key: hanya kenangan yang tidak disembunyikan. */
async function publicList(): Promise<AdminMemory[]> {
    try {
        const items = await fetchMemories(200)
        return items.map(m => ({ ...m, is_hidden: false }))
    } catch {
        return []
    }
}

/**
 * Dengan kunci admin, daftar penuh diambil lewat service role di server. Tanpa kunci
 * — atau kalau kuncinya ditolak — halaman tetap berguna dengan daftar publik.
 */
async function loadMemories(key: string | null): Promise<LoadResult> {
    if (!key) return { items: await publicList(), key: null, error: null }

    const res = await fetch("/api/photobooth", { headers: { "x-photobooth-key": key } })
    if (res.ok) {
        const json = await res.json()
        return { items: json.items as AdminMemory[], key, error: null }
    }

    localStorage.removeItem(KEY_STORAGE)
    return { items: await publicList(), key: null, error: KEY_REJECTED }
}

export default function PhotoboothAdmin({ link }: { link: string }) {
    const [items, setItems] = useState<AdminMemory[]>([])
    const [loading, setLoading] = useState(true)
    const [adminKey, setAdminKey] = useState<string | null>(null)
    const [keyError, setKeyError] = useState<string | null>(null)
    const [busyId, setBusyId] = useState<string | null>(null)
    const [copied, setCopied] = useState(false)

    const apply = useCallback((result: LoadResult) => {
        setItems(result.items)
        setAdminKey(result.key)
        setKeyError(result.error)
        setLoading(false)
    }, [])

    useEffect(() => {
        let active = true
        void (async () => {
            const result = await loadMemories(localStorage.getItem(KEY_STORAGE))
            if (active) apply(result)
        })()
        return () => { active = false }
    }, [apply])

    async function askKey() {
        const value = window.prompt("Masukkan kunci admin photobooth (PHOTOBOOTH_ADMIN_KEY):")
        if (!value) return
        localStorage.setItem(KEY_STORAGE, value)
        setLoading(true)
        apply(await loadMemories(value))
    }

    async function toggleHidden(item: AdminMemory) {
        if (!adminKey) return askKey()

        setBusyId(item.id)
        const res = await fetch(`/api/photobooth/${item.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json", "x-photobooth-key": adminKey },
            body: JSON.stringify({ is_hidden: !item.is_hidden }),
        })
        setBusyId(null)

        if (res.ok) {
            setItems(prev => prev.map(m => (m.id === item.id ? { ...m, is_hidden: !m.is_hidden } : m)))
        }
    }

    async function remove(item: AdminMemory) {
        if (!adminKey) return askKey()
        if (!confirm(`Hapus permanen kenangan dari ${item.guest_name}?`)) return

        setBusyId(item.id)
        const res = await fetch(`/api/photobooth/${item.id}`, {
            method: "DELETE",
            headers: { "x-photobooth-key": adminKey },
        })
        setBusyId(null)

        if (res.ok) setItems(prev => prev.filter(m => m.id !== item.id))
    }

    async function copyLink() {
        await navigator.clipboard.writeText(link)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <div className="space-y-6 pb-20">
            <div>
                <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
                    <Camera className="w-8 h-8 text-pink-500" /> Photobooth Digital
                </h1>
                <p className="text-slate-500">
                    Cetak QR-nya, sebar di venue, lalu kumpulan kenangan tamu muncul di sini.
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <QrCode className="w-5 h-5 text-pink-500" /> QR Code untuk Venue
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col md:flex-row gap-6 items-center md:items-start">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src="/api/photobooth/qr?size=600"
                        alt="QR code photobooth"
                        className="w-48 h-48 border border-slate-200 rounded-lg bg-white"
                    />

                    <div className="flex-1 space-y-4 w-full">
                        <div>
                            <p className="text-xs font-semibold text-slate-500 mb-1">Alamat halaman tamu</p>
                            <div className="flex gap-2">
                                <code className="flex-1 text-xs bg-slate-100 rounded px-3 py-2 truncate">{link}</code>
                                <Button variant="outline" size="sm" onClick={copyLink}>
                                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                </Button>
                            </div>
                        </div>

                        <a href="/api/photobooth/qr?size=2048" download="qr-photobooth.png">
                            <Button className="bg-pink-600 hover:bg-pink-700 text-white">
                                <Download className="w-4 h-4 mr-2" /> Unduh QR Resolusi Cetak
                            </Button>
                        </a>

                        <p className="text-[11px] text-slate-400 leading-relaxed">
                            Minta tamu memindai QR ini dengan kamera bawaan HP. QR yang dibuka dari dalam
                            aplikasi WhatsApp atau Instagram kadang tidak bisa memakai kamera — halaman
                            tamu sudah menyediakan jalur cadangan bila itu terjadi.
                        </p>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between gap-4">
                    <CardTitle className="text-lg">
                        Kenangan Tamu{" "}
                        {!loading && <span className="text-slate-400 font-normal">({items.length})</span>}
                    </CardTitle>
                    {!adminKey && (
                        <Button variant="outline" size="sm" onClick={askKey}>
                            <KeyRound className="w-4 h-4 mr-2" /> Masukkan Kunci Admin
                        </Button>
                    )}
                </CardHeader>
                <CardContent>
                    {keyError && (
                        <p className="text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-lg p-3 mb-4">
                            {keyError}
                        </p>
                    )}
                    {!adminKey && !keyError && (
                        <p className="text-xs text-slate-500 bg-slate-50 border border-slate-100 rounded-lg p-3 mb-4">
                            Masukkan kunci admin untuk melihat kenangan yang disembunyikan dan memakai
                            tombol sembunyikan/hapus.
                        </p>
                    )}

                    {loading ? (
                        <div className="flex justify-center py-16">
                            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                        </div>
                    ) : items.length === 0 ? (
                        <div className="text-center py-16 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                            <Camera className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                            <p className="text-slate-500 font-medium">Belum ada kenangan dari tamu.</p>
                        </div>
                    ) : (
                        <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
                            {items.map(item => (
                                <div
                                    key={item.id}
                                    className="break-inside-avoid rounded-xl overflow-hidden bg-white shadow-md border border-slate-100"
                                >
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={item.image_url}
                                        alt={item.guest_name}
                                        className={item.is_hidden ? "w-full h-auto opacity-40" : "w-full h-auto"}
                                    />
                                    <div className="p-3">
                                        <p className="text-sm font-semibold text-slate-800 truncate">
                                            {item.guest_name}
                                        </p>
                                        <p className="text-[10px] text-slate-400">{formatStamp(item.created_at)}</p>

                                        <div className="flex gap-2 mt-3">
                                            <button
                                                onClick={() => toggleHidden(item)}
                                                disabled={busyId === item.id}
                                                title={item.is_hidden ? "Tampilkan di galeri tamu" : "Sembunyikan dari galeri tamu"}
                                                className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 disabled:opacity-40"
                                            >
                                                {item.is_hidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                            <button
                                                onClick={() => remove(item)}
                                                disabled={busyId === item.id}
                                                title="Hapus permanen"
                                                className="p-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 disabled:opacity-40"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
