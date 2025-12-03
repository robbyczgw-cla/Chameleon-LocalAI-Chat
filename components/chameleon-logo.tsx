"use client"

import type React from "react"
import { cn } from "@/lib/utils"

interface ChameleonLogoProps {
  className?: string
  size?: number
  animated?: boolean
  colorShift?: boolean
}

export function ChameleonLogo({
  className = "",
  size = 24,
  animated = false,
  colorShift = false
}: ChameleonLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn(className, colorShift && "chameleon-color-shift")}
    >
      {animated && (
        <defs>
          <linearGradient id="chameleonGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#22c55e" stopOpacity="1">
              <animate
                attributeName="stop-color"
                values="#22c55e; #3b82f6; #a855f7; #ec4899; #f97316; #eab308; #22c55e"
                dur="10s"
                repeatCount="indefinite"
              />
            </stop>
            <stop offset="50%" stopColor="#3b82f6" stopOpacity="1">
              <animate
                attributeName="stop-color"
                values="#3b82f6; #a855f7; #ec4899; #f97316; #eab308; #22c55e; #3b82f6"
                dur="10s"
                repeatCount="indefinite"
              />
            </stop>
            <stop offset="100%" stopColor="#a855f7" stopOpacity="1">
              <animate
                attributeName="stop-color"
                values="#a855f7; #ec4899; #f97316; #eab308; #22c55e; #3b82f6; #a855f7"
                dur="10s"
                repeatCount="indefinite"
              />
            </stop>
          </linearGradient>
        </defs>
      )}

      {/* Chameleon body - scaled up and centered */}
      <path
        d="M 50 110 Q 35 95 35 80 Q 35 50 62 42 Q 90 37 120 48 Q 142 55 148 80 Q 151 95 141 115 Q 133 130 120 137 L 90 144 Q 68 144 50 130 Z"
        fill={animated ? "url(#chameleonGradient)" : "#22c55e"}
        opacity="0.9"
      />

      {/* Chameleon head - scaled up */}
      <ellipse
        cx="62"
        cy="65"
        rx="33"
        ry="29"
        fill={animated ? "url(#chameleonGradient)" : "#16a34a"}
        opacity="0.95"
      />

      {/* Eye background (white) - scaled up */}
      <circle cx="70" cy="58" r="11" fill="white" />

      {/* Eye pupil - scaled up */}
      <circle cx="73" cy="58" r="5.5" fill="#1e293b" />

      {/* Chameleon crest/head ridge - scaled up */}
      <path
        d="M 42 52 Q 35 45 38 40 Q 41 37 47 40 Q 50 45 47 50 Z"
        fill={animated ? "url(#chameleonGradient)" : "#15803d"}
        opacity="0.8"
      />

      {/* Chameleon tail (curled) - scaled up */}
      <path
        d="M 120 137 Q 135 144 148 137 Q 162 130 168 123 Q 172 116 168 109 Q 164 103 158 106 Q 154 109 150 116 Q 144 126 135 130 Z"
        fill={animated ? "url(#chameleonGradient)" : "#16a34a"}
        stroke={animated ? "url(#chameleonGradient)" : "#15803d"}
        strokeWidth="3"
        opacity="0.85"
      />

      {/* Chameleon legs - scaled up */}
      <path
        d="M 62 120 L 55 142 L 48 150"
        stroke={animated ? "url(#chameleonGradient)" : "#15803d"}
        strokeWidth="5"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M 90 128 L 90 147 L 83 156"
        stroke={animated ? "url(#chameleonGradient)" : "#15803d"}
        strokeWidth="5"
        strokeLinecap="round"
        fill="none"
      />

      {/* Decorative spots on body - scaled up */}
      <circle cx="90" cy="95" r="4" fill="#15803d" opacity="0.6" />
      <circle cx="112" cy="102" r="4" fill="#15803d" opacity="0.6" />
      <circle cx="101" cy="115" r="3.5" fill="#15803d" opacity="0.6" />

      {/* AI sparkles around chameleon - static */}
      {animated && (
        <>
          <circle cx="25" cy="65" r="3" fill="#fbbf24" opacity="0.7" />
          <circle cx="175" cy="95" r="3" fill="#fbbf24" opacity="0.5" />
          <circle cx="100" cy="30" r="3" fill="#fbbf24" opacity="0.6" />
        </>
      )}
    </svg>
  )
}

// Simpler variant for smaller sizes
export function ChameleonLogoSimple({
  className = "",
  size = 24,
  animated = false
}: ChameleonLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Simplified chameleon silhouette */}
      <path
        d="M 30 50 Q 25 40 30 35 Q 35 32 42 35 L 45 38 Q 48 35 55 35 Q 65 35 70 45 Q 72 50 70 58 Q 68 65 60 68 L 50 70 Q 42 68 35 60 Z"
        fill="currentColor"
        opacity="0.9"
      />

      {/* Eye */}
      <circle cx="42" cy="42" r="4" fill="white" />
      <circle cx="43" cy="42" r="2" fill="#1e293b" />

      {/* Curled tail */}
      <path
        d="M 60 68 Q 70 70 75 65 Q 78 60 75 58"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
        opacity="0.8"
      />
    </svg>
  )
}
