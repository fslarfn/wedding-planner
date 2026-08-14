"use client"

import { Printer } from "lucide-react"

/** Dialog cetak browser adalah jalan menuju PDF A4; tidak ada logika lain di sini. */
export default function PrintButton() {
    return (
        <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-md bg-[#24463A] px-5 py-3 text-xs uppercase tracking-[0.25em] text-white"
        >
            <Printer className="h-4 w-4" /> Cetak / Simpan PDF
        </button>
    )
}
