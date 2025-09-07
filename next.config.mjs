/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

// For codespaces
if (process.env.NODE_ENV == 'development') {
  nextConfig.experimental = {
    serverActions: {
      allowedOrigins: ['localhost:3000']
    },
  }
    
}

export default nextConfig
