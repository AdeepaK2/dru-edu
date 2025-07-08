interface VideoPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function VideoPage({ params }: VideoPageProps) {
  const { id } = await params;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <a href="/student/dashboard" className="text-blue-600 hover:text-blue-800">
            ← Back to Dashboard
          </a>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold mb-4">Video Lesson #{id}</h1>
          <div className="aspect-video bg-gray-200 rounded-lg mb-6 flex items-center justify-center">
            <p className="text-gray-500">Video Player Placeholder</p>
          </div>
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Lesson Description</h2>
            <p className="text-gray-600">
              This is a placeholder for the video lesson content. The actual video player and lesson materials will be implemented here.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}