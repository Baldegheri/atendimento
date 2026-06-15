import type { NextConfig } from "next"
import path from "path"

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
  allowedDevOrigins: ["concerned-citric-coastal.ngrok-free.dev"],
  serverExternalPackages: ["imapflow", "mailparser", "nodemailer"],
}

export default nextConfig
