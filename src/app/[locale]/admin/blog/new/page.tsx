'use client';

import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { BlogEditor } from '@/components/admin/BlogEditor';

export default function NewBlogPost() {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-500">

            <div className="w-full max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
                    <AdminSidebar />

                    {/* Main Content */}
                    <main className="flex-1">
                        <BlogEditor />
                    </main>
                </div>
            </div>
        </div>
    );
}
