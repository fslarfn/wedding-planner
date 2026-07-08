"use client"

import { useEffect, useRef, useState } from "react"
import { supabase } from "@/lib/supabase"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    Heart, Upload, Plus, Trash2, ImageIcon, Calendar, Wallet,
    Sparkles, Copy, ExternalLink, Loader2, Check
} from "lucide-react"

const BUCKET = "invitation"

type LoveStoryItem = { date: string; title: string; description: string }
type BankAccount = { bank: string; no_rek: string; atas_nama: string }
type GalleryItem = { id: string; image_url: string; caption: string; sort_order: number }

const emptySettings = {
    id: "",
    groom_name: "", groom_nickname: "", groom_parents: "", groom_instagram: "", groom_child_order: "",
    bride_name: "", bride_nickname: "", bride_parents: "", bride_instagram: "", bride_child_order: "",
    cover_photo_url: "", hero_photo_url: "", quote_text: "", quote_image_url: "", closing_photo_url: "",
    bride_closeup_url: "", groom_closeup_url: "", music_url: "",
    love_story: [] as LoveStoryItem[],
    akad_date: "", akad_time: "", akad_venue: "", akad_address: "", akad_maps_url: "",
    resepsi_date: "", resepsi_time: "", resepsi_venue: "", resepsi_address: "", resepsi_maps_url: "",
    bank_accounts: [] as BankAccount[],
}

export default function InvitationEditorPage() {
    const [settings, setSettings] = useState<any>(emptySettings)
    const [gallery, setGallery] = useState<GalleryItem[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState<string | null>(null)
    const [uploadingField, setUploadingField] = useState<string | null>(null)
    const [copied, setCopied] = useState(false)

    const coverInputRef = useRef<HTMLInputElement>(null)
    const heroInputRef = useRef<HTMLInputElement>(null)
    const quoteInputRef = useRef<HTMLInputElement>(null)
    const closingInputRef = useRef<HTMLInputElement>(null)
    const brideCloseupInputRef = useRef<HTMLInputElement>(null)
    const groomCloseupInputRef = useRef<HTMLInputElement>(null)
    const galleryInputRef = useRef<HTMLInputElement>(null)
    const musicInputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        fetchAll()
    }, [])

    async function fetchAll() {
        setLoading(true)
        const { data: existing } = await supabase.from('invitation_settings').select('*').order('updated_at', { ascending: true }).limit(1).maybeSingle()

        if (existing) {
            setSettings({
                ...emptySettings,
                ...existing,
                love_story: existing.love_story || [],
                bank_accounts: existing.bank_accounts || [],
            })
        } else {
            const { data: created } = await supabase.from('invitation_settings').insert([{}]).select().single()
            if (created) setSettings({ ...emptySettings, ...created })
        }

        const { data: galleryData } = await supabase.from('invitation_gallery').select('*').order('sort_order', { ascending: true })
        if (galleryData) setGallery(galleryData)

        setLoading(false)
    }

    function set(field: string, value: any) {
        setSettings((prev: any) => ({ ...prev, [field]: value }))
    }

    async function persist(fields: Record<string, any>, savingKey: string) {
        setSaving(savingKey)
        await supabase.from('invitation_settings').update(fields).eq('id', settings.id)
        setSaving(null)
    }

    // --- IMAGE UPLOAD ---
    async function uploadImage(file: File, field: "cover_photo_url" | "hero_photo_url" | "quote_image_url" | "closing_photo_url" | "bride_closeup_url" | "groom_closeup_url") {
        if (!file.type.startsWith("image/")) {
            alert("File harus berupa gambar.")
            return
        }
        setUploadingField(field)
        try {
            const ext = file.name.split(".").pop()
            const path = `${field}/${Date.now()}.${ext}`
            const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: true })
            if (uploadError) {
                alert("Gagal upload foto: " + uploadError.message)
                return
            }
            const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path)
            const publicUrl = urlData.publicUrl

            set(field, publicUrl)
            await persist({ [field]: publicUrl }, field)
        } finally {
            setUploadingField(null)
        }
    }

    async function uploadMusic(file: File) {
        if (!file.type.startsWith("audio/")) {
            alert("File harus berupa audio (mp3, dll).")
            return
        }
        setUploadingField("music_url")
        try {
            const ext = file.name.split(".").pop()
            const path = `music_url/${Date.now()}.${ext}`
            const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: true })
            if (uploadError) {
                alert("Gagal upload musik: " + uploadError.message)
                return
            }
            const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path)
            const publicUrl = urlData.publicUrl

            set("music_url", publicUrl)
            await persist({ music_url: publicUrl }, "music_url")
        } finally {
            setUploadingField(null)
        }
    }

    async function removeMusic() {
        set("music_url", "")
        await persist({ music_url: "" }, "music_url")
    }

    async function uploadGalleryFiles(files: FileList) {
        setUploadingField("gallery")
        try {
            for (const file of Array.from(files)) {
                if (!file.type.startsWith("image/")) continue
                const ext = file.name.split(".").pop()
                const path = `gallery/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
                const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, file)
                if (uploadError) continue
                const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path)

                const { data: inserted } = await supabase.from('invitation_gallery')
                    .insert([{ image_url: urlData.publicUrl, sort_order: gallery.length }])
                    .select().single()
                if (inserted) setGallery(prev => [...prev, inserted])
            }
        } finally {
            setUploadingField(null)
        }
    }

    async function deleteGalleryItem(id: string) {
        if (!confirm("Hapus foto ini dari galeri undangan?")) return
        await supabase.from('invitation_gallery').delete().eq('id', id)
        setGallery(prev => prev.filter(g => g.id !== id))
    }

    async function updateGalleryCaption(id: string, caption: string) {
        setGallery(prev => prev.map(g => g.id === id ? { ...g, caption } : g))
    }

    async function saveGalleryCaption(id: string, caption: string) {
        await supabase.from('invitation_gallery').update({ caption }).eq('id', id)
    }

    // --- LOVE STORY ---
    function addLoveStory() {
        set("love_story", [...settings.love_story, { date: "", title: "", description: "" }])
    }
    function updateLoveStory(idx: number, field: keyof LoveStoryItem, value: string) {
        const next = [...settings.love_story]
        next[idx] = { ...next[idx], [field]: value }
        set("love_story", next)
    }
    function removeLoveStory(idx: number) {
        set("love_story", settings.love_story.filter((_: any, i: number) => i !== idx))
    }

    // --- BANK ACCOUNTS ---
    function addBankAccount() {
        set("bank_accounts", [...settings.bank_accounts, { bank: "", no_rek: "", atas_nama: "" }])
    }
    function updateBankAccount(idx: number, field: keyof BankAccount, value: string) {
        const next = [...settings.bank_accounts]
        next[idx] = { ...next[idx], [field]: value }
        set("bank_accounts", next)
    }
    function removeBankAccount(idx: number) {
        set("bank_accounts", settings.bank_accounts.filter((_: any, i: number) => i !== idx))
    }

    function copyLink() {
        const url = `${window.location.origin}/undangan`
        navigator.clipboard.writeText(url)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    if (loading) {
        return <div className="flex items-center justify-center h-64 text-slate-400"><Loader2 className="w-6 h-6 animate-spin mr-2" /> Memuat undangan...</div>
    }

    return (
        <div className="space-y-6 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
                        <Sparkles className="w-8 h-8 text-[#D8B0B0]" /> Undangan Online
                    </h1>
                    <p className="text-slate-500">Kelola foto, cerita, dan detail acara di undangan digital kalian.</p>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    <Button variant="outline" onClick={copyLink} className="flex-1 md:flex-none">
                        {copied ? <Check className="w-4 h-4 mr-2 text-green-600" /> : <Copy className="w-4 h-4 mr-2" />}
                        {copied ? "Tersalin!" : "Salin Link"}
                    </Button>
                    <a href="/undangan" target="_blank" className="flex-1 md:flex-none">
                        <Button className="w-full bg-[#D8B0B0] hover:bg-[#c99b9b] text-white">
                            <ExternalLink className="w-4 h-4 mr-2" /> Lihat Undangan
                        </Button>
                    </a>
                </div>
            </div>

            <Tabs defaultValue="pasangan" className="w-full">
                <TabsList className="bg-white border shadow-sm flex-wrap h-auto">
                    <TabsTrigger value="pasangan">Pasangan</TabsTrigger>
                    <TabsTrigger value="acara">Acara</TabsTrigger>
                    <TabsTrigger value="cerita">Cerita Cinta</TabsTrigger>
                    <TabsTrigger value="galeri">Galeri Foto</TabsTrigger>
                    <TabsTrigger value="amplop">Amplop Digital</TabsTrigger>
                </TabsList>

                {/* ================= PASANGAN ================= */}
                <TabsContent value="pasangan" className="space-y-6 mt-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <ImageUploadCard
                            label="Foto Cover (Halaman Pembuka)"
                            hint="Gunakan foto potrait (vertikal), rasio sekitar 4:5, agar tidak terpotong aneh"
                            imageUrl={settings.cover_photo_url}
                            uploading={uploadingField === "cover_photo_url"}
                            inputRef={coverInputRef}
                            onSelect={(f) => uploadImage(f, "cover_photo_url")}
                        />
                        <ImageUploadCard
                            label="Foto Hero (Halaman Utama)"
                            hint="Gunakan foto potrait (vertikal), rasio sekitar 4:5, agar tidak terpotong aneh"
                            imageUrl={settings.hero_photo_url}
                            uploading={uploadingField === "hero_photo_url"}
                            inputRef={heroInputRef}
                            onSelect={(f) => uploadImage(f, "hero_photo_url")}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card className="shadow-sm">
                            <CardHeader><CardTitle className="text-base">Mempelai Wanita</CardTitle></CardHeader>
                            <CardContent className="space-y-3">
                                <ImageUploadCard
                                    label="Foto Close Up (di atas nama)"
                                    imageUrl={settings.bride_closeup_url}
                                    uploading={uploadingField === "bride_closeup_url"}
                                    inputRef={brideCloseupInputRef}
                                    onSelect={(f) => uploadImage(f, "bride_closeup_url")}
                                    square
                                />
                                <Field label="Nama Lengkap"><Input value={settings.bride_name} onChange={e => set("bride_name", e.target.value)} placeholder="Ditta" /></Field>
                                <Field label="Nama Panggilan"><Input value={settings.bride_nickname} onChange={e => set("bride_nickname", e.target.value)} placeholder="Ditta" /></Field>
                                <Field label="Anak ke- (opsional)"><Input value={settings.bride_child_order} onChange={e => set("bride_child_order", e.target.value)} placeholder="Bungsu / Sulung / Kedua / dst" /></Field>
                                <Field label="Putri dari"><Input value={settings.bride_parents} onChange={e => set("bride_parents", e.target.value)} placeholder="Bapak ... & Ibu ..." /></Field>
                                <Field label="Instagram (opsional)"><Input value={settings.bride_instagram} onChange={e => set("bride_instagram", e.target.value)} placeholder="username" /></Field>
                            </CardContent>
                        </Card>
                        <Card className="shadow-sm">
                            <CardHeader><CardTitle className="text-base">Mempelai Pria</CardTitle></CardHeader>
                            <CardContent className="space-y-3">
                                <ImageUploadCard
                                    label="Foto Close Up (di atas nama)"
                                    imageUrl={settings.groom_closeup_url}
                                    uploading={uploadingField === "groom_closeup_url"}
                                    inputRef={groomCloseupInputRef}
                                    onSelect={(f) => uploadImage(f, "groom_closeup_url")}
                                    square
                                />
                                <Field label="Nama Lengkap"><Input value={settings.groom_name} onChange={e => set("groom_name", e.target.value)} placeholder="Muhammad Faisal" /></Field>
                                <Field label="Nama Panggilan"><Input value={settings.groom_nickname} onChange={e => set("groom_nickname", e.target.value)} placeholder="Isal" /></Field>
                                <Field label="Anak ke- (opsional)"><Input value={settings.groom_child_order} onChange={e => set("groom_child_order", e.target.value)} placeholder="Bungsu / Sulung / Kedua / dst" /></Field>
                                <Field label="Putra dari"><Input value={settings.groom_parents} onChange={e => set("groom_parents", e.target.value)} placeholder="Bapak ... & Ibu ..." /></Field>
                                <Field label="Instagram (opsional)"><Input value={settings.groom_instagram} onChange={e => set("groom_instagram", e.target.value)} placeholder="username" /></Field>
                            </CardContent>
                        </Card>
                    </div>

                    <Card className="shadow-sm">
                        <CardHeader><CardTitle className="text-base">Quote / Ayat Pembuka</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <textarea
                                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[90px]"
                                value={settings.quote_text}
                                onChange={e => set("quote_text", e.target.value)}
                                placeholder="Contoh: Dan di antara tanda-tanda kekuasaan-Nya ialah Dia menciptakan untukmu pasangan..."
                            />
                            <ImageUploadCard
                                label="Foto Latar Quote (opsional)"
                                hint="Gunakan foto potrait (vertikal) — tampil full sebagai latar section quote, seperti foto Hero"
                                imageUrl={settings.quote_image_url}
                                uploading={uploadingField === "quote_image_url"}
                                inputRef={quoteInputRef}
                                onSelect={(f) => uploadImage(f, "quote_image_url")}
                            />
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm">
                        <CardHeader><CardTitle className="text-base">Foto Penutup (Terima Kasih)</CardTitle></CardHeader>
                        <CardContent>
                            <ImageUploadCard
                                label="Foto Latar Penutup (opsional)"
                                hint="Gunakan foto potrait (vertikal) — tampil full di halaman penutup/Terima Kasih paling akhir"
                                imageUrl={settings.closing_photo_url}
                                uploading={uploadingField === "closing_photo_url"}
                                inputRef={closingInputRef}
                                onSelect={(f) => uploadImage(f, "closing_photo_url")}
                            />
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm">
                        <CardHeader><CardTitle className="text-base">Musik Latar (opsional)</CardTitle></CardHeader>
                        <CardContent className="space-y-3">
                            <p className="text-xs text-slate-400">Musik akan otomatis diputar saat tamu membuka undangan (bisa dimatikan lewat tombol di halaman undangan)</p>
                            <input
                                type="file"
                                accept="audio/*"
                                ref={musicInputRef}
                                className="hidden"
                                onChange={e => e.target.files?.[0] && uploadMusic(e.target.files[0])}
                            />
                            {settings.music_url ? (
                                <div className="space-y-2">
                                    <audio controls src={settings.music_url} className="w-full h-10" />
                                    <div className="flex gap-2">
                                        <Button variant="outline" size="sm" onClick={() => musicInputRef.current?.click()} disabled={uploadingField === "music_url"}>
                                            {uploadingField === "music_url" ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                                            Ganti Musik
                                        </Button>
                                        <Button variant="outline" size="sm" className="text-red-500 hover:text-red-600" onClick={removeMusic}>
                                            <Trash2 className="w-4 h-4 mr-2" /> Hapus
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <Button
                                    variant="outline"
                                    onClick={() => musicInputRef.current?.click()}
                                    disabled={uploadingField === "music_url"}
                                >
                                    {uploadingField === "music_url" ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                                    {uploadingField === "music_url" ? "Mengunggah..." : "Pilih File Musik (mp3)"}
                                </Button>
                            )}
                        </CardContent>
                    </Card>

                    <SaveBar
                        saving={saving === "pasangan"}
                        onClick={() => persist({
                            groom_name: settings.groom_name, groom_nickname: settings.groom_nickname,
                            groom_parents: settings.groom_parents, groom_instagram: settings.groom_instagram,
                            groom_child_order: settings.groom_child_order,
                            bride_name: settings.bride_name, bride_nickname: settings.bride_nickname,
                            bride_parents: settings.bride_parents, bride_instagram: settings.bride_instagram,
                            bride_child_order: settings.bride_child_order,
                            quote_text: settings.quote_text,
                        }, "pasangan")}
                    />
                </TabsContent>

                {/* ================= ACARA ================= */}
                <TabsContent value="acara" className="space-y-6 mt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card className="shadow-sm border-t-4 border-t-[#D8B0B0]">
                            <CardHeader>
                                <CardTitle className="text-base flex items-center gap-2"><Calendar className="w-4 h-4" /> Akad Nikah</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <Field label="Tanggal"><Input type="date" value={settings.akad_date || ""} onChange={e => set("akad_date", e.target.value)} /></Field>
                                <Field label="Jam"><Input value={settings.akad_time} onChange={e => set("akad_time", e.target.value)} placeholder="08:00 - 10:00 WIB" /></Field>
                                <Field label="Nama Tempat"><Input value={settings.akad_venue} onChange={e => set("akad_venue", e.target.value)} placeholder="Masjid Al-Ikhlas" /></Field>
                                <Field label="Alamat Lengkap"><Input value={settings.akad_address} onChange={e => set("akad_address", e.target.value)} placeholder="Jl. Contoh No. 1, Jakarta" /></Field>
                                <Field label="Link Google Maps"><Input value={settings.akad_maps_url} onChange={e => set("akad_maps_url", e.target.value)} placeholder="https://maps.app.goo.gl/..." /></Field>
                            </CardContent>
                        </Card>
                        <Card className="shadow-sm border-t-4 border-t-blue-500">
                            <CardHeader>
                                <CardTitle className="text-base flex items-center gap-2"><Calendar className="w-4 h-4" /> Resepsi</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <Field label="Tanggal"><Input type="date" value={settings.resepsi_date || ""} onChange={e => set("resepsi_date", e.target.value)} /></Field>
                                <Field label="Jam"><Input value={settings.resepsi_time} onChange={e => set("resepsi_time", e.target.value)} placeholder="11:00 - 14:00 WIB" /></Field>
                                <Field label="Nama Tempat"><Input value={settings.resepsi_venue} onChange={e => set("resepsi_venue", e.target.value)} placeholder="Gedung Serbaguna" /></Field>
                                <Field label="Alamat Lengkap"><Input value={settings.resepsi_address} onChange={e => set("resepsi_address", e.target.value)} placeholder="Jl. Contoh No. 2, Jakarta" /></Field>
                                <Field label="Link Google Maps"><Input value={settings.resepsi_maps_url} onChange={e => set("resepsi_maps_url", e.target.value)} placeholder="https://maps.app.goo.gl/..." /></Field>
                            </CardContent>
                        </Card>
                    </div>

                    <SaveBar
                        saving={saving === "acara"}
                        onClick={() => persist({
                            akad_date: settings.akad_date || null, akad_time: settings.akad_time,
                            akad_venue: settings.akad_venue, akad_address: settings.akad_address, akad_maps_url: settings.akad_maps_url,
                            resepsi_date: settings.resepsi_date || null, resepsi_time: settings.resepsi_time,
                            resepsi_venue: settings.resepsi_venue, resepsi_address: settings.resepsi_address, resepsi_maps_url: settings.resepsi_maps_url,
                        }, "acara")}
                    />
                </TabsContent>

                {/* ================= CERITA CINTA ================= */}
                <TabsContent value="cerita" className="space-y-4 mt-6">
                    <div className="space-y-4">
                        {settings.love_story.length === 0 && (
                            <div className="text-center py-12 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200 text-slate-400">
                                Belum ada momen cerita cinta. Tambahkan momen pertama kalian!
                            </div>
                        )}
                        {settings.love_story.map((item: LoveStoryItem, idx: number) => (
                            <Card key={idx} className="shadow-sm">
                                <CardContent className="p-4 space-y-3">
                                    <div className="flex justify-between items-start gap-2">
                                        <span className="text-xs font-bold text-[#D8B0B0] uppercase">Momen #{idx + 1}</span>
                                        <button onClick={() => removeLoveStory(idx)} className="text-slate-300 hover:text-red-500">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <Field label="Tanggal / Periode"><Input value={item.date} onChange={e => updateLoveStory(idx, "date", e.target.value)} placeholder="Januari 2020" /></Field>
                                        <Field label="Judul"><Input value={item.title} onChange={e => updateLoveStory(idx, "title", e.target.value)} placeholder="Pertama Bertemu" /></Field>
                                    </div>
                                    <Field label="Cerita">
                                        <textarea
                                            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[70px]"
                                            value={item.description}
                                            onChange={e => updateLoveStory(idx, "description", e.target.value)}
                                            placeholder="Ceritakan momen ini..."
                                        />
                                    </Field>
                                </CardContent>
                            </Card>
                        ))}
                        <Button variant="outline" onClick={addLoveStory} className="w-full border-dashed">
                            <Plus className="w-4 h-4 mr-2" /> Tambah Momen
                        </Button>
                    </div>

                    <SaveBar saving={saving === "cerita"} onClick={() => persist({ love_story: settings.love_story }, "cerita")} />
                </TabsContent>

                {/* ================= GALERI FOTO ================= */}
                <TabsContent value="galeri" className="space-y-4 mt-6">
                    <Card className="shadow-sm border-dashed border-2">
                        <CardContent className="p-8 text-center">
                            <input
                                type="file"
                                accept="image/*"
                                multiple
                                ref={galleryInputRef}
                                className="hidden"
                                onChange={e => e.target.files && uploadGalleryFiles(e.target.files)}
                            />
                            <ImageIcon className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                            <p className="text-slate-500 mb-3">Unggah foto-foto untuk galeri undangan (bisa pilih banyak sekaligus)</p>
                            <Button onClick={() => galleryInputRef.current?.click()} disabled={uploadingField === "gallery"} className="bg-[#D8B0B0] hover:bg-[#c99b9b] text-white">
                                {uploadingField === "gallery" ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                                {uploadingField === "gallery" ? "Mengunggah..." : "Pilih Foto dari Perangkat"}
                            </Button>
                        </CardContent>
                    </Card>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {gallery.map(item => (
                            <div key={item.id} className="group relative rounded-xl overflow-hidden shadow-sm border border-slate-200 bg-white">
                                <img src={item.image_url} alt={item.caption || "Galeri"} className="w-full h-40 object-cover" />
                                <button
                                    onClick={() => deleteGalleryItem(item.id)}
                                    className="absolute top-2 right-2 p-1.5 bg-red-500/90 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                                <input
                                    className="w-full text-xs px-2 py-1.5 border-t border-slate-100 focus:outline-none"
                                    placeholder="Keterangan foto..."
                                    value={item.caption || ""}
                                    onChange={e => updateGalleryCaption(item.id, e.target.value)}
                                    onBlur={e => saveGalleryCaption(item.id, e.target.value)}
                                />
                            </div>
                        ))}
                    </div>
                </TabsContent>

                {/* ================= AMPLOP DIGITAL ================= */}
                <TabsContent value="amplop" className="space-y-4 mt-6">
                    <div className="space-y-4">
                        {settings.bank_accounts.length === 0 && (
                            <div className="text-center py-12 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200 text-slate-400">
                                Belum ada rekening ditambahkan.
                            </div>
                        )}
                        {settings.bank_accounts.map((acc: BankAccount, idx: number) => (
                            <Card key={idx} className="shadow-sm">
                                <CardContent className="p-4 space-y-3">
                                    <div className="flex justify-between items-start gap-2">
                                        <span className="text-xs font-bold text-[#D8B0B0] uppercase flex items-center gap-1"><Wallet className="w-3.5 h-3.5" /> Rekening #{idx + 1}</span>
                                        <button onClick={() => removeBankAccount(idx)} className="text-slate-300 hover:text-red-500">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                        <Field label="Nama Bank / E-Wallet"><Input value={acc.bank} onChange={e => updateBankAccount(idx, "bank", e.target.value)} placeholder="BCA / GoPay / dll" /></Field>
                                        <Field label="Nomor Rekening"><Input value={acc.no_rek} onChange={e => updateBankAccount(idx, "no_rek", e.target.value)} placeholder="1234567890" /></Field>
                                        <Field label="Atas Nama"><Input value={acc.atas_nama} onChange={e => updateBankAccount(idx, "atas_nama", e.target.value)} placeholder="Nama Pemilik Rekening" /></Field>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                        <Button variant="outline" onClick={addBankAccount} className="w-full border-dashed">
                            <Plus className="w-4 h-4 mr-2" /> Tambah Rekening
                        </Button>
                    </div>

                    <SaveBar saving={saving === "amplop"} onClick={() => persist({ bank_accounts: settings.bank_accounts }, "amplop")} />
                </TabsContent>
            </Tabs>
        </div>
    )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500">{label}</label>
            {children}
        </div>
    )
}

function SaveBar({ saving, onClick }: { saving: boolean; onClick: () => void }) {
    return (
        <div className="flex justify-end sticky bottom-4">
            <Button onClick={onClick} disabled={saving} className="bg-slate-900 hover:bg-slate-800 text-white shadow-lg">
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Heart className="w-4 h-4 mr-2" />}
                {saving ? "Menyimpan..." : "Simpan Perubahan"}
            </Button>
        </div>
    )
}

function ImageUploadCard({
    label, hint, imageUrl, uploading, inputRef, onSelect, square,
}: {
    label: string
    hint?: string
    imageUrl: string
    uploading: boolean
    inputRef: React.RefObject<HTMLInputElement | null>
    onSelect: (file: File) => void
    square?: boolean
}) {
    return (
        <Card className="shadow-sm overflow-hidden">
            <CardHeader className="pb-2">
                <CardTitle className="text-base">{label}</CardTitle>
                {hint && <p className="text-xs text-slate-400">{hint}</p>}
            </CardHeader>
            <CardContent>
                <input
                    type="file"
                    accept="image/*"
                    ref={inputRef}
                    className="hidden"
                    onChange={e => e.target.files?.[0] && onSelect(e.target.files[0])}
                />
                <div
                    onClick={() => inputRef.current?.click()}
                    className={cn(
                        "relative mx-auto rounded-lg overflow-hidden border-2 border-dashed border-slate-200 bg-slate-50 flex items-center justify-center cursor-pointer hover:border-[#D8B0B0] transition-colors group",
                        square ? "max-w-[160px] aspect-square rounded-full" : "max-w-[220px] aspect-[4/5]"
                    )}
                >
                    {imageUrl ? (
                        <>
                            <img src={imageUrl} alt={label} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <span className="text-white text-sm font-medium flex items-center gap-2"><Upload className="w-4 h-4" /> Ganti Foto</span>
                            </div>
                        </>
                    ) : (
                        <div className="text-center py-6 text-slate-400">
                            <ImageIcon className="w-8 h-8 mx-auto mb-2" />
                            <p className="text-sm">Klik untuk unggah foto</p>
                        </div>
                    )}
                    {uploading && (
                        <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                            <Loader2 className="w-6 h-6 animate-spin text-[#D8B0B0]" />
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
