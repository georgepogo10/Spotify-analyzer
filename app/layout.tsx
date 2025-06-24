// app/layout.tsx
import "./globals.css";
import Providers from "./providers";


export const metadata = {
  title: "Spotify Analyzer",
  description: "Analyze your Spotify listening habits",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
