'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Sidebar() {
    const pathname = usePathname();

    const menuItems = [
        { name: 'Tableau de bord', href: '/', icon: '🏠' },
        { name: 'Vidéo Professionnelle', href: '/video-pro', icon: '🎬' },
        { name: 'Image Professionnelle', href: '/image-pro', icon: '✨' },
        { name: 'Effets Visuels', href: '/effects', icon: '🎨' },
        { name: 'Outils PDF', href: '/pdf', icon: '📄' },
        { name: 'Fusion PDF', href: '/pdf-merge', icon: '🔗' },
    ];

    return (
        <aside className="w-64 bg-white border-r border-gray-200 flex flex-col h-full shrink-0">
        <div className="p-6 border-b border-gray-100">
            <h2 className="text-xl font-black text-gray-900 tracking-tight">MultiTools<span className="text-blue-600">.</span></h2>
            <p className="text-xs text-gray-500 font-medium mt-1">Suite créative locale</p>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
            {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
                <Link 
                key={item.href} 
                href={item.href}
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
    );
}