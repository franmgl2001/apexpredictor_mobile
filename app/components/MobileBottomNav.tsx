'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';

export default function MobileBottomNav() {
    const pathname = usePathname();

    const navItems = [
        {
            name: 'My Team',
            path: '/myteam',
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
            )
        },
        {
            name: 'Leaderboard',
            path: '/leaderboard',
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
            )
        },
        {
            name: 'Leagues',
            path: '/leagues',
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
            )
        }
    ];

    const isActive = (path: string) => {
        return pathname === path;
    };

    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
            <div className="flex justify-around items-center h-16">
                {navItems.map((item) => (
                    <Link
                        key={item.path}
                        href={item.path}
                        className={`flex flex-col items-center justify-center flex-1 h-full px-2 transition-colors ${isActive(item.path)
                            ? 'text-red-600'
                            : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        <div className={`${isActive(item.path) ? 'transform scale-110' : ''} transition-transform`}>
                            {item.icon}
                        </div>
                        <span className={`text-xs mt-1 font-medium ${isActive(item.path) ? 'text-red-600' : 'text-gray-600'
                            }`}>
                            {item.name}
                        </span>
                        {isActive(item.path) && (
                            <div className="absolute top-0 left-0 right-0 h-0.5 bg-red-600"></div>
                        )}
                    </Link>
                ))}
            </div>
        </nav>
    );
}


