'use client';

import { Header } from '@/components/Header';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { BlogEditor } from '@/components/admin/BlogEditor';

export default function NewBlogPost() {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-500">
            <Header />

            <div className="container mx-auto px-4 py-8">
                <div className="flex flex-col md:flex-row gap-8">
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
