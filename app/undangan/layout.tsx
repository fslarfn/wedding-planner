export default function UndanganLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="undangan-scroll h-dvh w-full overflow-y-auto overflow-x-hidden bg-[#FBF7F4]">
            {children}
        </div>
    )
}
