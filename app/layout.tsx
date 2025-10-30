import type { ReactNode } from 'react';
import MobileBottomNav from './components/MobileBottomNav';

export default function RootLayout({ children }: { children: ReactNode }) {
    return (
        <html lang="en">
            <body>
                <div className="min-h-screen pb-20">
                    {children}
                </div>
                <MobileBottomNav />
            </body>
        </html>
    );
}


