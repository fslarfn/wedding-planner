"use client"

import { motion } from "framer-motion"
import { GOLD, GREEN, GREEN_SOFT } from "@/lib/photobooth/theme"

/** Kartu polaroid perlahan keluar dari mulut mesin cetak, seperti photobooth sungguhan. */
export default function PrintingAnimation() {
    return (
        <div className="w-full max-w-md mx-auto px-6 py-16 flex flex-col items-center gap-8">
            <div className="relative w-56">
                {/* Mulut mesin digambar di atas kartu supaya kartu terlihat muncul dari dalam. */}
                <div
                    className="absolute inset-x-0 top-0 z-10 h-8 rounded-md shadow-lg"
                    style={{ backgroundColor: GREEN }}
                />
                <div className="overflow-hidden pt-5">
                    <motion.div
                        initial={{ y: "-100%" }}
                        animate={{ y: 0 }}
                        transition={{ duration: 2, ease: "easeOut" }}
                        className="bg-white p-3 pb-10 shadow-xl"
                    >
                        <div className="aspect-[4/5] w-full" style={{ backgroundColor: GREEN_SOFT }} />
                    </motion.div>
                </div>
            </div>

            <motion.p
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 1.6, repeat: Infinity }}
                className="text-xs tracking-[0.35em] uppercase"
                style={{ color: GOLD }}
            >
                Mencetak momen
            </motion.p>
        </div>
    )
}
