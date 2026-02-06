"use client"

import React, { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { formatRupiah, cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog"
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table"
import { Plus, Trash2, Edit2, Wallet, TrendingUp, CheckCircle2, AlertCircle } from "lucide-react"

export default function BudgetPage() {
    const [items, setItems] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [isDialogOpen, setIsDialogOpen] = useState(false)

    // Form State
    const [formData, setFormData] = useState({
        id: "",
        category: "Venue",
        description: "",
        quantity: "1",
        unit_price: "",
        vendor: "",
        actual_amount: "", // Harga Deal / Total Real
        paid_amount: ""
    })

    // Categories
    const CATEGORIES = ["Venue", "Catering", "Dekorasi", "MUA & Attire", "Dokumentasi", "Hiburan", "Souvenir", "Lainnya"]

    useEffect(() => { fetchBudgets() }, [])

    async function fetchBudgets() {
        try {
            const { data } = await supabase.from('budgets').select('*').order('category', { ascending: true })
            if (data) setItems(data)
        } finally { setLoading(false) }
    }

    function resetForm() {
        setFormData({
            id: "", category: "Venue", description: "", quantity: "1", unit_price: "", vendor: "", actual_amount: "", paid_amount: ""
        })
    }

    function handleEdit(item: any) {
        setFormData({
            id: item.id,
            category: item.category,
            description: item.description,
            quantity: item.quantity?.toString() || "1",
            unit_price: item.unit_price?.toString() || (item.planned_amount / (item.quantity || 1)).toString(),
            vendor: item.vendor || "",
            actual_amount: item.actual_amount?.toString() || "",
            paid_amount: item.paid_amount?.toString() || ""
        })
        setIsDialogOpen(true)
    }

    async function handleSave() {
        const qty = parseFloat(formData.quantity) || 1
        const unitPrice = parseFloat(formData.unit_price) || 0
        const plannedTotal = qty * unitPrice
        const dealPrice = parseFloat(formData.actual_amount) || 0
        const paid = parseFloat(formData.paid_amount) || 0

        // Auto determine status
        let status = "Belum Lunas"
        if (dealPrice > 0) {
            if (paid >= dealPrice) status = "Lunas"
            else if (paid > 0) status = "DP"
            else status = "Belum Bayar"
        }

        const payload = {
            category: formData.category,
            description: formData.description,
            quantity: qty,
            unit_price: unitPrice,
            planned_amount: plannedTotal,
            vendor: formData.vendor,
            actual_amount: dealPrice,
            paid_amount: paid,
            status: status
        }

        if (formData.id) {
            await supabase.from('budgets').update(payload).eq('id', formData.id)
        } else {
            await supabase.from('budgets').insert([payload])
        }

        setIsDialogOpen(false)
        resetForm()
        fetchBudgets()
    }

    async function handleDelete(id: string) {
        if (confirm("Hapus item ini?")) {
            await supabase.from('budgets').delete().eq('id', id)
            fetchBudgets()
        }
    }

    // Calculations & Grouping
    const grouped = items.reduce((acc: any, item: any) => {
        if (!acc[item.category]) acc[item.category] = []
        acc[item.category].push(item)
        return acc
    }, {})

    const totalPlan = items.reduce((sum, i) => sum + (i.planned_amount || 0), 0)
    const totalDeal = items.reduce((sum, i) => sum + (i.actual_amount || 0), 0)
    const totalPaid = items.reduce((sum, i) => sum + (i.paid_amount || 0), 0)
    const totalRemaining = totalDeal - totalPaid

    return (
        <div className="space-y-6 pb-20">
            {/* Top Summaries */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-slate-900 text-white border-0 shadow-lg">
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-slate-300">Total Estimasi</CardTitle></CardHeader>
                    <CardContent><div className="text-xl md:text-2xl font-bold">{formatRupiah(totalPlan)}</div></CardContent>
                </Card>
                <Card className="bg-white border-slate-200 shadow-sm">
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-slate-500">Total Deal (Real)</CardTitle></CardHeader>
                    <CardContent><div className="text-xl md:text-2xl font-bold text-slate-900">{formatRupiah(totalDeal)}</div></CardContent>
                </Card>
                <Card className="bg-blue-50 border-blue-100 shadow-sm">
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-blue-600">Sudah Dibayar</CardTitle></CardHeader>
                    <CardContent><div className="text-xl md:text-2xl font-bold text-blue-700">{formatRupiah(totalPaid)}</div></CardContent>
                </Card>
                <Card className="bg-amber-50 border-amber-100 shadow-sm">
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-amber-600">Sisa Tagihan</CardTitle></CardHeader>
                    <CardContent><div className="text-xl md:text-2xl font-bold text-amber-700">{formatRupiah(totalRemaining)}</div></CardContent>
                </Card>
            </div>

            {/* Actions */}
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-900">Budget Tracker</h2>
                <div className="flex gap-2">
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button onClick={resetForm} className="bg-blue-600 hover:bg-blue-700 text-white"><Plus className="w-4 h-4 mr-2" /> Item Baru</Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader><DialogTitle>{formData.id ? "Edit Budget Item" : "Tambah Budget Item"}</DialogTitle></DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-2">
                                        <label className="text-xs font-semibold mb-1 block text-slate-500">Kategori</label>
                                        <select
                                            className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                                            value={formData.category}
                                            onChange={e => setFormData({ ...formData, category: e.target.value })}
                                        >
                                            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                    <div className="col-span-2">
                                        <label className="text-xs font-semibold mb-1 block text-slate-500">Nama Item</label>
                                        <Input value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Contoh: Catering 500 Pax" />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="text-xs font-semibold mb-1 block text-slate-500">Vendor (Opsional)</label>
                                        <Input value={formData.vendor} onChange={e => setFormData({ ...formData, vendor: e.target.value })} placeholder="Nama Vendor" />
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold mb-1 block text-slate-500">Qty</label>
                                        <Input type="number" value={formData.quantity} onChange={e => setFormData({ ...formData, quantity: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold mb-1 block text-slate-500">Harga Satuan</label>
                                        <Input type="number" value={formData.unit_price} onChange={e => setFormData({ ...formData, unit_price: e.target.value })} />
                                    </div>
                                    <div className="col-span-2 bg-slate-50 p-3 rounded-lg border border-slate-100">
                                        <p className="text-xs text-slate-500 mb-1">Total Estimasi (Planned)</p>
                                        <p className="font-mono font-bold text-lg text-slate-700">{formatRupiah((parseFloat(formData.quantity) || 0) * (parseFloat(formData.unit_price) || 0))}</p>
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold mb-1 block text-slate-500">Harga Deal (Actual)</label>
                                        <Input type="number" value={formData.actual_amount} onChange={e => setFormData({ ...formData, actual_amount: e.target.value })} placeholder="0" />
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold mb-1 block text-slate-500">Sudah Dibayar</label>
                                        <Input type="number" value={formData.paid_amount} onChange={e => setFormData({ ...formData, paid_amount: e.target.value })} placeholder="0" />
                                    </div>
                                </div>
                            </div>
                            <DialogFooter><Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white">Simpan</Button></DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Budget Groups */}
            <div className="space-y-8">
                {Object.keys(grouped).map((category) => {
                    const groupItems = grouped[category]
                    const subPlanned = groupItems.reduce((sum: number, i: any) => sum + (i.planned_amount || 0), 0)
                    const subActual = groupItems.reduce((sum: number, i: any) => sum + (i.actual_amount || 0), 0)
                    const subPaid = groupItems.reduce((sum: number, i: any) => sum + (i.paid_amount || 0), 0)

                    return (
                        <Card key={category} className="overflow-hidden border-t-4 border-t-blue-500 shadow-md">
                            <CardHeader className="bg-slate-50 py-3 px-4 border-b border-slate-100">
                                <div className="flex flex-col md:flex-row justify-between md:items-center gap-2">
                                    <CardTitle className="text-lg font-bold text-slate-800">{category}</CardTitle>
                                    <div className="flex gap-4 text-xs md:text-sm">
                                        <div className="text-slate-500">Plan: <span className="font-semibold text-slate-700">{formatRupiah(subPlanned)}</span></div>
                                        <div className="text-slate-500">Real: <span className="font-semibold text-slate-700">{formatRupiah(subActual)}</span></div>
                                        <div className="text-blue-600">Sisa: <span className="font-bold">{formatRupiah(subActual - subPaid)}</span></div>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="hover:bg-slate-50/50">
                                                <TableHead className="w-[30%]">Item & Vendor</TableHead>
                                                <TableHead className="text-right">Qty x Harga</TableHead>
                                                <TableHead className="text-right">Estimasi</TableHead>
                                                <TableHead className="text-right font-bold text-slate-700 bg-slate-50/50">Harga Deal</TableHead>
                                                <TableHead className="text-right">Terbayar</TableHead>
                                                <TableHead className="text-center">Status</TableHead>
                                                <TableHead className="w-[80px]"></TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {groupItems.map((item: any) => {
                                                let status = "Belum"
                                                if (item.actual_amount > 0) {
                                                    if (item.paid_amount >= item.actual_amount) status = "Lunas"
                                                    else if (item.paid_amount > 0) status = "DP"
                                                    else status = "Bill"
                                                }

                                                return (
                                                    <TableRow key={item.id} className="group hover:bg-blue-50/30 transition-colors">
                                                        <TableCell>
                                                            <div className="font-medium text-slate-900">{item.description}</div>
                                                            {item.vendor && (
                                                                <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                                                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-300"></span>
                                                                    {item.vendor}
                                                                </div>
                                                            )}
                                                        </TableCell>
                                                        <TableCell className="text-right text-xs text-slate-500">
                                                            {item.quantity} x {formatRupiah(item.unit_price)}
                                                        </TableCell>
                                                        <TableCell className="text-right font-mono text-slate-600">{formatRupiah(item.planned_amount)}</TableCell>
                                                        <TableCell className="text-right font-mono font-bold text-slate-900 bg-slate-50/30">{formatRupiah(item.actual_amount)}</TableCell>
                                                        <TableCell className="text-right font-mono text-blue-700">{formatRupiah(item.paid_amount)}</TableCell>
                                                        <TableCell className="text-center">
                                                            <span className={cn(
                                                                "px-2 py-0.5 rounded text-[10px] font-bold uppercase border",
                                                                status === 'Lunas' ? "bg-green-50 text-green-700 border-green-200" :
                                                                    status === 'DP' ? "bg-amber-50 text-amber-700 border-amber-200" :
                                                                        "bg-slate-100 text-slate-400 border-slate-200"
                                                            )}>
                                                                {status}
                                                            </span>
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="flex justify-end gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                                                <Button size="icon" variant="ghost" className="h-7 w-7 text-slate-400 hover:text-blue-600 hover:bg-blue-50" onClick={() => handleEdit(item)}>
                                                                    <Edit2 className="w-3.5 h-3.5" />
                                                                </Button>
                                                                <Button size="icon" variant="ghost" className="h-7 w-7 text-slate-400 hover:text-red-600 hover:bg-red-50" onClick={() => handleDelete(item.id)}>
                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                </Button>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                )
                                            })}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    )
                })}
            </div>
        </div>
    )
}
