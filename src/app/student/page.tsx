export default function StudentPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Student Portal</h1>
        <p className="text-gray-600 mb-8">Welcome to the student portal</p>
        <div className="space-x-4">
          <a href="/student/login" className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600">
            Login
          </a>
          <a href="/student/dashboard" className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600">
            Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}