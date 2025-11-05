/** @type {import('next').NextConfig} */
const nextConfig = {
  // TypeScript configuration
  typescript: {
    // Ignore TypeScript errors in backend directory
    ignoreBuildErrors: false
  },

  // Webpack configuration to exclude backend
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Exclude backend directory from webpack
    config.watchOptions = {
      ...config.watchOptions,
      ignored: [
        '**/node_modules/**',
        '**/backend/**'
      ]
    }

    return config
  }
}

module.exports = nextConfig