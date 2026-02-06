"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { formatRupiah, cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Plus, Trash2, CheckCircle2, Circle, Users, Utensils, DollarSign, Camera, HeartHandshake, Clock, MapPin } from "lucide-react"

export default function EngagementPage() {
    const [activeTab, setActiveTab] = useState("guests")
    const [loading, setLoading] = useState(true)

    // Data State
    const [guestList, setGustList] = useState<any[]>([])
    const [menus, setMenus] = useState<any[]>([])
    const [expenses, setExpenses] = useState<any[]>([])
    const [vendors, setVendors] = useState<any[]>([])

    // Dialog States
    const [isGuestOpen, setIsGuestOpen] = useState(false)
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const [isExpenseOpen, setIsExpenseOpen] = useState(false)
    const [isVendorOpen, setIsVendorOpen] = useState(false)

    // Forms
    const [newGuest, setNewGuest] = useState({ name: "", side: "Isal", count: "1", note: "" })
    const [newMenu, setNewMenu] = useState({ name: "", category: "Makanan" })
    const [newExpense, setNewExpense] = useState({ item: "", cost: "", note: "" })
    const [newVendor, setNewVendor] = useState({ name: "", price_photo: "", price_video: "", reference_link: "" })

    useEffect(() => { fetchAllData() }, [])

    async function fetchAllData() {
        setLoading(true)
        const { data: g } = await supabase.from('engagement_guests').select('*').order('created_at')
        if (g) setGustList(g)

        const { data: m } = await supabase.from('engagement_menu').select('*').order('created_at')
        if (m) setMenus(m)

        const { data: e } = await supabase.from('engagement_expenses').select('*').order('created_at')
        if (e) setExpenses(e)

        const { data: v } = await supabase.from('engagement_vendors').select('*').order('created_at')
        if (v) setVendors(v)
        setLoading(false)
    }

    // --- HANDLERS ---
    async function addGuest() {
        if (!newGuest.name) return
        await supabase.from('engagement_guests').insert([{ ...newGuest, count: parseInt(newGuest.count) }])
        setIsGuestOpen(false); setNewGuest({ name: "", side: "Isal", count: "1", note: "" }); fetchAllData()
    }

    async function addMenu() {
        if (!newMenu.name) return
        await supabase.from('engagement_menu').insert([newMenu])
        setIsMenuOpen(false); setNewMenu({ name: "", category: "Makanan" }); fetchAllData()
    }

    async function addExpense() {
        if (!newExpense.item) return
        await supabase.from('engagement_expenses').insert([{ ...newExpense, cost: parseFloat(newExpense.cost) }])
        setIsExpenseOpen(false); setNewExpense({ item: "", cost: "", note: "" }); fetchAllData()
    }

    async function addVendor() {
        if (!newVendor.name) return
        await supabase.from('engagement_vendors').insert([{
            ...newVendor,
            price_photo: parseFloat(newVendor.price_photo),
            price_video: parseFloat(newVendor.price_video)
        }])
        setIsVendorOpen(false); setNewVendor({ name: "", price_photo: "", price_video: "", reference_link: "" }); fetchAllData()
    }

    async function deleteItem(table: string, id: string) {
        if (confirm("Hapus item ini?")) {
            await supabase.from(table).delete().eq('id', id)
            fetchAllData()
        }
    }

    async function toggleExpense(id: string, current: boolean) {
        await supabase.from('engagement_expenses').update({ is_paid: !current }).eq('id', id)
        fetchAllData()
    }

    // --- RENDER HELPERS ---
    const guestsIsal = guestList.filter(g => g.side === 'Isal')
    const guestsDitta = guestList.filter(g => g.side === 'Ditta')
    const totalGuests = guestList.reduce((sum, g) => sum + (g.count || 0), 0)

    const totalExpense = expenses.reduce((sum, e) => sum + (e.cost || 0), 0)

    return (
        <div className="space-y-8 pb-20">
            {/* Header / Cover */}
            <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 text-white p-8 md:p-12 shadow-2xl">
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2 opacity-90">
                            <HeartHandshake className="w-6 h-6 text-blue-300" />
                            <span className="uppercase tracking-widest font-semibold text-sm text-blue-200">Engagement Day</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4 tracking-wide">The Proposal</h1>
                        <div className="flex flex-wrap gap-4 text-sm font-medium">
                            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/20">
                                <Clock className="w-4 h-4 text-blue-300" />
                                03 April 2026
                            </div>
                            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/20">
                                <MapPin className="w-4 h-4 text-blue-300" />
                                Rumah Ditta
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/20 shadow-lg">
                        <Users className="text-blue-300 w-8 h-8" />
                        <div className="flex flex-col">
                            <span className="text-3xl font-bold">{totalGuests}</span>
                            <span className="text-xs uppercase tracking-wider opacity-80">Total Tamu</span>
                        </div>
                    </div>
                </div>
                {/* Decorative Circles */}
                <div className="absolute -top-10 -right-10 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />
            </div>

            <Tabs defaultValue="guests" value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="grid w-full grid-cols-4 lg:w-[600px] bg-white border border-slate-200 shadow-sm p-1 rounded-xl">
                    <TabsTrigger value="guests" className="rounded-lg data-[state=active]:bg-blue-900 data-[state=active]:text-white data-[state=active]:shadow-md transition-all">Tamu</TabsTrigger>
                    <TabsTrigger value="menu" className="rounded-lg data-[state=active]:bg-blue-900 data-[state=active]:text-white data-[state=active]:shadow-md transition-all">Menu</TabsTrigger>
                    <TabsTrigger value="expenses" className="rounded-lg data-[state=active]:bg-blue-900 data-[state=active]:text-white data-[state=active]:shadow-md transition-all">Biaya</TabsTrigger>
                    <TabsTrigger value="vendors" className="rounded-lg data-[state=active]:bg-blue-900 data-[state=active]:text-white data-[state=active]:shadow-md transition-all">Vendor</TabsTrigger>
                </TabsList>

                {/* --- GUESTS TAB --- */}
                <TabsContent value="guests" className="space-y-6 animate-in fade-in-50">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {['Isal', 'Ditta'].map((side) => (
                            <Card key={side} className={cn("border-t-4 shadow-sm", side === 'Isal' ? "border-t-blue-400" : "border-t-pink-400")}>
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle>Keluarga {side}</CardTitle>
                                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => { setNewGuest({ ...newGuest, side }); setIsGuestOpen(true) }}>
                                        <Plus className="w-4 h-4" />
                                    </Button>
                                </CardHeader>
                                <CardContent>
                                    <Table>
                                        <TableHeader><TableRow><TableHead>Nama</TableHead><TableHead className="w-[50px] text-center">Jml</TableHead><TableHead className="w-[40px]"></TableHead></TableRow></TableHeader>
                                        <TableBody>
                                            {(side === 'Isal' ? guestsIsal : guestsDitta).map(g => (
                                                <TableRow key={g.id}>
                                                    <TableCell className="font-medium">
                                                        {g.name}
                                                        {g.note && <div className="text-[10px] text-gray-400">{g.note}</div>}
                                                    </TableCell>
                                                    <TableCell className="text-center bg-gray-50 font-bold text-gray-700">{g.count}</TableCell>
                                                    <TableCell>
                                                        <Button size="icon" variant="ghost" className="h-6 w-6 text-red-300 hover:text-red-500" onClick={() => deleteItem('engagement_guests', g.id)}>
                                                            <Trash2 className="w-3 h-3" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                    {/* Add Guest Dialog */}
                    <Dialog open={isGuestOpen} onOpenChange={setIsGuestOpen}>
                        <DialogContent>
                            <DialogHeader><DialogTitle>Tambah Tamu ({newGuest.side})</DialogTitle></DialogHeader>
                            <div className="grid gap-4 py-4">
                                <Input placeholder="Nama Tamu / Keluarga" value={newGuest.name} onChange={e => setNewGuest({ ...newGuest, name: e.target.value })} />
                                <div className="flex gap-4">
                                    <Input type="number" placeholder="Jumlah" className="w-24" value={newGuest.count} onChange={e => setNewGuest({ ...newGuest, count: e.target.value })} />
                                    <Input placeholder="Catatan (Optional)" className="flex-1" value={newGuest.note} onChange={e => setNewGuest({ ...newGuest, note: e.target.value })} />
                                </div>
                            </div>
                            <DialogFooter><Button onClick={addGuest} className="bg-[#D8B0B0]">Simpan</Button></DialogFooter>
                        </DialogContent>
                    </Dialog>
                </TabsContent>

                {/* --- MENU TAB --- */}
                <TabsContent value="menu" className="animate-in fade-in-50">
                    <Card>
                        <CardHeader className="flex flex-row justify-between items-center">
                            <CardTitle>Menu Makanan & Snack</CardTitle>
                            <Button size="sm" className="bg-[#D8B0B0]" onClick={() => setIsMenuOpen(true)}>+ Tambah</Button>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div>
                                    <h4 className="font-bold text-gray-700 mb-4 flex items-center gap-2"><Utensils className="w-4 h-4" /> Makanan Berat</h4>
                                    <ul className="space-y-2">
                                        {menus.filter(m => m.category === 'Makanan').map(m => (
                                            <li key={m.id} className="flex justify-between items-center p-3 bg-orange-50/50 rounded-lg border border-orange-100">
                                                <span>{m.name}</span>
                                                <Button size="icon" variant="ghost" className="h-6 w-6 text-red-300" onClick={() => deleteItem('engagement_menu', m.id)}><Trash2 className="w-3 h-3" /></Button>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-700 mb-4 flex items-center gap-2"><Circle className="w-4 h-4" /> Snack & Minuman</h4>
                                    <ul className="space-y-2">
                                        {menus.filter(m => m.category === 'Snack').map(m => (
                                            <li key={m.id} className="flex justify-between items-center p-3 bg-blue-50/50 rounded-lg border border-blue-100">
                                                <span>{m.name}</span>
                                                <Button size="icon" variant="ghost" className="h-6 w-6 text-red-300" onClick={() => deleteItem('engagement_menu', m.id)}><Trash2 className="w-3 h-3" /></Button>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Dialog open={isMenuOpen} onOpenChange={setIsMenuOpen}>
                        <DialogContent>
                            <DialogHeader><DialogTitle>Tambah Menu</DialogTitle></DialogHeader>
                            <div className="grid gap-4 py-4">
                                <Input placeholder="Nama Menu" value={newMenu.name} onChange={e => setNewMenu({ ...newMenu, name: e.target.value })} />
                                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={newMenu.category} onChange={e => setNewMenu({ ...newMenu, category: e.target.value })}>
                                    <option value="Makanan">Makanan Berat</option>
                                    <option value="Snack">Snack / Minuman</option>
                                </select>
                            </div>
                            <DialogFooter><Button onClick={addMenu} className="bg-[#D8B0B0]">Simpan</Button></DialogFooter>
                        </DialogContent>
                    </Dialog>
                </TabsContent>

                {/* --- EXPENSES TAB --- */}
                <TabsContent value="expenses" className="animate-in fade-in-50">
                    <Card>
                        <CardHeader className="flex flex-row justify-between items-center">
                            <div>
                                <CardTitle>Realisasi Pengeluaran</CardTitle>
                                <p className="text-sm text-gray-500">Total: <span className="font-bold text-gray-900">{formatRupiah(totalExpense)}</span></p>
                            </div>
                            <Button size="sm" className="bg-[#D8B0B0]" onClick={() => setIsExpenseOpen(true)}>+ Tambah</Button>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader><TableRow><TableHead>Item</TableHead><TableHead className="text-right">Harga</TableHead><TableHead>Note</TableHead><TableHead className="text-center w-[50px]">Lunas</TableHead><TableHead className="w-[50px]"></TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {expenses.map(item => (
                                        <TableRow key={item.id} className={cn(item.is_paid && "bg-green-50/50")}>
                                            <TableCell className="font-medium">{item.item}</TableCell>
                                            <TableCell className="text-right font-mono">{formatRupiah(item.cost)}</TableCell>
                                            <TableCell className="text-xs text-gray-500 italic">{item.note}</TableCell>
                                            <TableCell className="text-center">
                                                <button onClick={() => toggleExpense(item.id, item.is_paid)} className={cn("transition-colors", item.is_paid ? "text-green-600" : "text-gray-300 hover:text-gray-400")}>
                                                    {item.is_paid ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                                                </button>
                                            </TableCell>
                                            <TableCell>
                                                <Button size="icon" variant="ghost" className="h-6 w-6 text-red-300" onClick={() => deleteItem('engagement_expenses', item.id)}><Trash2 className="w-3 h-3" /></Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                    <Dialog open={isExpenseOpen} onOpenChange={setIsExpenseOpen}>
                        <DialogContent>
                            <DialogHeader><DialogTitle>Catat Pengeluaran</DialogTitle></DialogHeader>
                            <div className="grid gap-4 py-4">
                                <Input placeholder="Nama Item" value={newExpense.item} onChange={e => setNewExpense({ ...newExpense, item: e.target.value })} />
                                <Input type="number" placeholder="Harga / Biaya" value={newExpense.cost} onChange={e => setNewExpense({ ...newExpense, cost: e.target.value })} />
                                <Input placeholder="Catatan (Optional)" value={newExpense.note} onChange={e => setNewExpense({ ...newExpense, note: e.target.value })} />
                            </div>
                            <DialogFooter><Button onClick={addExpense} className="bg-[#D8B0B0]">Simpan</Button></DialogFooter>
                        </DialogContent>
                    </Dialog>
                </TabsContent>

                {/* --- VENDORS TAB --- */}
                <TabsContent value="vendors" className="animate-in fade-in-50">
                    <Card>
                        <CardHeader className="flex flex-row justify-between items-center">
                            <CardTitle>Perbandingan Vendor (Fotografer)</CardTitle>
                            <Button size="sm" className="bg-[#D8B0B0]" onClick={() => setIsVendorOpen(true)}>+ Vendor</Button>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader><TableRow><TableHead>Vendor</TableHead><TableHead className="text-right">Foto Only</TableHead><TableHead className="text-right">With Video</TableHead><TableHead>Link / Ref</TableHead><TableHead className="w-[50px]"></TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {vendors.map(v => (
                                        <TableRow key={v.id}>
                                            <TableCell className="font-bold text-gray-700">{v.name}</TableCell>
                                            <TableCell className="text-right">{formatRupiah(v.price_photo)}</TableCell>
                                            <TableCell className="text-right">{formatRupiah(v.price_video)}</TableCell>
                                            <TableCell className="text-xs text-blue-500 underline truncate max-w-[200px]">
                                                {v.reference_link && <a href={v.reference_link} target="_blank">{v.reference_link}</a>}
                                            </TableCell>
                                            <TableCell>
                                                <Button size="icon" variant="ghost" className="h-6 w-6 text-red-300" onClick={() => deleteItem('engagement_vendors', v.id)}><Trash2 className="w-3 h-3" /></Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                    <Dialog open={isVendorOpen} onOpenChange={setIsVendorOpen}>
                        <DialogContent>
                            <DialogHeader><DialogTitle>Tambah Kandidat Vendor</DialogTitle></DialogHeader>
                            <div className="grid gap-4 py-4">
                                <Input placeholder="Nama Vendor" value={newVendor.name} onChange={e => setNewVendor({ ...newVendor, name: e.target.value })} />
                                <div className="grid grid-cols-2 gap-4">
                                    <Input type="number" placeholder="Harga Foto Only" value={newVendor.price_photo} onChange={e => setNewVendor({ ...newVendor, price_photo: e.target.value })} />
                                    <Input type="number" placeholder="Harga Video" value={newVendor.price_video} onChange={e => setNewVendor({ ...newVendor, price_video: e.target.value })} />
                                </div>
                                <Input placeholder="Link Portfolio / IG" value={newVendor.reference_link} onChange={e => setNewVendor({ ...newVendor, reference_link: e.target.value })} />
                            </div>
                            <DialogFooter><Button onClick={addVendor} className="bg-[#D8B0B0]">Simpan</Button></DialogFooter>
                        </DialogContent>
                    </Dialog>
                </TabsContent>

            </Tabs>
        </div>
    )
}
