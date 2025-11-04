import { ReactNode } from 'react';
import { Navbar } from './navbar';

interface PageLayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
}

export function PageLayout({ children, title, description }: PageLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {(title || description) && (
          <div className="mb-8">
            {title && <h1 className="text-3xl font-bold text-gray-900">{title}</h1>}
            {description && <p className="mt-2 text-gray-600">{description}</p>}
          </div>
        )}
        
        {children}
      </main>
    </div>
  );
}
