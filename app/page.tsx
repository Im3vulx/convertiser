import Link from 'next/link';

const tools = [
    {
        id: 'compress',
        title: 'Compresser IMAGE',
        description: 'Compressez JPG, PNG, SVG, et GIFs tout en gagnant de la place et en conservant la qualité.',
        icon: <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4h16v16H4V4zm4 4l4 4 4-4m-4 4v8"></path></svg>,
        color: 'bg-green-500',
        href: '/compress',
        isNew: false,
    },
    {
        id: 'convert',
        title: 'Convertir IMAGE/VIDEO',
        description: 'Transformez vos fichiers vers les formats WebP, PNG, JPG, ou vos vidéos en MP4 localement.',
        icon: <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path></svg>,
        color: 'bg-yellow-400',
        href: '/convert',
        isNew: false,
    },
    {
        id: 'resize',
        title: 'Redimensionner',
        description: 'Définissez vos dimensions, par pourcentage ou pixels, et redimensionnez vos images.',
        icon: <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"></path></svg>,
        color: 'bg-blue-400',
        href: '/resize',
        isNew: false,
    },
    {
        id: 'crop',
        title: 'Rogner IMAGE',
        description: 'Rognez vos images avec facilité. Choisissez les pixels pour définir votre rectangle.',
        icon: <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5"></path></svg>,
        color: 'bg-cyan-500',
        href: '/crop',
        isNew: false,
    },
    {
        id: 'rotate',
        title: 'Faire pivoter',
        description: 'Faites pivoter plusieurs images ou vidéos en même temps (paysage ou portrait).',
        icon: <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>,
        color: 'bg-blue-500',
        href: '/rotate',
        isNew: false,
    },
    {
        id: 'remove-bg',
        title: 'Supprimer le fond',
        description: 'Supprimez rapidement l\'arrière-plan de vos images avec une grande précision.',
        icon: <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>,
        color: 'bg-green-600',
        href: '/remove-bg',
        isNew: true,
    },
    {
        id: 'watermark',
        title: 'Filigrane IMAGE',
        description: 'Tamponnez une image ou un texte sur vos images en quelques secondes.',
        icon: <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path></svg>,
        color: 'bg-slate-600',
        href: '/watermark',
        isNew: false,
    }
];

    export default function Dashboard() {
    return (
        <main className="min-h-screen bg-[#F0F4F9] py-12 px-6 font-sans">
        <div className="max-w-7xl mx-auto space-y-10">
            
            <header className="text-center space-y-3">
            <h1 className="text-4xl font-extrabold text-gray-900">Boîte à outils Multimédia</h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Chaque outil tourne 100% localement sur ta machine grâce à Docker et FFmpeg.
            </p>
            </header>

            {/* La Grille CSS */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {tools.map((tool) => (
                <Link 
                key={tool.id} 
                href={tool.href}
                className="group relative bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-200 ease-in-out hover:-translate-y-1 flex flex-col h-full cursor-pointer"
                >
                {/* Badge "New!" */}
                {tool.isNew && (
                    <span className="absolute top-4 right-4 bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded">
                    New!
                    </span>
                )}
                
                {/* Icône colorée */}
                <div className={`w-14 h-14 ${tool.color} rounded-xl flex items-center justify-center mb-6 shadow-sm`}>
                    {tool.icon}
                </div>
                
                {/* Textes */}
                <h2 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">
                    {tool.title}
                </h2>
                <p className="text-sm text-gray-500 leading-relaxed grow">
                    {tool.description}
                </p>
                </Link>
            ))}
            </div>

        </div>
        </main>
    );
}