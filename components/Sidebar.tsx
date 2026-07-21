'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Sidebar() {
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        setIsOpen(false);
    }, [pathname]);

    const menuItems = [
        { name: 'Tableau de bord', href: '/', icon: '🏠' },
        { name: 'Vidéo Professionnelle', href: '/video-pro', icon: '🎬' },
        { name: 'Image Professionnelle', href: '/image-pro', icon: '✨' },
        { name: 'Effets Visuels', href: '/effects', icon: '🎨' },
        { name: 'Outils PDF', href: '/pdf', icon: '📄' },
        { name: 'Fusion PDF', href: '/pdf-merge', icon: '🔗' },
    ];

    return (
        <>
            <button 
                onClick={() => setIsOpen(true)}
                className="md:hidden fixed top-4 left-4 z-40 p-2.5 bg-white rounded-xl shadow-sm border border-gray-200 text-gray-700 hover:bg-gray-50 active:scale-95 transition-all focus:outline-none"
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
            </button>

            {isOpen && (
                <div 
                    className="md:hidden fixed inset-0 bg-black/40 z-40 backdrop-blur-sm transition-opacity"
                    onClick={() => setIsOpen(false)}
                />
            )}

            <aside className={`
                fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 flex flex-col h-full shrink-0
                transform transition-transform duration-300 ease-in-out
                md:relative md:translate-x-0
                ${isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}
            `}>
                <div className="p-6 border-b border-gray-100 flex justify-between items-start">
                    <div>
                        <h2 className="text-xl font-black text-gray-900 tracking-tight">MultiTools<span className="text-blue-600">.</span></h2>
                        <p className="text-xs text-gray-500 font-medium mt-1">Suite créative locale</p>
                    </div>
                    <button 
                        onClick={() => setIsOpen(false)} 
                        className="md:hidden p-1 text-gray-400 hover:text-gray-800 transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <nav className="flex-1 overflow-y-auto p-4 space-y-1">
                    {menuItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link 
                                key={item.href} 
                                href={item.href}
                                onClick={() => setIsOpen(false)}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                                    isActive 
                                    ? 'bg-black text-white shadow-md' 
                                    : 'text-gray-600 hover:bg-gray-100 hover:text-black'
                                }`}
                            >
                                <span className="text-lg">{item.icon}</span>
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-gray-100 text-xs text-gray-400 text-center">
                    Propulsé par FFmpeg & Ghostscript
                </div>
            </aside>
        </>
    );
}