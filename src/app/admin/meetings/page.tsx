'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui';
import { 
  Plus,
  Trash2,
  Edit,
  Video,
  Save,
  X,
  ExternalLink,
  Copy,
  Check,
  AlertCircle,
  Users,
  Calendar,
  Activity
} from 'lucide-react';
import { AdminMeetingLinkService } from '@/apiservices/adminMeetingLinkService';
import { 
  AdminMeetingLink, 
  MeetingLinkForm,
  extractMeetingProvider,
  validateMeetingUrl 
} from '@/models/adminMeetingSchema';

export default function AdminMeetingsPage() {
  const [meetingLinks, setMeetingLinks] = useState<AdminMeetingLink[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingLink, setEditingLink] = useState<AdminMeetingLink | null>(null);
  const [copiedLinkId, setCopiedLinkId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  
  // Form state
  const [formData, setFormData] = useState<MeetingLinkForm>({
    name: '',
    url: '',
    isActive: true,
    maxConcurrentUsers: 100,
    description: '',
    provider: 'zoom',
  });

  const loadMeetingLinks = async () => {
    try {
      setIsLoading(true);
      const links = await AdminMeetingLinkService.getAllMeetingLinks();
      setMeetingLinks(links);
    } catch (error) {
      console.error('Error loading meeting links:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Load meeting links on component mount
  useEffect(() => {
    loadMeetingLinks();
  }, []);

  const handleAddLink = async () => {
    if (!formData.name || !formData.url) {
      alert('Please fill required fields');
      return;
    }

    if (!validateMeetingUrl(formData.url)) {
      alert('Please provide a valid meeting URL from a supported platform');
      return;
    }

    try {
      const linkData = {
        ...formData,
        provider: extractMeetingProvider(formData.url),
        usageCount: 0, // New links start with 0 usage
      };

      if (editingLink) {
        await AdminMeetingLinkService.updateMeetingLink(editingLink.id, linkData);
      } else {
        await AdminMeetingLinkService.createMeetingLink(linkData);
      }

      setFormData({
        name: '',
        url: '',
        isActive: true,
        maxConcurrentUsers: 100,
        description: '',
        provider: 'zoom',
      });
      setEditingLink(null);
      setShowAddForm(false);
      await loadMeetingLinks();
    } catch (error) {
      console.error('Error saving meeting link:', error);
      alert('Failed to save meeting link');
    }
  };

  const handleEditLink = (link: AdminMeetingLink) => {
    setFormData({
      name: link.name,
      url: link.url,
      isActive: link.isActive,
      maxConcurrentUsers: link.maxConcurrentUsers,
      description: link.description || '',
      provider: link.provider,
    });
    setEditingLink(link);
    setShowAddForm(true);
  };

  const handleDeleteLink = async (id: string) => {
    if (confirm('Are you sure you want to delete this meeting link?')) {
      try {
        await AdminMeetingLinkService.deleteMeetingLink(id);
        await loadMeetingLinks();
      } catch (error) {
        console.error('Error deleting meeting link:', error);
        alert('Failed to delete meeting link');
      }
    }
  };

  const handleToggleActive = async (id: string) => {
    try {
      await AdminMeetingLinkService.toggleActiveStatus(id);
      await loadMeetingLinks();
    } catch (error) {
      console.error('Error toggling status:', error);
      alert('Failed to update status');
    }
  };

  const handleCopyLink = async (link: AdminMeetingLink) => {
    try {
      await navigator.clipboard.writeText(link.url);
      setCopiedLinkId(link.id);
      setTimeout(() => setCopiedLinkId(''), 2000);
    } catch (error) {
      console.error('Failed to copy link:', error);
      alert('Failed to copy link');
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getProviderColor = (provider: string) => {
    switch (provider) {
      case 'zoom': return 'bg-blue-100 text-blue-800';
      case 'teams': return 'bg-purple-100 text-purple-800';
      case 'meet': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Meeting Management
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Manage meeting links for teacher-student consultations
        </p>
      </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-6"></div>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
              ))}
            </div>
          </div>
        ) : (
          /* Meeting Links Management */
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                  <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                        Meeting Links
                      </h2>
                      <Button
                        onClick={() => setShowAddForm(true)}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Meeting Link
                      </Button>
                    </div>
                  </div>

                  <div className="p-6">
                    {/* Add/Edit Form */}
                    {showAddForm && (
                      <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg mb-6">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                          {editingLink ? 'Edit Meeting Link' : 'Add Meeting Link'}
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Name *
                            </label>
                            <input
                              type="text"
                              value={formData.name}
                              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                              placeholder="Enter meeting link name"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Max Concurrent Users
                            </label>
                            <input
                              type="number"
                              value={formData.maxConcurrentUsers}
                              onChange={(e) => setFormData({ ...formData, maxConcurrentUsers: parseInt(e.target.value) })}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                              min="1"
                              max="1000"
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Meeting URL *
                            </label>
                            <input
                              type="url"
                              value={formData.url}
                              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                              placeholder="https://zoom.us/j/123456789 or similar"
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Description
                            </label>
                            <textarea
                              value={formData.description}
                              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                              rows={3}
                              placeholder="Optional description for this meeting link"
                            />
                          </div>
                        </div>
                        <div className="flex justify-end space-x-3 mt-4">
                          <Button
                            variant="outline"
                            onClick={() => {
                              setShowAddForm(false);
                              setEditingLink(null);
                              setFormData({
                                name: '',
                                url: '',
                                isActive: true,
                                maxConcurrentUsers: 100,
                                description: '',
                                provider: 'zoom',
                              });
                            }}
                          >
                            <X className="w-4 h-4 mr-2" />
                            Cancel
                          </Button>
                          <Button onClick={handleAddLink}>
                            <Save className="w-4 h-4 mr-2" />
                            {editingLink ? 'Update' : 'Add'} Link
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Meeting Links List */}
                    <div className="space-y-4">
                      {meetingLinks.length === 0 ? (
                        <div className="text-center py-8">
                          <Video className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-500 dark:text-gray-400">
                            No meeting links configured. Add your first meeting link to get started.
                          </p>
                        </div>
                      ) : (
                        meetingLinks.map((link) => (
                          <div
                            key={link.id}
                            className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 bg-white dark:bg-gray-800"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-3 mb-2">
                                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                                    {link.name}
                                  </h3>
                                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getProviderColor(link.provider)}`}>
                                    {link.provider.toUpperCase()}
                                  </span>
                                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                    link.isActive 
                                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                                      : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                                  }`}>
                                    {link.isActive ? 'Active' : 'Inactive'}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                  {link.description || 'No description provided'}
                                </p>
                                <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                                  <span className="flex items-center">
                                    <Users className="w-4 h-4 mr-1" />
                                    Max: {link.maxConcurrentUsers} users
                                  </span>
                                  <span className="flex items-center">
                                    <Activity className="w-4 h-4 mr-1" />
                                    Used: {link.usageCount} times
                                  </span>
                                  <span className="flex items-center">
                                    <Calendar className="w-4 h-4 mr-1" />
                                    Created: {formatDate(link.createdAt)}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2 ml-4">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleCopyLink(link)}
                                >
                                  {copiedLinkId === link.id ? (
                                    <Check className="w-4 h-4" />
                                  ) : (
                                    <Copy className="w-4 h-4" />
                                  )}
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEditLink(link)}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleToggleActive(link.id)}
                                  className={link.isActive ? 'text-red-600' : 'text-green-600'}
                                >
                                  {link.isActive ? 'Deactivate' : 'Activate'}
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDeleteLink(link.id)}
                                  className="text-red-600"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => window.open(link.url, '_blank')}
                                >
                                  <ExternalLink className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
          )}
    </div>
  );
}
