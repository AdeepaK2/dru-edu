'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStudentAuth } from '@/hooks/useStudentAuth';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import Button from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Clock, Award, TrendingUp, ExternalLink, FileText, Play, Image, Download, Eye, CheckCircle, Circle } from 'lucide-react';
import { getEnrollmentsByStudent } from '@/services/studentEnrollmentService';
import { getStudyMaterialsByClass, markMaterialCompleted, unmarkMaterialCompleted } from '@/apiservices/studyMaterialFirestoreService';

interface ClassWithProgress {
  id: string;
  name: string;
  subject: string;
  totalMaterials: number;
  completedMaterials: number;
  requiredMaterials: number;
  completedRequired: number;
  recentMaterials: number;
  progress: number;
  requiredProgress: number;
}

interface StudyMaterial {
  id: string;
  title: string;
  description?: string;
  fileType: string;
  fileUrl?: string;
  linkUrl?: string;
  isRequired: boolean;
  uploadedAt: any;
  lessonId?: string;
  lessonName?: string;
  completedBy?: string[];
  viewCount?: number;
  downloadCount?: number;
}

export default function StudentStudyPage() {
  const router = useRouter();
  const { student, loading } = useStudentAuth();
  const [classes, setClasses] = useState<ClassWithProgress[]>([]);
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [materialLoading, setMaterialLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [expandedWeeks, setExpandedWeeks] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!loading && !student) {
      router.push('/student/login');
      return;
    }

    if (student) {
      loadStudentClasses();
    }
  }, [student, loading, router]);

  const loadStudentClasses = async () => {
    if (!student) return;
    
    try {
      const enrollments = await getEnrollmentsByStudent(student.id);
      const classesWithProgress: ClassWithProgress[] = [];

      for (const enrollment of enrollments) {
        const classMaterials = await getStudyMaterialsByClass(enrollment.classId);
        
        const totalMaterials = classMaterials.length;
        const completedMaterials = classMaterials.filter(m => 
          m.completedBy?.includes(student.id) || false
        ).length;
        const requiredMaterials = classMaterials.filter(m => m.isRequired).length;
        const completedRequired = classMaterials.filter(m => 
          m.isRequired && (m.completedBy?.includes(student.id) || false)
        ).length;
        
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        const recentMaterials = classMaterials.filter(m => {
          const uploadDate = m.uploadedAt?.toDate ? m.uploadedAt.toDate() : (m.uploadedAt || new Date());
          return uploadDate > oneWeekAgo;
        }).length;

        const progress = totalMaterials > 0 ? (completedMaterials / totalMaterials) * 100 : 0;
        const requiredProgress = requiredMaterials > 0 ? (completedRequired / requiredMaterials) * 100 : 100;

        classesWithProgress.push({
          id: enrollment.classId,
          name: enrollment.className,
          subject: enrollment.subject,
          totalMaterials,
          completedMaterials,
          requiredMaterials,
          completedRequired,
          recentMaterials,
          progress,
          requiredProgress
        });
      }

      setClasses(classesWithProgress);
    } catch (error) {
      console.error('Error loading student classes:', error);
    }
  };

  const loadClassMaterials = async (classId: string) => {
    setMaterialLoading(true);
    try {
      const classMaterials = await getStudyMaterialsByClass(classId);
      setMaterials(classMaterials);
      setSelectedClass(classId);
    } catch (error) {
      console.error('Error loading class materials:', error);
    } finally {
      setMaterialLoading(false);
    }
  };

  const getFileIcon = (fileType: string) => {
    switch (fileType?.toLowerCase()) {
      case 'pdf': return <FileText className="w-5 h-5 text-red-500" />;
      case 'video': return <Play className="w-5 h-5 text-purple-500" />;
      case 'link': return <ExternalLink className="w-5 h-5 text-blue-500" />;
      case 'image': return <Image className="w-5 h-5 text-green-500" />;
      default: return <FileText className="w-5 h-5 text-gray-500" />;
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'bg-green-500';
    if (progress >= 60) return 'bg-blue-500';
    if (progress >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getProgressText = (progress: number) => {
    if (progress >= 80) return 'Excellent';
    if (progress >= 60) return 'Good';
    if (progress >= 40) return 'Fair';
    return 'Needs Attention';
  };

  const filteredMaterials = materials.filter(material => {
    const matchesSearch = material.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         material.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         material.lessonName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;

    switch (filterType) {
      case 'required': return material.isRequired;
      case 'completed': return material.completedBy?.includes(student?.id || '') || false;
      case 'pending': return !(material.completedBy?.includes(student?.id || '') || false);
      case 'pdf': return material.fileType?.toLowerCase() === 'pdf';
      case 'video': return material.fileType?.toLowerCase() === 'video';
      case 'link': return material.fileType?.toLowerCase() === 'link';
      case 'image': return material.fileType?.toLowerCase() === 'image';
      default: return true;
    }
  });

  const groupMaterialsByWeek = (materials: StudyMaterial[]) => {
    const weeks: { [key: string]: StudyMaterial[] } = {};
    
    materials.forEach(material => {
      const uploadDate = material.uploadedAt?.toDate ? material.uploadedAt.toDate() : (material.uploadedAt || new Date());
      const weekStart = new Date(uploadDate);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      const weekKey = weekStart.toISOString().split('T')[0];
      
      if (!weeks[weekKey]) {
        weeks[weekKey] = [];
      }
      weeks[weekKey].push(material);
    });

    return Object.entries(weeks).sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime());
  };

  const toggleWeekExpansion = (weekKey: string) => {
    const newExpanded = new Set(expandedWeeks);
    if (newExpanded.has(weekKey)) {
      newExpanded.delete(weekKey);
    } else {
      newExpanded.add(weekKey);
    }
    setExpandedWeeks(newExpanded);
  };

  const openLink = (url: string) => {
    window.open(url, '_blank');
  };

  const viewMaterial = (material: StudyMaterial) => {
    if (material.fileUrl) {
      window.open(material.fileUrl, '_blank');
    }
  };

  const downloadMaterial = (material: StudyMaterial) => {
    if (material.fileUrl) {
      const link = document.createElement('a');
      link.href = material.fileUrl;
      link.download = material.title;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const toggleMaterialCompletion = async (material: StudyMaterial) => {
    if (!student) return;
    
    try {
      const isCompleted = material.completedBy?.includes(student.id) || false;
      
      if (isCompleted) {
        await unmarkMaterialCompleted(material.id, student.id);
      } else {
        await markMaterialCompleted(material.id, student.id);
      }
      
      // Refresh the materials list to show updated completion status
      if (selectedClass) {
        await loadClassMaterials(selectedClass);
      }
      
      // Refresh the classes list to update progress
      await loadStudentClasses();
    } catch (error) {
      console.error('Error toggling material completion:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-t-2 border-blue-600 border-solid rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!student) {
    return null;
  }

  const totalMaterials = classes.reduce((sum, cls) => sum + cls.totalMaterials, 0);
  const totalCompleted = classes.reduce((sum, cls) => sum + cls.completedMaterials, 0);
  const totalRequired = classes.reduce((sum, cls) => sum + cls.requiredMaterials, 0);
  const totalCompletedRequired = classes.reduce((sum, cls) => sum + cls.completedRequired, 0);
  const overallProgress = totalMaterials > 0 ? (totalCompleted / totalMaterials) * 100 : 0;
  const requiredProgress = totalRequired > 0 ? (totalCompletedRequired / totalRequired) * 100 : 100;

  if (selectedClass) {
    const currentClass = classes.find(c => c.id === selectedClass);
    const weeklyMaterials = groupMaterialsByWeek(filteredMaterials);

    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button 
            onClick={() => setSelectedClass(null)}
            variant="outline"
            className="mb-4"
          >
            ← Back to Dashboard
          </Button>
          
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                {currentClass?.name}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">{currentClass?.subject}</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600">
                {currentClass?.completedMaterials}/{currentClass?.totalMaterials}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Materials Completed</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Overall Progress</p>
                    <p className="text-2xl font-bold">{Math.round(currentClass?.progress || 0)}%</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-blue-500" />
                </div>
                <div className="mt-2 bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${currentClass?.progress || 0}%` }}
                  ></div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Required Materials</p>
                    <p className="text-2xl font-bold">{Math.round(currentClass?.requiredProgress || 0)}%</p>
                  </div>
                  <Award className="w-8 h-8 text-green-500" />
                </div>
                <div className="mt-2 bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                  <div 
                    className="bg-green-600 h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${currentClass?.requiredProgress || 0}%` }}
                  ></div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">New This Week</p>
                    <p className="text-2xl font-bold">{currentClass?.recentMaterials || 0}</p>
                  </div>
                  <Clock className="w-8 h-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search and Filter */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search materials..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600 dark:text-white"
              />
            </div>
            <div>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600 dark:text-white"
              >
                <option value="all">All Materials</option>
                <option value="required">Required Only</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="pdf">PDF Files</option>
                <option value="video">Videos</option>
                <option value="link">Links</option>
                <option value="image">Images</option>
              </select>
            </div>
          </div>
        </div>

        {materialLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-8 h-8 border-t-2 border-blue-600 border-solid rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {weeklyMaterials.map(([weekKey, weekMaterials]) => {
              const weekStart = new Date(weekKey);
              const weekEnd = new Date(weekStart);
              weekEnd.setDate(weekEnd.getDate() + 6);
              const isExpanded = expandedWeeks.has(weekKey);

              return (
                <Card key={weekKey}>
                  <CardHeader 
                    className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                    onClick={() => toggleWeekExpansion(weekKey)}
                  >
                    <CardTitle className="flex items-center justify-between">
                      <span>
                        Week of {weekStart.toLocaleDateString()} - {weekEnd.toLocaleDateString()}
                      </span>
                      <Badge variant="secondary">{weekMaterials.length} materials</Badge>
                    </CardTitle>
                  </CardHeader>
                  
                  {isExpanded && (
                    <CardContent>
                      <div className="space-y-4">
                        {weekMaterials.map((material) => {
                          const isCompleted = material.completedBy?.includes(student?.id || '') || false;
                          
                          return (
                          <div key={material.id} className={`flex items-center justify-between p-4 border rounded-lg dark:border-gray-700 ${
                            isCompleted 
                              ? 'border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800' 
                              : 'border-gray-200'
                          }`}>
                            <div className="flex items-center space-x-4 flex-1">
                              {getFileIcon(material.fileType)}
                              <div className="flex-1">
                                <div className="flex items-center space-x-2">
                                  {isCompleted && (
                                    <CheckCircle className="w-5 h-5 text-green-600" />
                                  )}
                                  <h3 className={`font-medium ${
                                    isCompleted 
                                      ? 'text-green-700 dark:text-green-400' 
                                      : 'text-gray-900 dark:text-white'
                                  }`}>
                                    {material.title}
                                  </h3>
                                  {material.isRequired && (
                                    <Badge variant="destructive" className="text-xs">Required</Badge>
                                  )}
                                  {material.lessonName && (
                                    <Badge variant="secondary" className="text-xs">
                                      {material.lessonName}
                                    </Badge>
                                  )}
                                </div>
                                {material.description && (
                                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                    {material.description}
                                  </p>
                                )}
                                <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                                  {(material.viewCount || 0) > 0 && (
                                    <span className="flex items-center space-x-1">
                                      <Eye className="w-3 h-3" />
                                      <span>{material.viewCount} views</span>
                                    </span>
                                  )}
                                  {(material.downloadCount || 0) > 0 && (
                                    <span className="flex items-center space-x-1">
                                      <Download className="w-3 h-3" />
                                      <span>{material.downloadCount} downloads</span>
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              {/* Completion Toggle Button */}
                              <Button
                                onClick={() => toggleMaterialCompletion(material)}
                                variant={material.completedBy?.includes(student?.id || '') ? "success" : "outline"}
                                size="sm"
                                className={material.completedBy?.includes(student?.id || '') 
                                  ? "bg-green-600 hover:bg-green-700 text-white" 
                                  : "border-green-600 text-green-600 hover:bg-green-50"
                                }
                              >
                                {material.completedBy?.includes(student?.id || '') ? (
                                  <>
                                    <CheckCircle className="w-4 h-4 mr-1" />
                                    Completed
                                  </>
                                ) : (
                                  <>
                                    <Circle className="w-4 h-4 mr-1" />
                                    Mark Complete
                                  </>
                                )}
                              </Button>

                              {/* Action Buttons */}
                              {material.fileType === 'link' ? (
                                <Button
                                  onClick={() => openLink(material.linkUrl || '')}
                                  size="sm"
                                  className="bg-blue-600 hover:bg-blue-700"
                                >
                                  <ExternalLink className="w-4 h-4 mr-1" />
                                  Open Link
                                </Button>
                              ) : (
                                <>
                                  <Button
                                    onClick={() => viewMaterial(material)}
                                    variant="outline"
                                    size="sm"
                                  >
                                    <Eye className="w-4 h-4 mr-1" />
                                    View
                                  </Button>
                                  <Button
                                    onClick={() => downloadMaterial(material)}
                                    variant="outline"
                                    size="sm"
                                  >
                                    <Download className="w-4 h-4 mr-1" />
                                    Download
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
          Welcome back, {student.name}!
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Track your learning progress and access your study materials
        </p>
      </div>

      {/* Overall Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Overall Progress
                </p>
                <div className="flex items-center space-x-2 mt-2">
                  <span className="text-2xl font-bold text-gray-900 dark:text-white">
                    {Math.round(overallProgress)}%
                  </span>
                  <Badge className={getProgressColor(overallProgress)}>
                    {getProgressText(overallProgress)}
                  </Badge>
                </div>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-500" />
            </div>
            <div className="mt-4 bg-gray-200 rounded-full h-2 dark:bg-gray-700">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                style={{ width: `${overallProgress}%` }}
              ></div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Required Materials
                </p>
                <div className="flex items-center space-x-2 mt-2">
                  <span className="text-2xl font-bold text-gray-900 dark:text-white">
                    {Math.round(requiredProgress)}%
                  </span>
                </div>
              </div>
              <Award className="w-8 h-8 text-green-500" />
            </div>
            <div className="mt-4 bg-gray-200 rounded-full h-2 dark:bg-gray-700">
              <div 
                className="bg-green-600 h-2 rounded-full transition-all duration-300" 
                style={{ width: `${requiredProgress}%` }}
              ></div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Enrolled Classes
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                  {classes.length}
                </p>
              </div>
              <BookOpen className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  New This Week
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                  {classes.reduce((sum, cls) => sum + cls.recentMaterials, 0)}
                </p>
              </div>
              <Clock className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Classes Grid */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Your Classes</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {classes.map((classItem) => (
            <Card key={classItem.id} className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{classItem.name}</CardTitle>
                  {classItem.recentMaterials > 0 && (
                    <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                      {classItem.recentMaterials} new
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{classItem.subject}</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Overall Progress</span>
                      <span>{Math.round(classItem.progress)}%</span>
                    </div>
                    <div className="bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${classItem.progress}%` }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Required Materials</span>
                      <span>{classItem.completedRequired}/{classItem.requiredMaterials}</span>
                    </div>
                    <div className="bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                      <div 
                        className="bg-green-600 h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${classItem.requiredProgress}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                    <span>Total Materials</span>
                    <span>{classItem.completedMaterials}/{classItem.totalMaterials}</span>
                  </div>

                  <Button 
                    onClick={() => loadClassMaterials(classItem.id)}
                    className="w-full mt-4"
                  >
                    View Materials
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {classes.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No Classes Enrolled
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              You haven't enrolled in any classes yet.
            </p>
            <Button onClick={() => router.push('/enroll')}>
              Browse Available Classes
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}