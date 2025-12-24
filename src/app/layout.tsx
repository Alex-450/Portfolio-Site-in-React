import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'a-450',
  description: 'Personal blog',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="dark-mode">
        <div id="root">{children}</div>
      </body>
    </html>
  );
}
