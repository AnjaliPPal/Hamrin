"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import { cn } from "@/lib/utils"

interface Feature {
  step: string
  title?: string
  content: string
  image: string
  tag?: string
}

interface FeatureStepsProps {
  features: Feature[]
  className?: string
  label?: string
  title?: string
  autoPlayInterval?: number
}

export function FeatureSteps({
  features,
  className,
  label = "How it works",
  title = "Up and running in minutes",
  autoPlayInterval = 4000,
}: FeatureStepsProps) {
  const [current, setCurrent] = useState(0)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const tick = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          setCurrent((c) => (c + 1) % features.length)
          return 0
        }
        return p + 100 / (autoPlayInterval / 100)
      })
    }, 100)
    return () => clearInterval(tick)
  }, [features.length, autoPlayInterval])

  const jump = (i: number) => { setCurrent(i); setProgress(0) }

  return (
    <div className={cn("bg-white", className)}>
      <div className="max-w-[1100px] mx-auto px-6 py-20 md:py-24">

        {/* ── Section header ── */}
        <div className="mb-14 max-w-[560px]">
          <p className="text-xs font-semibold text-[#2ECC88] uppercase tracking-[0.18em] mb-3">
            {label}
          </p>
          <h2 className="text-[2rem] sm:text-[2.5rem] font-black text-gray-900 leading-[1.08] tracking-tight">
            {title}
          </h2>
        </div>

        {/* ── Two-column layout ── */}
        <div className="grid md:grid-cols-[1fr_1.05fr] gap-10 lg:gap-16 items-start">

          {/* LEFT — step list */}
          <div className="flex flex-col gap-2">
            {features.map((feature, i) => {
              const isActive = i === current
              const isDone   = i < current
              return (
                <button
                  key={i}
                  onClick={() => jump(i)}
                  className={cn(
                    "w-full text-left rounded-2xl px-5 py-5 transition-all duration-300 group",
                    isActive
                      ? "bg-gray-50 border border-gray-100 shadow-sm"
                      : "bg-transparent hover:bg-gray-50/60 border border-transparent"
                  )}
                >
                  <div className="flex items-start gap-4">
                    {/* Number / check dot */}
                    <div className={cn(
                      "w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-bold mt-0.5 transition-all duration-300",
                      isActive ? "bg-gray-900 text-white" :
                      isDone   ? "bg-[#2ECC88] text-white" :
                                 "bg-gray-100 text-gray-400"
                    )}>
                      {isDone ? (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <span>{i + 1}</span>
                      )}
                    </div>

                    {/* Text */}
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        "font-bold leading-snug transition-colors duration-200",
                        isActive ? "text-gray-900 text-[16px]" : "text-gray-400 text-[15px]"
                      )}>
                        {feature.title || feature.step}
                      </p>

                      {/* Description — only fully visible when active */}
                      <AnimatePresence initial={false}>
                        {isActive && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.25, ease: "easeInOut" }}
                          >
                            <p className="text-sm text-gray-500 mt-1.5 leading-relaxed">
                              {feature.content}
                            </p>
                            {/* Progress bar */}
                            <div className="mt-3 h-[3px] w-full bg-gray-100 rounded-full overflow-hidden">
                              <motion.div
                                className="h-[3px] bg-gray-900 rounded-full origin-left"
                                style={{ scaleX: progress / 100 }}
                                transition={{ duration: 0.08, ease: "linear" }}
                              />
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>

          {/* RIGHT — image panel */}
          <div
            className="relative w-full rounded-[20px] overflow-hidden bg-gray-100 sticky top-24"
            style={{ aspectRatio: "4/3" }}
          >
            <AnimatePresence mode="wait">
              {features.map((feature, i) =>
                i === current ? (
                  <motion.div
                    key={i}
                    className="absolute inset-0"
                    initial={{ opacity: 0, scale: 1.03 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
                  >
                    <Image
                      src={feature.image}
                      alt={feature.title ?? feature.step}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 50vw"
                      priority={i === 0}
                    />
                    {/* Step tag on image */}
                    <div className="absolute top-4 left-4 z-10">
                      <span className="inline-flex items-center gap-1.5 bg-white/90 backdrop-blur-sm text-xs font-semibold text-gray-700 px-3 py-1.5 rounded-full shadow-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#2ECC88]" />
                        Step {i + 1} of {features.length}
                      </span>
                    </div>
                    {/* Bottom scrim */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent" />
                    {/* Title overlay at bottom */}
                    <div className="absolute bottom-0 left-0 right-0 p-5 z-10">
                      <p className="text-white font-bold text-[15px] leading-snug drop-shadow-sm">
                        {feature.title || feature.step}
                      </p>
                    </div>
                  </motion.div>
                ) : null
              )}
            </AnimatePresence>

            {/* Dot indicators */}
            <div className="absolute bottom-4 right-4 flex gap-1.5 z-20">
              {features.map((_, i) => (
                <button
                  key={i}
                  onClick={() => jump(i)}
                  aria-label={`Go to step ${i + 1}`}
                  className={cn(
                    "rounded-full transition-all duration-300",
                    i === current
                      ? "w-5 h-1.5 bg-white"
                      : "w-1.5 h-1.5 bg-white/50 hover:bg-white/80"
                  )}
                />
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
