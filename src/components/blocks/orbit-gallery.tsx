"use client"

import dynamic from "next/dynamic"
import { Suspense } from "react"

// Canvas + OrbitControls must be client-only — no SSR for WebGL
const OrbitGalleryInner = dynamic(
  () => import("./orbit-gallery-inner"),
  { ssr: false }
)

export function OrbitGallery({ className }: { className?: string }) {
  return (
    <div className={className}>
      <Suspense fallback={
        <div className="w-full h-full flex items-center justify-center">
          <div className="w-10 h-10 rounded-full border-2 border-[#2ECC88] border-t-transparent animate-spin" />
        </div>
      }>
        <OrbitGalleryInner />
      </Suspense>
    </div>
  )
}
