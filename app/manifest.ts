import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Bella Fashion",
    short_name: "Bella Fashion",
    description: "Loja online de bodies femininos.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#581c87",
    icons: [{ src: "/favicon.ico", sizes: "any", type: "image/x-icon" }],
  };
}
