import { ImageResponse } from "next/og";

export const alt = "Bella Fashion — bodies femininos";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #2e1065 0%, #6b21a8 52%, #c026d3 100%)",
          color: "white",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ display: "flex", fontSize: 92, fontWeight: 900, letterSpacing: -4 }}>Bella Fashion</div>
          <div style={{ display: "flex", marginTop: 24, fontSize: 34, color: "#f3e8ff" }}>
            Bodies femininos · estilo e conforto
          </div>
        </div>
      </div>
    ),
    size
  );
}
