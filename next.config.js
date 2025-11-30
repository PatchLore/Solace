/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb',
    },
  },
  // Explicitly expose environment variables
  env: {
    RUNWARE_API_KEY: process.env.RUNWARE_API_KEY,
    // Motion API vars are server-side only, no client exposure needed
  },
}

module.exports = nextConfig

