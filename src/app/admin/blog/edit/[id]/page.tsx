'use client';

import { Header } from '@/components/Header';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { BlogEditor } from '@/components/admin/BlogEditor';
import { use } from 'react';

export default function EditBlogPost({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-500">
            <Header />

            <div className="container mx-auto px-4 py-8">
                <div className="flex flex-col md:flex-row gap-8">
                    <AdminSidebar />

                    {/* Main Content */}
                    <main className="flex-1">
                        <BlogEditor postId={id} />
                    </main>
                </div>
            </div>
        </div>
    );
}
