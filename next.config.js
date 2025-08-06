/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true
  },
  // Exclude Android directory from Next.js build
  webpack: (config, { isServer }) => {
    config.watchOptions = {
      ignored: ['**/android/**', '**/node_modules/**']
    }
    return config
  },
  // Exclude Android directory from TypeScript compilation
  typescript: {
    ignoreBuildErrors: false
  },
  // Exclude Android directory from ESLint
  eslint: {
    ignoreDuringBuilds: false
  }
}

module.exports = nextConfig 