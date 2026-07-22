'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { getStats, formatTimeSaved, AppStats } from '@/lib/stats';

const tools = [
    {
        title: 'Convertisseur',
        description: 'Changez le format de vos images et vidéos instantanément.',
        href: '/convert',
        icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
        ),
        gradient: 'from-blue-500 to-cyan-500'
    },
    {
        title: 'Compression',
        description: 'Réduisez la taille de vos fichiers sans perte de qualité.',
        href: '/compress',
        icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
        ),
        gradient: 'from-emerald-500 to-teal-400'
    },
    {
        title: 'Détourage IA',
        description: 'Supprimez l\'arrière-plan de vos photos automatiquement.',
        href: '/remove-bg',
        icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
        ),
        gradient: 'from-purple-500 to-pink-500'
    },
    {
        title: 'Filigrane',
        description: 'Protégez vos créations avec un texte ou un copyright personnalisé.',
        href: '/watermark',
        icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
        ),
        gradient: 'from-orange-500 to-red-500'
    },
    {
        title: 'Redimensionnement',
        description: 'Adaptez vos médias aux formats précis des réseaux sociaux.',
        href: '/resize',
        icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
        ),
        gradient: 'from-indigo-500 to-blue-500'
    },
    {
        title: 'Fusion PDF',
        description: 'Assemblez et réorganisez vos documents PDF en toute simplicité.',
        href: '/pdf-merge',
        icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
        ),
        gradient: 'from-gray-700 to-black'
    }
];

const containerVariants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: { staggerChildren: 0.1 }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

export default function DashboardPage() {
    const [realStats, setRealStats] = useState<AppStats>({ filesProcessed: 0 });
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setRealStats(getStats());
        setIsMounted(true);
    }, []);

    const stats = [
        { id: 1, name: 'Fichiers traités', value: realStats.filesProcessed.toString(), icon: '📁', color: 'bg-blue-50 text-blue-600' },
        { id: 2, name: 'Temps gagné', value: formatTimeSaved(realStats.filesProcessed), icon: '⚡', color: 'bg-amber-50 text-amber-600' },
        { id: 3, name: 'Confidentialité', value: '100%', icon: '🔒', color: 'bg-black text-white' },
        { id: 4, name: 'Exécution', value: 'Locale', icon: '💻', color: 'bg-green-50 text-green-600' },
    ];

    return (
        <main className="min-h-screen bg-gray-50 p-6 md:p-12 font-sans overflow-x-hidden">
            <div className="max-w-6xl mx-auto space-y-12">
                <motion.header 
                    initial={{ opacity: 0, y: -20 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    transition={{ duration: 0.5 }}
                    className="space-y-4"
                >
                    <div className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-bold tracking-wide mb-2 border border-blue-200">
                        V 1.0.0 — LOCAL-FIRST
                    </div>
                    <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight">
                        Bienvenue sur <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-600 to-cyan-500">MultiTools</span>
                    </h1>
                    <p className="text-gray-500 text-lg max-w-2xl leading-relaxed">
                        Votre suite créative locale. Aucun fichier n&apos;est envoyé sur le cloud, garantissant une 
                        <strong className="text-gray-800 font-semibold"> confidentialité totale</strong> et des performances maximales.
                    </p>
                </motion.header>

                {isMounted && (
                    <motion.div 
                        variants={containerVariants} 
                        initial="hidden" 
                        animate="show" 
                        className="grid grid-cols-2 md:grid-cols-4 gap-4"
                    >
                        {stats.map((stat) => (
                            <motion.div 
                                key={stat.id} 
                                variants={itemVariants}
                                className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between"
                            >
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl mb-4 ${stat.color}`}>
                                    {stat.icon}
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-500">{stat.name}</p>
                                    <p className="text-2xl font-black text-gray-900 mt-1">{stat.value}</p>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                )}

                <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-gray-900">Vos outils disponibles</h2>
                    
                    <motion.div 
                        variants={containerVariants} 
                        initial="hidden" 
                        animate="show" 
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                    >
                        {tools.map((tool) => (
                            <motion.div key={tool.title} variants={itemVariants}>
                                <Link href={tool.href} className="block group">
                                    <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-blue-100 h-full flex flex-col relative overflow-hidden">
                                        
                                        {/* Décoration en arrière-plan au hover */}
                                        <div className={`absolute -right-12 -top-12 w-32 h-32 rounded-full bg-linear-to-br ${tool.gradient} opacity-0 group-hover:opacity-10 blur-2xl transition-opacity duration-500`} />

                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white bg-linear-to-br ${tool.gradient} shadow-md mb-6 transform group-hover:scale-110 transition-transform duration-300`}>
                                            {tool.icon}
                                        </div>
                                        
                                        <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                                            {tool.title}
                                        </h3>
                                        
                                        <p className="text-sm text-gray-500 leading-relaxed flex-1">
                                            {tool.description}
                                        </p>

                                        <div className="mt-6 flex items-center text-sm font-bold text-gray-400 group-hover:text-blue-600 transition-colors">
                                            Ouvrir l'outil 
                                            <svg className="w-4 h-4 ml-1 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                            </svg>
                                        </div>
                                    </div>
                                </Link>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>

            </div>
        </main>
    );
}