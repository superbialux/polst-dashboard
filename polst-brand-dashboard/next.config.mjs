/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async redirects() {
    return [
      // Legacy routes renamed: /campaigns -> /decision-campaigns
      {
        source: '/brand/campaigns',
        destination: '/brand/decision-campaigns',
        permanent: false,
      },
      {
        source: '/brand/campaigns/:path*',
        destination: '/brand/decision-campaigns/:path*',
        permanent: false,
      },
      // Legacy wizard route renamed: /new-campaign -> /new-polst
      {
        source: '/brand/new-campaign/:path*',
        destination: '/brand/new-polst/:path*',
        permanent: false,
      },
    ]
  },
}

export default nextConfig
