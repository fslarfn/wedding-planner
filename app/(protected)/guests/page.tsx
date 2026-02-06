"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { cn } from "@/lib/utils"
// UI Components
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
// Icons
import { Plus, Trash2, Edit2, Users, Mail, CheckCircle2, Circle, Smartphone, MailOpen } from "lucide-react"

export default function GuestPage() {
    const [activeTab, setActiveTab] = useState("Isal")
    const [guests, setGuests] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")

    // Dialog & Form List
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [formData, setFormData] = useState({
        id: "",
        name: "",
        category: "Keluarga Kandung",
        invited_by: "Isal",
        invitation_type: "Digital",
        relation: "Keluarga",
        pax_estimate: "1",
        phone: "",
        note: ""
    })

    const CATEGORIES = [
        "Keluarga Kandung", "Keluarga Besar", "Keluarga Jauh",
        "Teman Kantor", "Teman Kuliah", "Teman SMA/SMP",
        "Tetangga", "Relasi Orang Tua", "Lainnya"
    ]

    useEffect(() => { fetchGuests() }, [])

    async function fetchGuests() {
        setLoading(true)
        const { data } = await supabase.from('wedding_guests').select('*').order('name')
        if (data) setGuests(data)
        setLoading(false)
    }

    // --- CRUD HANDLERS ---
    function resetForm() {
        setFormData({
            id: "", name: "", category: "Keluarga Kandung", invited_by: activeTab,
            invitation_type: "Digital", relation: "Keluarga", pax_estimate: "1", phone: "", note: ""
        })
    }

    function handleEdit(guest: any) {
        setFormData({
            id: guest.id,
            name: guest.name,
            category: guest.category,
            invited_by: guest.invited_by,
            invitation_type: guest.invitation_type,
            relation: guest.relation,
            pax_estimate: guest.pax_estimate.toString(),
            phone: guest.phone || "",
            note: guest.note || ""
        })
        setIsDialogOpen(true)
    }

    async function handleSave() {
        if (!formData.name) return

        const payload = {
            name: formData.name,
            category: formData.category,
            invited_by: formData.invited_by,
            invitation_type: formData.invitation_type,
            relation: formData.relation,
            pax_estimate: parseInt(formData.pax_estimate) || 1,
            phone: formData.phone,
            note: formData.note
        }

        if (formData.id) {
            await supabase.from('wedding_guests').update(payload).eq('id', formData.id)
        } else {
            await supabase.from('wedding_guests').insert([payload])
        }

        setIsDialogOpen(false)
        resetForm()
        fetchGuests()
    }

    async function handleDelete(id: string) {
        if (confirm("Hapus tamu ini?")) {
            await supabase.from('wedding_guests').delete().eq('id', id)
            fetchGuests()
        }
    }

    async function toggleInviteStatus(id: string, current: boolean) {
        await supabase.from('wedding_guests').update({ is_invited: !current }).eq('id', id)
        fetchGuests()
    }

    // --- FILTERING & GROUPING ---
    const filteredGuests = guests.filter(g =>
        g.invited_by === activeTab &&
        (g.name.toLowerCase().includes(searchTerm.toLowerCase()) || g.category.toLowerCase().includes(searchTerm.toLowerCase()))
    )

    // Group by Category
    const groupedGuests = filteredGuests.reduce((acc: any, guest: any) => {
        if (!acc[guest.category]) acc[guest.category] = []
        acc[guest.category].push(guest)
        return acc
    }, {})

    // Stats
    const totalPax = filteredGuests.reduce((sum, g) => sum + (g.pax_estimate || 0), 0)
    const totalInvited = filteredGuests.filter(g => g.is_invited).length
    const totalPhysical = filteredGuests.filter(g => g.invitation_type === 'Fisik').length
    const totalDigital = filteredGuests.filter(g => g.invitation_type === 'Digital').length

    return (
        <div className="space-y-6 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <div>
                    <h1 className="text-3xl font-serif font-bold text-slate-900">Wedding Guest List</h1>
                    <p className="text-slate-500">Kelola daftar undangan pernikahan (Isal & Ditta).</p>
                </div>
                <div className="flex gap-2">
                    <div className="bg-blue-50 px-4 py-2 rounded-lg border border-blue-100 text-center">
                        <p className="text-xs text-blue-500 font-bold uppercase">Total Undangan</p>
                        <p className="text-xl font-bold text-blue-700">{filteredGuests.length}</p>
                    </div>
                    <div className="bg-slate-50 px-4 py-2 rounded-lg border border-slate-200 text-center">
                        <p className="text-xs text-slate-500 font-bold uppercase">Estimasi Pax</p>
                        <p className="text-xl font-bold text-slate-700">{totalPax}</p>
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full md:w-auto">
                    <TabsList className="bg-white border text-slate-500 shadow-sm">
                        <TabsTrigger value="Isal" className="w-32 data-[state=active]:bg-slate-900 data-[state=active]:text-white">Isal</TabsTrigger>
                        <TabsTrigger value="Ditta" className="w-32 data-[state=active]:bg-blue-600 data-[state=active]:text-white">Ditta</TabsTrigger>
                    </TabsList>
                </Tabs>

                <div className="flex gap-2 w-full md:w-auto">
                    <Input
                        placeholder="Cari nama tamu..."
                        className="bg-white border-slate-200 focus-visible:ring-blue-500"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button onClick={resetForm} className="bg-blue-600 hover:bg-blue-700 text-white"><Plus className="w-4 h-4 mr-2" /> Tamu Baru</Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-xl">
                            <DialogHeader><DialogTitle>{formData.id ? "Edit Tamu" : "Tambah Tamu Baru"}</DialogTitle></DialogHeader>
                            <div className="grid grid-cols-2 gap-4 py-4">
                                <div className="col-span-2">
                                    <label className="text-xs font-semibold text-slate-500">Nama Tamu</label>
                                    <Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Nama Lengkap / Panggilan" />
                                </div>

                                <div>
                                    <label className="text-xs font-semibold text-slate-500">Kategori</label>
                                    <select
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500"
                                        value={formData.category}
                                        onChange={e => setFormData({ ...formData, category: e.target.value })}
                                    >
                                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>

                                <div>
                                    <label className="text-xs font-semibold text-slate-500">Relasi</label>
                                    <select
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                        value={formData.relation}
                                        onChange={e => setFormData({ ...formData, relation: e.target.value })}
                                    >
                                        <option value="Keluarga">Keluarga</option>
                                        <option value="Teman">Teman</option>
                                        <option value="Kerabat">Kerabat</option>
                                        <option value="VIP">VIP</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="text-xs font-semibold text-slate-500">Jenis Undangan</label>
                                    <select
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                        value={formData.invitation_type}
                                        onChange={e => setFormData({ ...formData, invitation_type: e.target.value })}
                                    >
                                        <option value="Digital">Digital (WA)</option>
                                        <option value="Fisik">Fisik (Cetak)</option>
                                        <option value="Both">Keduanya</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="text-xs font-semibold text-slate-500">Estimasi Pax</label>
                                    <Input type="number" value={formData.pax_estimate} onChange={e => setFormData({ ...formData, pax_estimate: e.target.value })} />
                                </div>

                                <div className="col-span-2">
                                    <label className="text-xs font-semibold text-slate-500">Nomor WhatsApp</label>
                                    <Input
                                        type="tel"
                                        placeholder="Contoh: 628123456789 (Gunakan 62)"
                                        value={formData.phone}
                                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                    />
                                </div>

                                <div className="col-span-2">
                                    <label className="text-xs font-semibold text-slate-500">Catatan (Optional)</label>
                                    <Input value={formData.note} onChange={e => setFormData({ ...formData, note: e.target.value })} placeholder="Ex: Bawa anak kecil, vegetarian, dll" />
                                </div>

                                <div className="col-span-2">
                                    <label className="text-xs font-semibold text-slate-500">Diundang Oleh</label>
                                    <div className="flex gap-4 mt-2">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input type="radio" name="invited_by" value="Isal" checked={formData.invited_by === 'Isal'} onChange={() => setFormData({ ...formData, invited_by: 'Isal' })} /> Isal
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input type="radio" name="invited_by" value="Ditta" checked={formData.invited_by === 'Ditta'} onChange={() => setFormData({ ...formData, invited_by: 'Ditta' })} /> Ditta
                                        </label>
                                    </div>
                                </div>
                            </div>
                            <DialogFooter><Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white">Simpan Data</Button></DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Summary Chips */}
            <div className="flex gap-3 overflow-x-auto pb-2">
                <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-sm text-xs font-medium text-slate-600 whitespace-nowrap">
                    <Mail className="w-3 h-3 text-slate-400" /> Fisik: <span className="text-slate-900 font-bold">{totalPhysical}</span>
                </div>
                <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-sm text-xs font-medium text-slate-600 whitespace-nowrap">
                    <Smartphone className="w-3 h-3 text-slate-400" /> Digital: <span className="text-slate-900 font-bold">{totalDigital}</span>
                </div>
                <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-sm text-xs font-medium text-slate-600 whitespace-nowrap">
                    <MailOpen className="w-3 h-3 text-slate-400" /> Terkirim: <span className="text-green-600 font-bold">{totalInvited}</span>
                </div>
            </div>

            {/* Guest List Grouped */}
            <div className="space-y-6">
                {Object.keys(groupedGuests).length === 0 ? (
                    <div className="text-center py-12 text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                        Belum ada data tamu untuk kategori ini.
                    </div>
                ) : (
                    Object.keys(groupedGuests).map(category => (
                        <Card key={category} className="overflow-hidden border-t-4 border-t-blue-500 shadow-sm">
                            <CardHeader className="bg-slate-50/50 py-3 px-4 border-b border-slate-100">
                                <div className="flex justify-between items-center">
                                    <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-700">{category}</CardTitle>
                                    <span className="text-xs font-medium bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">
                                        {groupedGuests[category].length} Tamu
                                    </span>
                                </div>
                            </CardHeader>
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="hover:bg-transparent">
                                            <TableHead className="w-[40px]">No</TableHead>
                                            <TableHead>Nama Tamu</TableHead>
                                            <TableHead className="w-[100px]">Relasi</TableHead>
                                            <TableHead className="text-center w-[100px]">Tipe</TableHead>
                                            <TableHead className="text-center w-[80px]">Pax</TableHead>
                                            <TableHead className="text-center w-[100px]">Status</TableHead>
                                            <TableHead className="w-[100px]"></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {groupedGuests[category].map((guest: any, idx: number) => (
                                            <TableRow key={guest.id} className="hover:bg-gray-50">
                                                <TableCell className="text-gray-400 text-xs">{idx + 1}</TableCell>
                                                <TableCell>
                                                    <div className="font-semibold text-gray-900">{guest.name}</div>
                                                    {guest.note && <div className="text-xs text-gray-400 mt-0.5">{guest.note}</div>}
                                                </TableCell>
                                                <TableCell>
                                                    <span className={cn(
                                                        "text-[10px] px-2 py-0.5 rounded border uppercase font-bold",
                                                        guest.relation === 'Keluarga' ? "bg-purple-50 text-purple-600 border-purple-100" :
                                                            guest.relation === 'Teman' ? "bg-blue-50 text-blue-600 border-blue-100" :
                                                                "bg-gray-50 text-gray-600 border-gray-100"
                                                    )}>{guest.relation}</span>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <div className="flex justify-center items-center gap-1 text-xs text-gray-600">
                                                        {guest.invitation_type === 'Fisik' ? <Mail className="w-3 h-3" /> : <Smartphone className="w-3 h-3" />}
                                                        {guest.invitation_type}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-center font-bold text-gray-700">{guest.pax_estimate}</TableCell>
                                                <TableCell className="text-center">
                                                    <button
                                                        onClick={() => toggleInviteStatus(guest.id, guest.is_invited)}
                                                        className={cn(
                                                            "flex items-center justify-center gap-1 w-full py-1 rounded text-[10px] font-bold transition-all",
                                                            guest.is_invited
                                                                ? "bg-green-100 text-green-700 hover:bg-green-200"
                                                                : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                                                        )}
                                                    >
                                                        {guest.is_invited ? (
                                                            <><CheckCircle2 className="w-3 h-3" /> TERKIRIM</>
                                                        ) : (
                                                            <><Circle className="w-3 h-3" /> BELUM</>
                                                        )}
                                                    </button>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex justify-end gap-1">
                                                        <Button
                                                            size="icon"
                                                            variant="ghost"
                                                            className={cn("h-8 w-8", guest.phone ? "text-green-500 hover:text-green-600" : "text-gray-300")}
                                                            onClick={() => {
                                                                if (!guest.phone) {
                                                                    alert("Nomor HP belum diisi!");
                                                                    return;
                                                                }
                                                                const message = `Halo ${guest.name}, kami mengundang Anda ke acara pernikahan kami. Link Undangan: https://undangan-kamu.com/to/${guest.id}`;
                                                                const url = `https://wa.me/${guest.phone}?text=${encodeURIComponent(message)}`;
                                                                window.open(url, '_blank');
                                                            }}
                                                            title={guest.phone ? "Kirim Undangan via WhatsApp" : "No HP Kosong"}
                                                        >
                                                            <Smartphone className="w-4 h-4" />
                                                        </Button>
                                                        <Button size="icon" variant="ghost" className="h-8 w-8 text-blue-400 hover:text-blue-600" onClick={() => handleEdit(guest)}>
                                                            <Edit2 className="w-4 h-4" />
                                                        </Button>
                                                        <Button size="icon" variant="ghost" className="h-8 w-8 text-red-400 hover:text-red-600" onClick={() => handleDelete(guest.id)}>
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </Card>
                    ))
                )}
            </div>
        </div>
    )
}
