import type { Metadata } from "next";
import { Noto_Sans_JP } from "next/font/google";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "./globals.css";
import Providers from "./providers";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const noto = Noto_Sans_JP({
  subsets: ["latin"],
  weight: ["400", "700"], // Regular and Bold
});

export const metadata: Metadata = {
  title: "Shift Scheduler",
  description: "Shift management tool",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className={noto.className}>
        <Providers>
          {children}
          <ToastContainer position="bottom-right" autoClose={3000} />
        </Providers>
      </body>
    </html>
  );
}
