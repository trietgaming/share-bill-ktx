import { InjectManifest } from "workbox-webpack-plugin";

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
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.plugins.push(
        new InjectManifest({
          swSrc: './firebase-messaging-sw.ts',
          swDest: '../public/firebase-messaging-sw.js',
          exclude: [/\.map$/, /manifest$/, /\.htaccess$/],
        })
      );
    }
    return config;
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
