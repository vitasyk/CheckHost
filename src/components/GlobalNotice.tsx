import { Info, AlertTriangle, XCircle } from 'lucide-react';

interface GlobalNoticeProps {
    message: string;
    type: 'info' | 'warning' | 'error';
}

export function GlobalNotice({ message, type }: GlobalNoticeProps) {
    if (!message) return null;

    const styles = {
        info: {
            bg: 'bg-indigo-600 dark:bg-indigo-500',
            icon: <Info className="h-4 w-4" />,
            text: 'text-white'
        },
        warning: {
            bg: 'bg-amber-500 dark:bg-amber-600',
            icon: <AlertTriangle className="h-4 w-4" />,
            text: 'text-slate-900 dark:text-white'
        },
        error: {
            bg: 'bg-red-600 dark:bg-red-500',
            icon: <XCircle className="h-4 w-4" />,
            text: 'text-white'
        }
    };

    const style = styles[type] || styles.info;

    return (
        <div className={`${style.bg} ${style.text} py-2 px-4 shadow-md`}>
            <div className="max-w-[1440px] mx-auto px-4 sm:px-8 flex items-center justify-center gap-3 text-sm font-medium">
                {style.icon}
                <span className="text-center">{message}</span>
            </div>
        </div>
    );
}
