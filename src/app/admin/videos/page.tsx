'use client';

import React, { useState } from 'react';

// Dummy data for videos
const videosData = [
  {
    id: 1,
    title: 'Introduction to Calculus',
    subject: 'Mathematics',
    teacher: 'Dr. Jane Smith',
    duration: '45 minutes',
    uploadDate: '2024-08-15',
    views: 1245,
    grade: '12th',
    status: 'Published',
    thumbnail: 'https://via.placeholder.com/300x180?text=Calculus',
    description: 'Comprehensive introduction to differential and integral calculus concepts.',
    videoUrl: 'https://example.com/videos/calculus-intro.mp4'
  },
  {
    id: 2,
    title: 'Quantum Physics Explained',
    subject: 'Physics',
    teacher: 'Prof. John Wilson',
    duration: '52 minutes',
    uploadDate: '2024-07-22',
    views: 987,
    grade: '12th',
    status: 'Published',
    thumbnail: 'https://via.placeholder.com/300x180?text=Quantum+Physics',
    description: 'Exploring quantum mechanics principles and wave-particle duality.',
    videoUrl: 'https://example.com/videos/quantum-physics.mp4'
  },
  {
    id: 3,
    title: 'Cell Structure and Function',
    subject: 'Biology',
    teacher: 'Dr. Emily Johnson',
    duration: '38 minutes',
    uploadDate: '2024-08-05',
    views: 763,
    grade: '11th',
    status: 'Published',
    thumbnail: 'https://via.placeholder.com/300x180?text=Cell+Biology',
    description: 'Detailed exploration of cell organelles and their functions in living organisms.',
    videoUrl: 'https://example.com/videos/cell-biology.mp4'
  },
  {
    id: 4,
    title: 'Understanding Chemical Bonds',
    subject: 'Chemistry',
    teacher: 'Prof. Michael Lee',
    duration: '41 minutes',
    uploadDate: '2024-08-10',
    views: 621,
    grade: '11th',
    status: 'Published',
    thumbnail: 'https://via.placeholder.com/300x180?text=Chemical+Bonds',
    description: 'Analysis of covalent, ionic, and metallic bonds in chemical compounds.',
    videoUrl: 'https://example.com/videos/chemical-bonds.mp4'
  },
  {
    id: 5,
    title: 'Advanced Data Structures',
    subject: 'Computer Science',
    teacher: 'Dr. Sarah Parker',
    duration: '60 minutes',
    uploadDate: '2024-07-30',
    views: 1052,
    grade: '12th',
    status: 'Draft',
    thumbnail: 'https://via.placeholder.com/300x180?text=Data+Structures',
    description: 'Implementation and analysis of trees, graphs, and advanced algorithms.',
    videoUrl: 'https://example.com/videos/data-structures.mp4'
  }
];

export default function VideoPortalManager() {
  const [videos, setVideos] = useState(videosData);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVideo, setSelectedVideo] = useState<typeof videosData[0] | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const filteredVideos = videos.filter(video => {
    return (
      video.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      video.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      video.teacher.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const handleOpenModal = (video: typeof videosData[0] | null, isEdit = false) => {
    setSelectedVideo(video);
    setEditMode(isEdit);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setSelectedVideo(null);
    setModalOpen(false);
    setEditMode(false);
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'Published':
        return 'bg-green-100 text-green-800';
      case 'Draft':
        return 'bg-yellow-100 text-yellow-800';
      case 'Private':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDuration = (duration: string) => {
    return duration;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Video Portal Manager</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Upload, manage, and organize educational videos for students
            </p>
          </div>
          <div className="mt-4 md:mt-0">
            <button
              onClick={() => handleOpenModal(null, true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              <span className="flex items-center">
                <span className="material-symbols-outlined mr-1 text-sm">upload</span>
                Upload Video
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="material-symbols-outlined text-gray-400">search</span>
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out sm:text-sm"
              placeholder="Search videos by title, subject, or teacher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex space-x-2 items-center">
            <div className="flex flex-wrap gap-2">
              <select className="border border-gray-300 rounded-md p-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                <option value="">Filter by Subject</option>
                <option value="mathematics">Mathematics</option>
                <option value="physics">Physics</option>
                <option value="biology">Biology</option>
                <option value="chemistry">Chemistry</option>
                <option value="computer-science">Computer Science</option>
              </select>
              <select className="border border-gray-300 rounded-md p-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                <option value="">Filter by Grade</option>
                <option value="10th">10th Grade</option>
                <option value="11th">11th Grade</option>
                <option value="12th">12th Grade</option>
              </select>
            </div>
            <div className="flex bg-gray-100 dark:bg-gray-700 rounded-md">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'text-gray-700 dark:text-gray-300'} rounded-l-md`}
                title="Grid View"
              >
                <span className="material-symbols-outlined">grid_view</span>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'text-gray-700 dark:text-gray-300'} rounded-r-md`}
                title="List View"
              >
                <span className="material-symbols-outlined">view_list</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Video Grid View */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVideos.map((video) => (
            <div key={video.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
              <div className="relative">
                <img 
                  src={video.thumbnail} 
                  alt={video.title}
                  className="w-full h-48 object-cover"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-3">
                  <span className="text-white text-sm">{formatDuration(video.duration)}</span>
                </div>
                <div className="absolute top-2 right-2">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeColor(video.status)}`}>
                    {video.status}
                  </span>
                </div>
              </div>
              <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1 truncate" title={video.title}>
                  {video.title}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{video.subject} • {video.grade} Grade</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">By {video.teacher}</p>
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span className="flex items-center">
                    <span className="material-symbols-outlined text-sm mr-1">visibility</span>
                    {video.views} views
                  </span>
                  <span>{formatDate(video.uploadDate)}</span>
                </div>
                <div className="mt-4 flex justify-between">
                  <button
                    onClick={() => handleOpenModal(video)}
                    className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    <span className="flex items-center">
                      <span className="material-symbols-outlined mr-1">play_arrow</span>
                      Preview
                    </span>
                  </button>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleOpenModal(video, true)}
                      className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300"
                      title="Edit Video"
                    >
                      <span className="material-symbols-outlined">edit</span>
                    </button>
                    <button
                      className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                      title="Delete Video"
                    >
                      <span className="material-symbols-outlined">delete</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Video List View */}
      {viewMode === 'list' && (
        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Video
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Subject
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Grade
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Teacher
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Duration
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Views
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredVideos.map((video) => (
                  <tr key={video.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-16 w-24 relative">
                          <img 
                            className="h-16 w-24 object-cover rounded" 
                            src={video.thumbnail} 
                            alt={video.title} 
                          />
                          <div className="absolute bottom-1 right-1 bg-black bg-opacity-75 text-white text-xs px-1 rounded">
                            {video.duration}
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">{video.title}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">Uploaded on {formatDate(video.uploadDate)}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {video.subject}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {video.grade}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {video.teacher}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {video.duration}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {video.views}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(video.status)}`}>
                        {video.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleOpenModal(video)}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                          title="Preview Video"
                        >
                          <span className="material-symbols-outlined">play_arrow</span>
                        </button>
                        <button
                          onClick={() => handleOpenModal(video, true)}
                          className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                          title="Edit Video"
                        >
                          <span className="material-symbols-outlined">edit</span>
                        </button>
                        <button
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                          title="Delete Video"
                        >
                          <span className="material-symbols-outlined">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredVideos.length === 0 && (
            <div className="text-center py-10">
              <p className="text-gray-500 dark:text-gray-400">No videos found matching your search criteria.</p>
            </div>
          )}
        </div>
      )}

      {/* Video Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  {editMode ? (selectedVideo ? 'Edit Video' : 'Upload New Video') : 'Video Preview'}
                </h3>
                <button onClick={handleCloseModal} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              {editMode ? (
                <form className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Title</label>
                      <input
                        type="text"
                        id="title"
                        name="title"
                        defaultValue={selectedVideo?.title || ''}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>
                    <div>
                      <label htmlFor="subject" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Subject</label>
                      <select
                        id="subject"
                        name="subject"
                        defaultValue={selectedVideo?.subject || ''}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      >
                        <option value="Mathematics">Mathematics</option>
                        <option value="Physics">Physics</option>
                        <option value="Biology">Biology</option>
                        <option value="Chemistry">Chemistry</option>
                        <option value="Computer Science">Computer Science</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="grade" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Grade</label>
                      <select
                        id="grade"
                        name="grade"
                        defaultValue={selectedVideo?.grade || '12th'}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      >
                        <option value="10th">10th Grade</option>
                        <option value="11th">11th Grade</option>
                        <option value="12th">12th Grade</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="teacher" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Teacher</label>
                      <input
                        type="text"
                        id="teacher"
                        name="teacher"
                        defaultValue={selectedVideo?.teacher || ''}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>
                    <div>
                      <label htmlFor="duration" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Duration</label>
                      <input
                        type="text"
                        id="duration"
                        name="duration"
                        defaultValue={selectedVideo?.duration || ''}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        placeholder="e.g. 45 minutes"
                      />
                    </div>
                    <div>
                      <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
                      <select
                        id="status"
                        name="status"
                        defaultValue={selectedVideo?.status || 'Draft'}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      >
                        <option value="Published">Published</option>
                        <option value="Draft">Draft</option>
                        <option value="Private">Private</option>
                      </select>
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
                    <textarea
                      id="description"
                      name="description"
                      rows={3}
                      defaultValue={selectedVideo?.description || ''}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    ></textarea>
                  </div>
                  
                  {!selectedVideo && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Upload Video</label>
                      <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                        <div className="space-y-1 text-center">
                          <span className="material-symbols-outlined mx-auto h-12 w-12 text-gray-400">cloud_upload</span>
                          <div className="flex text-sm text-gray-600 dark:text-gray-400">
                            <label htmlFor="file-upload" className="relative cursor-pointer bg-white dark:bg-gray-700 rounded-md font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 focus-within:outline-none">
                              <span>Upload a file</span>
                              <input id="file-upload" name="file-upload" type="file" className="sr-only" />
                            </label>
                            <p className="pl-1">or drag and drop</p>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            MP4, WebM up to 1GB
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Thumbnail</label>
                    <div className="mt-1 flex items-center">
                      {selectedVideo && (
                        <div className="mr-4">
                          <img 
                            src={selectedVideo.thumbnail} 
                            alt="Current thumbnail" 
                            className="h-20 w-32 object-cover rounded"
                          />
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="flex text-sm text-gray-600 dark:text-gray-400">
                          <label htmlFor="thumbnail-upload" className="relative cursor-pointer bg-white dark:bg-gray-700 rounded-md font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 focus-within:outline-none p-2 border border-gray-300 dark:border-gray-600">
                            <span>Change thumbnail</span>
                            <input id="thumbnail-upload" name="thumbnail-upload" type="file" accept="image/*" className="sr-only" />
                          </label>
                        </div>
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          JPG, PNG up to 5MB
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-end space-x-2 pt-4">
                    <button
                      type="button"
                      onClick={handleCloseModal}
                      className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 transition-colors dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                    >
                      {selectedVideo ? 'Update Video' : 'Upload Video'}
                    </button>
                  </div>
                </form>
              ) : selectedVideo && (
                <div className="space-y-6">
                  <div className="aspect-w-16 aspect-h-9 bg-black rounded-lg overflow-hidden">
                    {/* Video Player Placeholder */}
                    <div className="w-full h-full flex items-center justify-center bg-gray-900">
                      <div className="text-center">
                        <div className="rounded-full bg-white bg-opacity-25 p-4 inline-flex items-center justify-center mb-4">
                          <span className="material-symbols-outlined text-white text-4xl">play_arrow</span>
                        </div>
                        <p className="text-white text-lg">Play Video</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xl font-semibold text-gray-900 dark:text-white">{selectedVideo.title}</h4>
                    <div className="flex items-center mt-2 text-sm text-gray-500 dark:text-gray-400">
                      <span className="mr-4">{selectedVideo.views} views</span>
                      <span className="mr-4">Uploaded on {formatDate(selectedVideo.uploadDate)}</span>
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(selectedVideo.status)}`}>
                        {selectedVideo.status}
                      </span>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Subject</p>
                      <p className="text-base font-medium text-gray-900 dark:text-white">{selectedVideo.subject}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Grade</p>
                      <p className="text-base font-medium text-gray-900 dark:text-white">{selectedVideo.grade}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Teacher</p>
                      <p className="text-base font-medium text-gray-900 dark:text-white">{selectedVideo.teacher}</p>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                    <h5 className="font-medium text-gray-900 dark:text-white mb-2">Description</h5>
                    <p className="text-gray-700 dark:text-gray-300">{selectedVideo.description}</p>
                  </div>

                  <div className="flex justify-end space-x-2 pt-4">
                    <button
                      onClick={handleCloseModal}
                      className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 transition-colors dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
                    >
                      Close
                    </button>
                    <button
                      onClick={() => {
                        handleCloseModal();
                        handleOpenModal(selectedVideo, true);
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                    >
                      Edit
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
