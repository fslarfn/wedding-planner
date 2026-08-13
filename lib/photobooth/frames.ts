// Bingkai polaroid yang bisa dipilih tamu di photobooth.
//
// Aset di public/photobooth/frames/ digambar DI ATAS foto, jadi file bingkai wajib
// punya area transparan di posisi slot — dengan begitu ornamen bisa menimpa tepi foto.
// File SVG yang ada sekarang cuma sementara; kalau bingkai asli sudah siap, ganti
// `src` ke file baru lalu sesuaikan `width`, `height`, dan `slots`.
//
// Koordinat ditulis sebagai pembagian piksel/dimensi (mis. 72/1080) supaya angka
// aslinya tetap terbaca saat mencocokkan dengan file desain, tapi nilainya tetap
// pecahan 0-1 sehingga render tidak terikat resolusi keluaran.

export type Slot = { x: number; y: number; w: number; h: number }

export type Frame = {
    id: string
    label: string
    /** Berapa foto yang harus diambil = jumlah slot. */
    slots: Slot[]
    src: string
    /** Dimensi asli aset bingkai; jadi resolusi kanvas hasil. */
    width: number
    height: number
    /**
     * Area kosong di bawah bingkai untuk nama mempelai & tanggal.
     * Bingkai yang namanya sudah tercetak di dalam asetnya cukup menghilangkan ini.
     */
    caption?: { y: number; h: number }
}

export const FRAMES: Frame[] = [
    {
        id: "single",
        label: "Satu Foto",
        src: "/photobooth/frames/single.svg",
        width: 1080,
        height: 1440,
        slots: [{ x: 72 / 1080, y: 72 / 1440, w: 936 / 1080, h: 1044 / 1440 }],
        caption: { y: 1116 / 1440, h: 324 / 1440 },
    },
    {
        id: "duo",
        label: "Dua Foto",
        src: "/photobooth/frames/duo.svg",
        width: 1080,
        height: 1620,
        slots: [
            { x: 72 / 1080, y: 72 / 1620, w: 936 / 1080, h: 639 / 1620 },
            { x: 72 / 1080, y: 741 / 1620, w: 936 / 1080, h: 639 / 1620 },
        ],
        caption: { y: 1380 / 1620, h: 240 / 1620 },
    },
    {
        id: "strip",
        label: "Strip Tiga Foto",
        src: "/photobooth/frames/strip.svg",
        width: 1080,
        height: 2160,
        slots: [
            { x: 90 / 1080, y: 60 / 2160, w: 900 / 1080, h: 574 / 2160 },
            { x: 90 / 1080, y: 658 / 2160, w: 900 / 1080, h: 574 / 2160 },
            { x: 90 / 1080, y: 1256 / 2160, w: 900 / 1080, h: 574 / 2160 },
        ],
        caption: { y: 1830 / 2160, h: 330 / 2160 },
    },
]

export function getFrame(id: string): Frame {
    return FRAMES.find(f => f.id === id) ?? FRAMES[0]
}
