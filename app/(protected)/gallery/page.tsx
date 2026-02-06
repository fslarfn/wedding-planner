"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Image as ImageIcon, Plus, Trash2, ExternalLink, Filter } from "lucide-react"

export default function GalleryPage() {
    const [items, setItems] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [category, setCategory] = useState("All")

    // Add Item State
    const [isAddOpen, setIsAddOpen] = useState(false)
    const [newItem, setNewItem] = useState({ image_url: "", category: "Attire", caption: "" })

    const categories = ["All", "Attire", "Decoration", "Venue", "Makeup", "Invitation", "Other"]
    const formCategories = categories.filter(c => c !== "All")

    useEffect(() => {
        fetchGallery()
    }, [])

    async function fetchGallery() {
        setLoading(true)
        const { data } = await supabase.from('moodboard_items').select('*').order('created_at', { ascending: false })
        if (data) setItems(data)
        setLoading(false)
    }

    async function handleAddItem() {
        if (!newItem.image_url) return
        await supabase.from('moodboard_items').insert([newItem])
        setIsAddOpen(false)
        setNewItem({ image_url: "", category: "Attire", caption: "" })
        fetchGallery()
    }

    async function handleDelete(id: string) {
        if (confirm("Hapus inspirasi ini dari moodboard?")) {
            await supabase.from('moodboard_items').delete().eq('id', id)
            fetchGallery()
        }
    }

    const filteredItems = category === "All" ? items : items.filter(i => i.category === category)

    return (
        <div className="space-y-6 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
                        <ImageIcon className="w-8 h-8 text-pink-500" /> Moodboard Gallery
                    </h1>
                    <p className="text-slate-500">Kumpulan inspirasi visual untuk hari bahagia.</p>
                </div>
                <Button onClick={() => setIsAddOpen(true)} className="bg-pink-600 hover:bg-pink-700">
                    <Plus className="w-4 h-4 mr-2" /> Tambah Inspirasi
                </Button>
            </div>

            {/* Filter Tabs */}
            <div className="flex overflow-x-auto pb-4 gap-2 no-scrollbar">
                {categories.map(cat => (
                    <button
                        key={cat}
                        onClick={() => setCategory(cat)}
                        className={cn(
                            "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all",
                            category === cat
                                ? "bg-slate-900 text-white shadow-md"
                                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                        )}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {/* Gallery Grid */}
            {filteredItems.length === 0 ? (
                <div className="text-center py-20 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                    <ImageIcon className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500 font-medium">Belum ada inspirasi di kategori ini.</p>
                    <p className="text-xs text-slate-400 mt-1">Mulai kumpulkan ide-ide menarik!</p>
                </div>
            ) : (
                <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
                    {filteredItems.map(item => (
                        <div key={item.id} className="break-inside-avoid relative group rounded-xl overflow-hidden shadow-md bg-white">
                            <img
                                src={item.image_url}
                                alt={item.caption || "Inspirasi"}
                                className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-105"
                                onError={(e) => (e.currentTarget.src = "https://placehold.co/400x300?text=No+Image")}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                                <span className="text-xs font-bold text-pink-400 uppercase tracking-wider mb-1">{item.category}</span>
                                <p className="text-white text-sm font-medium line-clamp-2">{item.caption || "Tanpa Keterangan"}</p>
                                <div className="flex gap-2 mt-3 justify-end">
                                    <a href={item.image_url} target="_blank" className="p-2 bg-white/20 hover:bg-white/40 text-white rounded-full backdrop-blur-sm transition-colors">
                                        <ExternalLink className="w-4 h-4" />
                                    </a>
                                    <button onClick={() => handleDelete(item.id)} className="p-2 bg-red-500/80 hover:bg-red-600 text-white rounded-full backdrop-blur-sm transition-colors">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Add Item Dialog */}
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Tambah ke Moodboard</DialogTitle></DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <label className="text-xs font-semibold">URL Gambar</label>
                            <Input placeholder="https://pinterest.com/..." value={newItem.image_url} onChange={e => setNewItem({ ...newItem, image_url: e.target.value })} />
                            <p className="text-[10px] text-slate-400">Copy link gambar (klik kanan copy image address) dari Pinterest/Instagram.</p>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-semibold">Kategori</label>
                            <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={newItem.category} onChange={e => setNewItem({ ...newItem, category: e.target.value })}>
                                {formCategories.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-semibold">Keterangan / Caption</label>
                            <Input placeholder="Contoh: Ide gaun akad adat sunda" value={newItem.caption} onChange={e => setNewItem({ ...newItem, caption: e.target.value })} />
                        </div>
                    </div>
                    <DialogFooter><Button onClick={handleAddItem} className="bg-pink-600 hover:bg-pink-700">Simpan Foto</Button></DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
