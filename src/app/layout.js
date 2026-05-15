import '../styles/globals.css';
import { Toaster } from 'react-hot-toast';
import { AppProvider } from '@/lib/AppContext';
import { LanguageProvider } from '@/lib/LanguageContext';

export const metadata = {
  title: 'L MART – Global Growth, Local Fresh',
  description: 'Buy groceries, fresh fruits, vegetables, dairy, snacks, stationery, home needs and more at best prices in Agadalalanka.',
  keywords: 'grocery, fresh fruits, vegetables, dairy, snacks, L MART, Agadalalanka, Eluru',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <LanguageProvider>
          <AppProvider>
            {children}
            <Toaster position="top-center" toastOptions={{ duration: 3000 }} />
          </AppProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
