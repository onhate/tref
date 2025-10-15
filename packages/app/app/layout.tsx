import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/sonner';
import { Wrapper, WrapperWithQuery } from '@/components/wrapper';
import { baseUrl, createMetadata } from '@/lib/metadata';
import { GeistMono } from 'geist/font/mono';
import { GeistSans } from 'geist/font/sans';
import { ReactNode } from 'react';

export const metadata = createMetadata({
  title: {
    template: '%s',
    default: 'My App'
  },
  metadataBase: baseUrl
});

export default function RootLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
    <head>
      <link rel="icon" href="/favicon/favicon.ico" sizes="any" />
    </head>
    <body className={`${GeistSans.variable} ${GeistMono.variable} font-sans`}>
    <ThemeProvider attribute="class" defaultTheme="dark">
      <Wrapper>
        <WrapperWithQuery>{children}</WrapperWithQuery>
      </Wrapper>
      <Toaster richColors closeButton />
    </ThemeProvider>
    </body>
    </html>
  );
}
