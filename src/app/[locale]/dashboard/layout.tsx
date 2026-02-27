import { ReactNode } from "react";

export default function DashboardLayout({ children }: { children: ReactNode }) {
    return (
        <div className="dashboard-page-wrapper w-full">
            {children}
        </div>
    );
}
