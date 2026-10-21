'use client';

import React from 'react';
import Link from 'next/link';
import { Home } from 'lucide-react';

export default function NotFound() {

  return (
    <main
      style={{
        minHeight: '85vh',
        backgroundColor: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 20px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      <div
        style={{
          maxWidth: '520px',
          width: '100%',
          textAlign: 'center',
          margin: '0 auto',
        }}
      >
        {/* Exact Character Illustration matching reference image */}
        <div style={{ marginBottom: '28px', display: 'flex', justifyContent: 'center' }}>
          <svg
            viewBox="0 0 360 260"
            style={{ width: '100%', maxWidth: '320px', height: 'auto', display: 'block' }}
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Soft Ground Shadows */}
            <ellipse cx="180" cy="226" rx="72" ry="14" fill="#dbeafe" opacity="0.85" />
            <ellipse cx="204" cy="224" rx="42" ry="10" fill="#93c5fd" opacity="0.65" />

            {/* Doodle motion swirls */}
            <path
              d="M125 215 C135 228, 175 235, 205 220 C235 205, 250 220, 245 226 C240 232, 225 235, 215 230"
              stroke="#2563eb"
              strokeWidth="2.5"
              strokeLinecap="round"
            />

            {/* Doodle Cross / 'x' on bottom-left */}
            <path d="M126 210 L134 218 M134 210 L126 218" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" />

            {/* Small circle doodle left of arch */}
            <circle cx="149" cy="188" r="4.5" stroke="#2563eb" strokeWidth="2.5" fill="none" />
            <path d="M145 186 C142 182, 138 186, 135 187" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" />

            {/* Doodle loop on right */}
            <path
              d="M232 195 C252 190, 275 200, 260 205 C245 210, 240 190, 255 190"
              stroke="#2563eb"
              strokeWidth="2.5"
              strokeLinecap="round"
              fill="none"
            />

            {/* Left Floating Isometric 3D Cube */}
            <g transform="translate(122, 155)">
              <polygon points="16,0 32,8 16,16 0,8" fill="#eff6ff" stroke="#2563eb" strokeWidth="2" strokeLinejoin="round" />
              <polygon points="0,8 16,16 16,32 0,24" fill="#bfdbfe" stroke="#2563eb" strokeWidth="2" strokeLinejoin="round" />
              <polygon points="16,16 32,8 32,24 16,32" fill="#93c5fd" stroke="#2563eb" strokeWidth="2" strokeLinejoin="round" />
            </g>

            {/* Right Floating Isometric 3D Cube */}
            <g transform="translate(225, 128)">
              <polygon points="16,0 32,8 16,16 0,8" fill="#eff6ff" stroke="#2563eb" strokeWidth="2" strokeLinejoin="round" />
              <polygon points="0,8 16,16 16,32 0,24" fill="#bfdbfe" stroke="#2563eb" strokeWidth="2" strokeLinejoin="round" />
              <polygon points="16,16 32,8 32,24 16,32" fill="#93c5fd" stroke="#2563eb" strokeWidth="2" strokeLinejoin="round" />
            </g>

            {/* Bottom Floating Hex Nut / Bolt */}
            <g transform="translate(168, 222)">
              <polygon
                points="14,0 26,6 26,18 14,24 2,18 2,6"
                fill="#60a5fa"
                stroke="#2563eb"
                strokeWidth="2"
                strokeLinejoin="round"
              />
              <circle cx="14" cy="12" r="4.5" fill="#eff6ff" stroke="#2563eb" strokeWidth="2" />
            </g>

            {/* Mascot Antenna */}
            <path
              d="M180 142 C180 132, 185 130, 185 125 C185 120, 180 118, 178 122 C176 125, 179 128, 182 128"
              stroke="#2563eb"
              strokeWidth="2.5"
              strokeLinecap="round"
              fill="none"
            />

            {/* Main Arch Character Body */}
            <path
              d="M148 215 
                 C142 185, 142 155, 160 142 
                 C170 134, 190 134, 200 142 
                 C218 155, 218 185, 212 215 
                 C208 218, 200 216, 196 208
                 C192 188, 188 178, 180 178
                 C172 178, 168 188, 164 208
                 C160 216, 152 218, 148 215 Z"
              fill="url(#blueCharacterGradient)"
              stroke="#2563eb"
              strokeWidth="3"
              strokeLinejoin="round"
            />

            {/* Inner Arch Shading */}
            <path
              d="M164 208 C168 188, 172 178, 180 178 C188 178, 192 188, 196 208 C192 212, 168 212, 164 208 Z"
              fill="#bfdbfe"
              opacity="0.75"
            />

            {/* Soft Upper Head Highlight */}
            <path
              d="M162 147 C170 139, 190 139, 198 147"
              stroke="#ffffff"
              strokeWidth="3"
              strokeLinecap="round"
              opacity="0.85"
            />

            {/* Sad Slanted Eyebrows */}
            <path d="M162 165 C164 163, 169 162, 172 164" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M188 164 C191 162, 196 163, 198 165" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" />

            {/* Tearful Sad Eyes */}
            <ellipse cx="167" cy="172" rx="3.5" ry="5.5" fill="#1d4ed8" />
            <circle cx="166" cy="170" r="1.5" fill="#ffffff" />

            <ellipse cx="193" cy="172" rx="3.5" ry="5.5" fill="#1d4ed8" />
            <circle cx="192" cy="170" r="1.5" fill="#ffffff" />

            {/* Sad Downward Frown Mouth */}
            <path
              d="M174 186 C177 182, 183 182, 186 186"
              stroke="#2563eb"
              strokeWidth="2.5"
              strokeLinecap="round"
              fill="none"
            />

            {/* Gradients */}
            <defs>
              <linearGradient id="blueCharacterGradient" x1="140" y1="130" x2="220" y2="220" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#93c5fd" />
                <stop offset="50%" stopColor="#60a5fa" />
                <stop offset="100%" stopColor="#3b82f6" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Title matching reference image */}
        <h1
          style={{
            fontSize: '34px',
            fontWeight: '800',
            color: '#111827',
            marginBottom: '14px',
            letterSpacing: '-0.02em',
            lineHeight: 1.2,
          }}
        >
          Page Not Found
        </h1>

        {/* Subtitle matching reference image */}
        <p
          style={{
            fontSize: '15px',
            color: '#6b7280',
            lineHeight: '1.6',
            maxWidth: '440px',
            margin: '0 auto 28px auto',
          }}
        >
          We couldn&apos;t find the page you were looking for. Check the URL to make sure it&apos;s correct and try again.
        </p>

        {/* Navigation Action Button */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <Link
            href="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 28px',
              backgroundColor: '#0f172a',
              color: '#ffffff',
              borderRadius: '10px',
              fontWeight: '600',
              fontSize: '14px',
              textDecoration: 'none',
              boxShadow: '0 2px 8px rgba(15, 23, 42, 0.12)',
              transition: 'all 0.15s ease',
            }}
          >
            <Home size={16} />
            <span>Go to Homepage</span>
          </Link>
        </div>
      </div>
    </main>
  );
}
