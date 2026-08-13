// Halaman publik tanpa sidebar dashboard, sejajar dengan app/undangan/layout.tsx.
// Wadah scroll-nya sendiri karena `body` di globals.css sengaja dikunci overflow-hidden.
export default function KenanganLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="no-scrollbar h-dvh w-full overflow-y-auto overflow-x-hidden bg-[#FBF8F2]">
            {children}
        </div>
    )
}
