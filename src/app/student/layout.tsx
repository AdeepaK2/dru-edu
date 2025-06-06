export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">Dr U Education - Student</h1>
            </div>
            <div className="flex items-center space-x-4">
              <a href="/student/dashboard" className="text-gray-700 hover:text-gray-900">
                Dashboard
              </a>
              <a href="/student/login" className="text-gray-700 hover:text-gray-900">
                Login
              </a>
            </div>
          </div>
        </div>
      </nav>
      <main>{children}</main>
    </div>
  );
}