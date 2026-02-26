import { ReactNode } from "react";

export default function AdminLayout({ children }: { children: ReactNode }) {
    return (
        <div className="admin-page-wrapper w-full">
            {children}
        </div>
    );
}
