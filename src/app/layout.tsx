import type {Metadata} from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AcousticIsle | Interactive Musical Heritage',
  description: 'AI-native in-browser musical sandbox connecting you with protected indigenous musical heritage.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Space+Grotesk:wght@500;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased bg-background text-foreground selection:bg-accent/30 selection:text-accent">
        {children}
      </body>
    </html>
  );
}