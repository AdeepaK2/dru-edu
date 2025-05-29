import Image from "next/image";
import Link from "next/link";
import { TimezoneDemo } from "@/components/TimezoneDemo";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8 text-gray-800">
          Dr. U Education Platform
        </h1>
        
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-gray-700">
            Platform Status
          </h2>
          <p className="text-gray-600 mb-4">
            Haven't Developed Yet - Currently setting up timezone configuration for Melbourne, Australia
          </p>
          
          <TimezoneDemo />
        </div>
        
        <div className="text-center">
          <Link 
            href="/admin" 
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors duration-200"
          >
            Go to Admin Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
