/** @type {import('next').NextConfig} */
const nextConfig = {
  // TypeScript configuration
  typescript: {
    // Ignore TypeScript errors in backend directory
    ignoreBuildErrors: false
  },

  // Enable experimental features for better build stability
  experimental: {
    serverComponentsExternalPackages: ['pg', 'bcryptjs', 'jsonwebtoken']
  },

  // Webpack configuration to exclude backend and handle modules
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Exclude backend directory from webpack
    config.watchOptions = {
      ...config.watchOptions,
      ignored: [
        '**/node_modules/**',
        '**/backend/**'
      ]
    }

    // Ignore source map warnings for node_modules
    config.ignoreWarnings = [
      /Failed to parse source map/,
      /Module not found.*can't resolve.*@/
    ];

    // Handle fallbacks for Node.js modules
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      crypto: false,
    };

    return config
  },

  // Disable source maps in production for faster builds
  productionBrowserSourceMaps: false,
  
  // Optimize for Netlify deployment
  swcMinify: true,
}

module.exports = nextConfig