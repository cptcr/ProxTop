/** @type {import('next').NextConfig} */
const nextConfig = {
  // REMOVE STATIC EXPORT - USE DYNAMIC RENDERING
  trailingSlash: false,
  images: {
    unoptimized: true
  },
  // Remove static export settings
  // assetPrefix: './',
  // output: 'export',
  // distDir: 'out',
  swcMinify: false,
  experimental: {
    esmExternals: false
  },
  
  webpack: (config, { isServer, dev }) => {
    // Electron specific configuration
    if (!isServer) {
      config.target = 'electron-renderer';
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        url: false,
        zlib: false,
        http: false,
        https: false,
        assert: false,
        os: false,
        path: false,
      };
    }

    // Handle node modules
    config.externals = config.externals || [];
    config.externals.push({
      'utf-8-validate': 'commonjs utf-8-validate',
      'bufferutil': 'commonjs bufferutil',
    });

    return config;
  },

  // Development configuration
  ...(process.env.NODE_ENV === 'development' && {
    rewrites: async () => [],
  }),
}

module.exports = nextConfig