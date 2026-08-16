import React from 'react';

interface AuthLayoutProps {
  children: React.ReactNode;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({
  children,
}) => {
  return (
    <div className="min-h-screen min-h-[100dvh] bg-[#FBFBFA] flex flex-col justify-center selection:bg-emerald-100 selection:text-emerald-900 overflow-x-hidden" id="ecoloop-auth-layout">
      {/* Main Content Area */}
      <main className="flex-1 flex items-center justify-center px-3 py-6 sm:px-6 sm:py-10 md:py-12 lg:px-8 relative w-full">
        {/* Subtle background ambient circular shapes */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10">
          <div className="absolute -top-40 -right-40 w-72 h-72 sm:w-96 sm:h-96 rounded-full bg-emerald-100/30 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-72 h-72 sm:w-96 sm:h-96 rounded-full bg-teal-100/30 blur-3xl" />
        </div>

        <div className="w-full max-w-5xl flex justify-center">{children}</div>
      </main>
    </div>
  );
};
