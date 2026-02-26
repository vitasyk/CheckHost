import { redirect } from 'next/navigation';

export default async function ChecksRedirect({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    // Redirect to the new home page which is now the checks page
    redirect(`/${locale}`);
}
