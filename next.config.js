/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  images: {
    remotePatterns: [
      {
        hostname: 'cborg.no',
      }
    ]
  }
}

module.exports = nextConfig
