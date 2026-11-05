import './globals.css'

export const metadata = {
  title: "EVA",
  description: "EVA - Your Sister Companion",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/icon.svg",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{margin:0, background:'black'}}>{children}</body>
    </html>
  );
}
