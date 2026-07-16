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
    },
    {
        id: 'effects',
        title: 'Effets visuels',
        description: 'Appliquez des filtres (Noir & Blanc, Miroir, Flou, Négatif) à vos images.',
        icon: <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"></path></svg>,
        color: 'bg-purple-500',
        href: '/effects',
        isNew: true,
    },{
        id: 'video-pro',
        title: 'Vidéo Pro',
        description: 'Découpage (Trim), gestion audio et ajustement de la vitesse.',
        icon: <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>,
        color: 'bg-red-500',
        href: '/video-pro',
    },
    {
        id: 'image-pro',
        title: 'Image Pro',
        description: 'Compression sans perte, conversion GIF et filtres avancés.',
        icon: <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>,
        color: 'bg-emerald-500',
        href: '/image-pro',
    },
];

    export default function Dashboard() {
    return (
        <main className="min-h-screen bg-gray-50 py-12 px-6">
            <div className="max-w-6xl mx-auto">
                <h1 className="text-4xl font-black text-gray-900 mb-12">Tableau de bord multimédia</h1>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tools.map((tool) => (
                    <a key={tool.id} href={tool.href} className="group bg-white p-6 rounded-2xl shadow-sm border border-gray-100 transition-all hover:shadow-lg hover:-translate-y-1">
                    <div className={`${tool.color} w-12 h-12 rounded-xl flex items-center justify-center mb-4`}>
                        {tool.icon}
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">{tool.title}</h2>
                    <p className="mt-2 text-gray-500 text-sm">{tool.description}</p>
                    </a>
                ))}
                </div>
            </div>
        </main>
    );
}