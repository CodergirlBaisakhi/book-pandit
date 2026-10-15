export const metadata = {
  title: "Book Pandit API",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "Georgia, serif", margin: 0, background: "#f6efe4", color: "#2c2118" }}>
        {children}
      </body>
    </html>
  );
}
