import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "oss-cf.cjdropshipping.com" },
      { protocol: "https", hostname: "cf.cjdropshipping.com" },
      { protocol: "https", hostname: "images.pexels.com" },
      { protocol: "https", hostname: "*.gstatic.com" },
      { protocol: "https", hostname: "i.ytimg.com" },
      { protocol: "https", hostname: "www.ngoclinhsam.vn" },
      { protocol: "https", hostname: "anagarwood.com" },
      { protocol: "https", hostname: "saffronvn.vn" },
      { protocol: "https", hostname: "ledongson.com" },
      { protocol: "https", hostname: "cdn.hstatic.net" },
      { protocol: "https", hostname: "cdn.luxshopping.vn" },
      { protocol: "https", hostname: "cdn.tgdd.vn" },
      { protocol: "https", hostname: "cdnv2.tgdd.vn" },
    ],
  },
};

export default nextConfig;
