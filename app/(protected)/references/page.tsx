export default function ReferencesPage() {
    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-800">Referensi Vendor</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {['Venue', 'Catering', 'MUA', 'Attire', 'Decoration', 'Documentation'].map(category => (
                    <div key={category} className="bg-white p-6 rounded-xl shadow border hover:shadow-md transition-shadow cursor-pointer">
                        <h3 className="text-xl font-semibold text-[#D8B0B0]">{category}</h3>
                        <p className="text-sm text-gray-500 mt-2">Lihat daftar vendor {category} pilihan.</p>
                    </div>
                ))}
            </div>
        </div>
    )
}
