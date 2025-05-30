/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        hostname: 'cborg.no',
      }
    ]
  }
}

module.exports = nextConfig
