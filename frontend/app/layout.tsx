import type { Metadata } from 'next';
import './globals.css';
import { ToastContainer } from '@/components/ui/ToastContainer';
import { ThemeProvider } from '@/components/theme/ThemeContext';

export const metadata: Metadata = {
  title: 'Bakelicious | Artisan Bakery Kolkata',
  description: 'Gourmet artisan bakery in Kolkata. Handcrafted celebration cakes, bento cakes, wedding tiers, and dessert platters.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/logo.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&family=Playfair+Display:ital,wght@0,400..900;1,400..900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-cream-200 text-charcoal font-sans antialiased min-h-screen">
        <ThemeProvider>
          {children}
          <ToastContainer />
        </ThemeProvider>
      </body>
    </html>
  );
}
