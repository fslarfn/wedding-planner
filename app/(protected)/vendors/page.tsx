"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { formatRupiah, cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Store, Phone, Instagram, Globe, Plus, Search, ExternalLink, Calculator, DollarSign, Calendar } from "lucide-react"

export default function VendorsPage() {
    const [vendors, setVendors] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState("")

    // States for Dialogs
    const [isAddOpen, setIsAddOpen] = useState(false)
    const [newVendor, setNewVendor] = useState({ name: "", category: "Venue", contact_name: "", phone: "", instagram: "", total_price: "" })

    // Detail & Payment State
    const [selectedVendor, setSelectedVendor] = useState<any | null>(null)
    const [payments, setPayments] = useState<any[]>([])
    const [isPaymentOpen, setIsPaymentOpen] = useState(false)
    const [newPayment, setNewPayment] = useState({ amount: "", description: "", payment_date: new Date().toISOString().split('T')[0] })

    useEffect(() => {
        fetchVendors()
    }, [])

    async function fetchVendors() {
        setLoading(true)
        const { data } = await supabase.from('vendors_detailed').select('*').order('created_at', { ascending: false })
        if (data) setVendors(data)
        setLoading(false)
    }

    async function fetchPayments(vendorId: string) {
        const { data } = await supabase.from('vendor_payments').select('*').eq('vendor_id', vendorId).order('payment_date', { ascending: false })
        if (data) setPayments(data)
    }

    // --- ACTIONS ---
    async function handleAddVendor() {
        if (!newVendor.name) return
        await supabase.from('vendors_detailed').insert([{
            ...newVendor,
            total_price: parseFloat(newVendor.total_price) || 0
        }])
        setIsAddOpen(false)
        setNewVendor({ name: "", category: "Venue", contact_name: "", phone: "", instagram: "", total_price: "" })
        fetchVendors()
    }

    async function handleAddPayment() {
        if (!selectedVendor || !newPayment.amount) return

        const amount = parseFloat(newPayment.amount)

        // 1. Add to Payment History
        await supabase.from('vendor_payments').insert([{
            vendor_id: selectedVendor.id,
            amount: amount,
            description: newPayment.description,
            payment_date: newPayment.payment_date
        }])

        // 2. Update Vendor Paid Amount
        const currentPaid = selectedVendor.paid_amount || 0
        const newPaid = currentPaid + amount

        // Determine status
        let newStatus = selectedVendor.status
        if (newPaid > 0 && newPaid < selectedVendor.total_price) newStatus = 'booked'
        if (newPaid >= selectedVendor.total_price) newStatus = 'paid_off'

        await supabase.from('vendors_detailed').update({ paid_amount: newPaid, status: newStatus }).eq('id', selectedVendor.id)

        // Reset & Refresh
        setIsPaymentOpen(false)
        setNewPayment({ amount: "", description: "", payment_date: new Date().toISOString().split('T')[0] })

        // Refresh Current View
        const { data: updatedVendor } = await supabase.from('vendors_detailed').select('*').eq('id', selectedVendor.id).single()
        setSelectedVendor(updatedVendor)
        fetchPayments(selectedVendor.id)
        fetchVendors() // Update list view too
    }

    async function openDetail(vendor: any) {
        setSelectedVendor(vendor)
        await fetchPayments(vendor.id)
    }

    // --- FILTERS ---
    const filteredVendors = vendors.filter(v =>
        v.name.toLowerCase().includes(search.toLowerCase()) ||
        v.category.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div className="space-y-6 pb-20">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
                        <Store className="w-8 h-8 text-blue-600" /> Vendor Management
                    </h1>
                    <p className="text-slate-500">Kelola kontrak vendor, kontak, dan jadwal pembayaran.</p>
                </div>
                <Button onClick={() => setIsAddOpen(true)} className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="w-4 h-4 mr-2" /> Tambah Vendor
                </Button>
            </div>

            {/* Search Bar */}
            <div className="relative">
                <Search className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                <Input
                    placeholder="Cari vendor (nama atau kategori)..."
                    className="pl-10 h-12 text-lg bg-white"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
            </div>

            {/* Vendor Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredVendors.map(vendor => {
                    const progress = vendor.total_price > 0 ? (vendor.paid_amount / vendor.total_price) * 100 : 0

                    return (
                        <Card key={vendor.id} className="hover:shadow-lg transition-all cursor-pointer group" onClick={() => openDetail(vendor)}>
                            <CardHeader className="pb-2">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <span className="text-xs font-bold uppercase text-blue-500 tracking-wider">{vendor.category}</span>
                                        <CardTitle className="text-xl mt-1 text-slate-800 group-hover:text-blue-600 transition-colors">{vendor.name}</CardTitle>
                                    </div>
                                    <div className={cn(
                                        "px-2 py-1 rounded text-xs font-bold uppercase",
                                        vendor.status === 'paid_off' ? "bg-green-100 text-green-700" :
                                            vendor.status === 'booked' ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-600"
                                    )}>
                                        {vendor.status === 'paid_off' ? 'LUNAS' : vendor.status === 'booked' ? 'DP' : 'PENDING'}
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-1">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-500">Terbayar</span>
                                        <span className="font-bold text-slate-800">{formatRupiah(vendor.paid_amount)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-500">Total Kontrak</span>
                                        <span className="font-medium text-slate-800">{formatRupiah(vendor.total_price)}</span>
                                    </div>
                                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden mt-1">
                                        <div className={cn("h-full transition-all", progress >= 100 ? "bg-green-500" : "bg-blue-500")} style={{ width: `${Math.min(progress, 100)}%` }} />
                                    </div>
                                </div>

                                <div className="flex gap-2 pt-2 border-t border-slate-100">
                                    {vendor.instagram && (
                                        <a href={`https://instagram.com/${vendor.instagram}`} target="_blank" onClick={e => e.stopPropagation()} className="p-2 bg-slate-50 rounded-full hover:bg-pink-50 hover:text-pink-600 transition-colors">
                                            <Instagram className="w-4 h-4" />
                                        </a>
                                    )}
                                    {vendor.phone && (
                                        <a href={`https://wa.me/${vendor.phone}`} target="_blank" onClick={e => e.stopPropagation()} className="p-2 bg-slate-50 rounded-full hover:bg-green-50 hover:text-green-600 transition-colors">
                                            <Phone className="w-4 h-4" />
                                        </a>
                                    )}
                                    {vendor.website && (
                                        <a href={vendor.website} target="_blank" onClick={e => e.stopPropagation()} className="p-2 bg-slate-50 rounded-full hover:bg-blue-50 hover:text-blue-600 transition-colors">
                                            <Globe className="w-4 h-4" />
                                        </a>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    )
                })}
            </div>

            {/* --- ADD VENDOR DIALOG --- */}
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Tambah Vendor Baru</DialogTitle></DialogHeader>
                    <div className="grid gap-4 py-4">
                        <Input placeholder="Nama Vendor (e.g., Plataran Dharmawangsa)" value={newVendor.name} onChange={e => setNewVendor({ ...newVendor, name: e.target.value })} />
                        <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={newVendor.category} onChange={e => setNewVendor({ ...newVendor, category: e.target.value })}>
                            <option value="Venue">Venue</option>
                            <option value="Catering">Catering</option>
                            <option value="Decoration">Decoration</option>
                            <option value="MUA">Make Up Artist</option>
                            <option value="Attire">Attire / Busana</option>
                            <option value="Photography">Photography</option>
                            <option value="Entertainment">Entertainment</option>
                            <option value="WO">Organizer / WO</option>
                            <option value="Souvenir">Souvenir</option>
                            <option value="Other">Lainnya</option>
                        </select>
                        <Input type="number" placeholder="Nilai Kontrak (Total Harga)" value={newVendor.total_price} onChange={e => setNewVendor({ ...newVendor, total_price: e.target.value })} />
                        <hr />
                        <Input placeholder="Nama Kontak (CP)" value={newVendor.contact_name} onChange={e => setNewVendor({ ...newVendor, contact_name: e.target.value })} />
                        <Input placeholder="No. HP / WhatsApp" value={newVendor.phone} onChange={e => setNewVendor({ ...newVendor, phone: e.target.value })} />
                        <Input placeholder="Username Instagram (tanpa @)" value={newVendor.instagram} onChange={e => setNewVendor({ ...newVendor, instagram: e.target.value })} />
                    </div>
                    <DialogFooter><Button onClick={handleAddVendor} className="bg-blue-600">Simpan Vendor</Button></DialogFooter>
                </DialogContent>
            </Dialog>

            {/* --- VENDOR DETAIL DIALOG --- */}
            <Dialog open={!!selectedVendor} onOpenChange={(open: boolean) => !open && setSelectedVendor(null)}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    {selectedVendor && (
                        <>
                            <DialogHeader>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="text-sm font-bold text-blue-600 uppercase mb-1">{selectedVendor.category}</div>
                                        <DialogTitle className="text-2xl">{selectedVendor.name}</DialogTitle>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xs text-slate-500">Next Payment</div>
                                        <div className="font-bold text-slate-800">
                                            {selectedVendor.paid_amount >= selectedVendor.total_price ? "LUNAS" : formatRupiah(selectedVendor.total_price - selectedVendor.paid_amount)}
                                        </div>
                                    </div>
                                </div>
                            </DialogHeader>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-4">
                                <div className="space-y-4">
                                    <div className="bg-slate-50 p-4 rounded-lg space-y-2">
                                        <h4 className="font-semibold text-sm text-slate-700 flex items-center gap-2"><Phone className="w-4 h-4" /> Kontak</h4>
                                        <p className="text-sm">{selectedVendor.contact_name || "-"}</p>
                                        <p className="text-sm font-mono">{selectedVendor.phone || "-"}</p>
                                        <p className="text-sm text-blue-600">@{selectedVendor.instagram || "-"}</p>
                                    </div>
                                    <div className="bg-slate-50 p-4 rounded-lg space-y-2">
                                        <h4 className="font-semibold text-sm text-slate-700 flex items-center gap-2"><Calculator className="w-4 h-4" /> Summary</h4>
                                        <div className="flex justify-between text-sm"><span>Total Kontrak</span> <span className="font-bold">{formatRupiah(selectedVendor.total_price)}</span></div>
                                        <div className="flex justify-between text-sm text-green-600"><span>Sudah Bayar</span> <span className="font-bold">{formatRupiah(selectedVendor.paid_amount)}</span></div>
                                        <div className="flex justify-between text-sm text-red-600 border-t pt-2"><span>Sisa</span> <span className="font-bold">{formatRupiah(selectedVendor.total_price - selectedVendor.paid_amount)}</span></div>
                                    </div>
                                </div>

                                <div>
                                    <div className="flex justify-between items-center mb-3">
                                        <h4 className="font-bold text-slate-800">Riwayat Pembayaran</h4>
                                        <Button size="sm" variant="outline" className="h-8" onClick={() => setIsPaymentOpen(true)} disabled={selectedVendor.paid_amount >= selectedVendor.total_price}>
                                            <Plus className="w-3 h-3 mr-1" /> Bayar
                                        </Button>
                                    </div>
                                    <div className="space-y-3">
                                        {payments.length === 0 ? (
                                            <p className="text-sm text-slate-400 italic text-center py-4">Belum ada pembayaran.</p>
                                        ) : (
                                            payments.map(p => (
                                                <div key={p.id} className="flex justify-between items-center p-3 border rounded-lg hover:bg-slate-50">
                                                    <div>
                                                        <div className="font-bold text-slate-800">{formatRupiah(p.amount)}</div>
                                                        <div className="text-xs text-slate-500">{p.description}</div>
                                                    </div>
                                                    <div className="text-xs text-slate-400 text-right">
                                                        {new Date(p.payment_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>

            {/* --- ADD PAYMENT DIALOG (Nested) --- */}
            <Dialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Catat Pembayaran Baru</DialogTitle></DialogHeader>
                    <div className="grid gap-4 py-4">
                        <Input type="number" placeholder="Jumlah Pembayaran (Rp)" value={newPayment.amount} onChange={e => setNewPayment({ ...newPayment, amount: e.target.value })} />
                        <Input placeholder="Keterangan (e.g., DP 30%, Termin 1)" value={newPayment.description} onChange={e => setNewPayment({ ...newPayment, description: e.target.value })} />
                        <Input type="date" value={newPayment.payment_date} onChange={e => setNewPayment({ ...newPayment, payment_date: e.target.value })} />
                    </div>
                    <DialogFooter><Button onClick={handleAddPayment} className="bg-green-600 hover:bg-green-700">Simpan Pembayaran</Button></DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
