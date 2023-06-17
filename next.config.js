/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === 'production'
const nextConfig = {
  basePath: isProd ? '/uno-web-game' : '',
  assetPrefix: isProd ? '/uno-web-game/' : '',
  images: {
    unoptimized: true,
  }
  
}

module.exports = nextConfig
