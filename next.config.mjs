import { InjectManifest } from "workbox-webpack-plugin";

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // No ESLint config exists in this repo yet (`next lint` / eslint.config.mjs
    // was never set up), so this can't be safely flipped off without first
    // bootstrapping a config and triaging whatever it flags across the whole
    // codebase - a separate, larger piece of work than this fix pass.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // `tsc --noEmit` is clean as of this change; keep builds honest instead
    // of silently swallowing future type errors.
    ignoreBuildErrors: false,
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
          maximumFileSizeToCacheInBytes: 10 * 1024 * 1024, // 10mb
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
