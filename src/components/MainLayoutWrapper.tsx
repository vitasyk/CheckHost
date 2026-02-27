'use client';

import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';

interface MainLayoutWrapperProps {
    children: ReactNode;
    leftAd: ReactNode;
    rightAd: ReactNode;
}

export function MainLayoutWrapper({ children, leftAd, rightAd }: MainLayoutWrapperProps) {
    const pathname = usePathname() || '';
    const isFullWidthPage = pathname.includes('/admin') || pathname.includes('/dashboard');

    return (
        <main className="flex-1 w-full relative flex flex-col min-h-screen">
            <div className={`${isFullWidthPage ? 'w-full px-4 sm:px-6' : 'max-w-[1440px] mx-auto w-full px-4 sm:px-8'} flex flex-col md:flex-row gap-6 relative site-main-container flex-1`}>
                {/* Left Sidebar Ad */}
                {!isFullWidthPage && (
                    <div className="hidden lg:block w-40 shrink-0">
                        {leftAd}
                    </div>
                )}

                <div className="flex-1 min-w-0 site-content-wrapper">
                    {children}
                </div>

                {/* Right Sidebar Ad */}
                {!isFullWidthPage && (
                    <div className="hidden xl:block w-40 shrink-0">
                        {rightAd}
                    </div>
                )}
            </div>
        </main>
    );
}
