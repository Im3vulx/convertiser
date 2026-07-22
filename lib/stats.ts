export type AppStats = {
    filesProcessed: number;
};

const STATS_KEY = 'multitools_local_stats';


export const getStats = (): AppStats => {
    if (typeof window === 'undefined') return { filesProcessed: 0 };
    
    const stored = localStorage.getItem(STATS_KEY);
    if (stored) {
        return JSON.parse(stored);
    }
    return { filesProcessed: 0 };
};


export const incrementStats = (count: number) => {
    if (typeof window === 'undefined') return;
    
    const currentStats = getStats();
    const newStats = {
        filesProcessed: currentStats.filesProcessed + count,
    };
    
    localStorage.setItem(STATS_KEY, JSON.stringify(newStats));
};

export const formatTimeSaved = (filesCount: number) => {
    const totalMinutes = filesCount * 2;
    if (totalMinutes === 0) return '0m';
    
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    if (hours > 0) {
        return `${hours}h ${minutes > 0 ? minutes + 'm' : ''}`;
    }
    return `${minutes}m`;
};