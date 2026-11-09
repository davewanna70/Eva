/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // NEW: I add this to reduce shaking
  // React StrictMode dey render screen 2 times for dev, e dey make chat dey jump/shake.
  // Make we off am for now, EVA go steady like WhatsApp.
  reactStrictMode: false,
  // NEW: Make image no dey re-size every time
  images: {
    unoptimized: true,
  },
  experimental: {
    serverActions: {
      allowedOrigins: ["*"],
    },
  },
}

module.exports = nextConfig
