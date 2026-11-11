import { Noto_Sans, Noto_Sans_Devanagari, Poppins } from 'next/font/google';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['600', '700'],
  display: 'swap',
  variable: '--font-poppins',
});
const noto = Noto_Sans({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  display: 'swap',
  variable: '--font-noto',
});
const devanagari = Noto_Sans_Devanagari({
  subsets: ['devanagari'],
  weight: ['400', '600', '700'],
  display: 'swap',
  variable: '--font-devanagari',
});

export const fontVariables = `${poppins.variable} ${noto.variable} ${devanagari.variable}`;
