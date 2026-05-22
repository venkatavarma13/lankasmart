import '../styles/globals.css';
import { Toaster } from 'react-hot-toast';
import { AppProvider } from '@/lib/AppContext';
import { LanguageProvider } from '@/lib/LanguageContext';
import Link from "next/link";

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

            {/* ✅ FOOTER (UNCHANGED) */}
            <footer style={{
              background: "#2D1E2F",
              color: "white",
              padding: "40px 20px",
              marginTop: "40px"
            }}>
              <h3>L MART</h3>

              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <Link href="/privacy-policy">Privacy Policy</Link>
                <Link href="/terms">Terms</Link>
                <Link href="/refund-policy">Refund Policy</Link>
                <Link href="/contact">Contact</Link>
                <Link href="/shipping-policy">Shipping</Link>
                <Link href="/about">About</Link>
              </div>

              <p style={{ marginTop: "20px", fontSize: "12px", opacity: 0.7 }}>
                © {new Date().getFullYear()} L MART
              </p>
            </footer>

            <Toaster position="top-center" toastOptions={{ duration: 3000 }} />

          </AppProvider>
        </LanguageProvider>

      </body>
    </html>
  );
}