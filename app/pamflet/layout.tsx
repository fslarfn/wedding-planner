// Halaman cetak berdiri sendiri: tanpa sidebar dashboard dan tanpa wadah tinggi-layar
// milik halaman tamu, karena keduanya mengacaukan penomoran halaman saat dicetak.
export default function PamfletLayout({ children }: { children: React.ReactNode }) {
    return <div className="min-h-dvh w-full overflow-y-auto bg-[#EDE9E1]">{children}</div>
}
