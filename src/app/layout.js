import './globals.css';

export const metadata = {
  title: 'Shawarma POS - Point of Sale System',
  description: 'Sistem Point of Sale untuk jaringan toko Shawarma dengan 19 outlet',
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
