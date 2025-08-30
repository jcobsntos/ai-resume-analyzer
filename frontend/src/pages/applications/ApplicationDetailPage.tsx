import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useApplicationStore } from '@/store/applicationStore';
import { useAuthStore } from '@/store/authStore';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import {
  ArrowLeftIcon,
  UserIcon,
  BriefcaseIcon,
  CalendarDaysIcon,
  DocumentTextIcon,
  StarIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  EyeIcon,
  PencilSquareIcon,
  ChatBubbleLeftRightIcon,
  DocumentArrowDownIcon,
  SparklesIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';
import { formatDate, formatDateTime } from '@/lib/utils';
import { downloadResume as downloadResumeUtil } from '@/utils/downloadUtils';
import { ApplicationStatus } from '@/types';
import toast from 'react-hot-toast';

type InterviewPayload = { type: 'phone' | 'video' | 'in-person' | 'technical'; scheduledDate: string; duration?: number; notes?: string };

const InterviewForm: React.FC<{ onSubmit: (payload: InterviewPayload) => void; onCancel: () => void; }> = ({ onSubmit, onCancel }) => {
  const [type, setType] = useState<InterviewPayload['type']>('phone');
  const [scheduledDate, setScheduledDate] = useState('');
  const [duration, setDuration] = useState(60);
  const [notes, setNotes] = useState('');

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit({ type, scheduledDate, duration, notes }); }} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
        <select value={type} onChange={(e) => setType(e.target.value as InterviewPayload['type'])} className="w-full border rounded px-3 py-2">
          <option value="phone">Phone</option>
          <option value="video">Video</option>
          <option value="in-person">In-person</option>
          <option value="technical">Technical</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Date & Time</label>
        <input type="datetime-local" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} className="w-full border rounded px-3 py-2" required />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Duration (minutes)</label>
        <input type="number" min={15} max={480} value={duration} onChange={(e) => setDuration(parseInt(e.target.value) || 60)} className="w-full border rounded px-3 py-2" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full border rounded px-3 py-2" rows={3} placeholder="Optional notes" />
      </div>
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="px-4 py-2 border rounded text-gray-700">Cancel</button>
        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Schedule</button>
      </div>
    </form>
  );
};

export const ApplicationDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const {
    currentApplication,
    fetchApplicationById,
    updateApplicationStatus,
    addNote,
    scheduleInterview,
    reAnalyzeApplication,
    isLoading,
  } = useApplicationStore();

  const [showStatusUpdate, setShowStatusUpdate] = useState(false);
  const [newStatus, setNewStatus] = useState<ApplicationStatus | ''>('');
  const [statusNote, setStatusNote] = useState('');
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [showInterviewForm, setShowInterviewForm] = useState(false);

  useEffect(() => {
    if (id) {
      fetchApplicationById(id);
    }
  }, [id, fetchApplicationById]);

  const handleStatusUpdate = async () => {
    if (!newStatus || !id) return;
    
    // Map UI statuses to backend statuses
    const map: Record<string, ApplicationStatus> = {
      pending: 'applied' as any,
      reviewing: 'screening' as any,
      interviewing: 'interview' as any,
      hired: 'hired' as any,
      rejected: 'rejected' as any,
    };
    const backendStatus = (map[newStatus] || newStatus) as ApplicationStatus;

    const success = await updateApplicationStatus(id, backendStatus, statusNote || undefined);
    if (success) {
      setShowStatusUpdate(false);
      setNewStatus('');
      setStatusNote('');
      toast.success('Status updated successfully!');
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim() || !id) return;
    
    const success = await addNote(id, newNote.trim());
    if (success) {
      setShowNoteForm(false);
      setNewNote('');
      toast.success('Note added successfully!');
    }
  };

  const handleReAnalyze = async () => {
    if (!id) return;
    
    const success = await reAnalyzeApplication(id);
    if (success) {
      toast.success('Resume re-analyzed successfully!');
    }
  };

  const downloadResume = async () => {
    if (!currentApplication) return;
    
    // Use the candidateId if admin/recruiter, null for own resume
    const candidateId = isRecruiterOrAdmin ? (currentApplication.candidate as any)?._id : null;
    
    await downloadResumeUtil(candidateId);
  };

  const getStatusColor = (status: string) => {
    const colors = {
      'pending': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'reviewing': 'bg-blue-100 text-blue-800 border-blue-200',
      'interviewing': 'bg-purple-100 text-purple-800 border-purple-200',
      'hired': 'bg-green-100 text-green-800 border-green-200',
      'rejected': 'bg-red-100 text-red-800 border-red-200',
      'withdrawn': 'bg-gray-100 text-gray-800 border-gray-200',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-50 border-green-200';
    if (score >= 60) return 'bg-yellow-50 border-yellow-200';
    return 'bg-red-50 border-red-200';
  };

  if (isLoading || !currentApplication) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Loading application details...</p>
        </div>
      </div>
    );
  }

  const isRecruiterOrAdmin = user?.role === 'recruiter' || user?.role === 'admin';
  const isOwnApplication = user?._id === currentApplication.candidate?._id;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <div className="mb-6">
          <Link
            to="/applications"
            className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to Applications
          </Link>
        </div>

        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border p-8 mb-8">
          <div className="flex justify-between items-start mb-6">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {(typeof currentApplication.job === 'object' && currentApplication.job ? currentApplication.job.title : 'Job Not Available')}
              </h1>
              <div className="flex items-center space-x-4 text-lg">
                <span className="font-semibold text-blue-600">
                  {(typeof currentApplication.job === 'object' && currentApplication.job ? currentApplication.job.company : 'Company Not Available')}
                </span>
                <span className="text-gray-500">•</span>
                <span className="text-gray-600">
                  {currentApplication.candidate?.firstName} {currentApplication.candidate?.lastName}
                </span>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* AI Score */}
              {currentApplication.aiAnalysis?.overallScore && (
                <div className={`px-4 py-2 rounded-lg border ${getScoreBgColor(currentApplication.aiAnalysis.overallScore)}`}>
                  <div className="flex items-center">
                    <StarIcon className={`h-5 w-5 mr-2 ${getScoreColor(currentApplication.aiAnalysis.overallScore)}`} />
                    <span className={`font-bold text-lg ${getScoreColor(currentApplication.aiAnalysis.overallScore)}`}>
                      {currentApplication.aiAnalysis.overallScore}%
                    </span>
                  </div>
                  <div className="text-xs text-gray-600 text-center mt-1">AI Match Score</div>
                </div>
              )}
              
              {/* Status */}
              <div className={`px-4 py-2 rounded-lg border ${getStatusColor(currentApplication.status)}`}>
                <div className="font-semibold capitalize text-center">{currentApplication.status}</div>
                <div className="text-xs text-center mt-1">Current Status</div>
              </div>
            </div>
          </div>

          {/* Quick Actions for Recruiters */}
          {isRecruiterOrAdmin && (
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setShowStatusUpdate(true)}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <PencilSquareIcon className="h-4 w-4 mr-2" />
                Update Status
              </button>
              
              <button
                onClick={() => setShowNoteForm(true)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                <ChatBubbleLeftRightIcon className="h-4 w-4 mr-2" />
                Add Note
              </button>
              
              <button
                onClick={() => setShowInterviewForm(true)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                <CalendarDaysIcon className="h-4 w-4 mr-2" />
                Schedule Interview
              </button>
              
              <button
                onClick={handleReAnalyze}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                <SparklesIcon className="h-4 w-4 mr-2" />
                Re-analyze Resume
              </button>
            </div>
          )}

          {/* Interview Schedule Modal */}
          {isRecruiterOrAdmin && showInterviewForm && (
            <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30">
              <div className="bg-white rounded-lg shadow-xl border w-full max-w-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Schedule Interview</h3>
                  <button onClick={() => setShowInterviewForm(false)} className="text-gray-500 hover:text-gray-700">✕</button>
                </div>
                <InterviewForm 
                  onCancel={() => setShowInterviewForm(false)} 
                  onSubmit={async (payload) => {
                    if (!id) return;
                    const ok = await scheduleInterview(id, payload);
                    if (ok) {
                      setShowInterviewForm(false);
                    }
                  }}
                />
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Candidate Information */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <UserIcon className="h-6 w-6 mr-2 text-blue-600" />
                Candidate Information
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Personal Details</h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">Name:</span> {currentApplication.candidate?.firstName} {currentApplication.candidate?.lastName}</p>
                    <p><span className="font-medium">Email:</span> {currentApplication.candidate?.email}</p>
                    {currentApplication.candidate?.phone && (
                      <p><span className="font-medium">Phone:</span> {currentApplication.candidate.phone}</p>
                    )}
                    {currentApplication.candidate?.location && (
                      <p><span className="font-medium">Location:</span> {currentApplication.candidate.location}</p>
                    )}
                  </div>
                </div>
                
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Professional Info</h3>
                  <div className="space-y-2 text-sm">
                    {currentApplication.candidate?.currentPosition && (
                      <p><span className="font-medium">Current Position:</span> {currentApplication.candidate.currentPosition}</p>
                    )}
                    {currentApplication.candidate?.experience && (
                      <p><span className="font-medium">Experience:</span> {currentApplication.candidate.experience} years</p>
                    )}
                    {currentApplication.candidate?.skills && currentApplication.candidate.skills.length > 0 && (
                      <div>
                        <span className="font-medium">Skills:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {currentApplication.candidate.skills.slice(0, 8).map((skill, index) => (
                            <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                              {skill}
                            </span>
                          ))}
                          {currentApplication.candidate.skills.length > 8 && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded">
                              +{currentApplication.candidate.skills.length - 8} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Resume */}
              {currentApplication.resumeAtApplication && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-gray-900">Resume</h3>
                    <button
                      onClick={downloadResume}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors text-sm"
                    >
                      <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
                      Download
                    </button>
                  </div>
                  <div className="mt-2 p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <DocumentTextIcon className="h-8 w-8 text-blue-600 mr-3" />
                      <div>
                        <p className="font-medium text-gray-900">{currentApplication.resumeAtApplication.originalName || 'Resume'}</p>
                        <p className="text-sm text-gray-600">Uploaded with application</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* AI Analysis */}
            {currentApplication.aiAnalysis && (
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <SparklesIcon className="h-6 w-6 mr-2 text-blue-600" />
                  AI Analysis Results
                </h2>
                
                {/* Overall Score */}
                <div className={`mb-6 p-4 rounded-lg border ${getScoreBgColor(currentApplication.aiAnalysis.overallScore || 0)}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-lg text-gray-900">Overall Match Score</h3>
                      <p className="text-sm text-gray-600">Based on resume analysis and job requirements</p>
                    </div>
                    <div className={`text-3xl font-bold ${getScoreColor(currentApplication.aiAnalysis.overallScore || 0)}`}>
                      {currentApplication.aiAnalysis.overallScore}%
                    </div>
                  </div>
                </div>

                {/* Key Strengths */}
                {(currentApplication.aiAnalysis.insights?.strengths?.length || 0) > 0 && (
                  <div className="mb-6">
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                      <CheckCircleIcon className="h-5 w-5 mr-2 text-green-600" />
                      Key Strengths
                    </h3>
                    <ul className="space-y-2">
                      {(currentApplication.aiAnalysis.insights?.strengths as string[]).map((strength: string, index: number) => (
                        <li key={index} className="flex items-start">
                          <span className="flex-shrink-0 w-2 h-2 bg-green-600 rounded-full mt-2 mr-3" />
                          <span className="text-gray-700">{strength}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Areas for Improvement */}
                {(currentApplication.aiAnalysis.insights?.weaknesses?.length || 0) > 0 && (
                  <div className="mb-6">
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                      <ExclamationTriangleIcon className="h-5 w-5 mr-2 text-yellow-600" />
                      Areas for Improvement
                    </h3>
                    <ul className="space-y-2">
                      {(currentApplication.aiAnalysis.insights?.weaknesses as string[]).map((area: string, index: number) => (
                        <li key={index} className="flex items-start">
                          <span className="flex-shrink-0 w-2 h-2 bg-yellow-600 rounded-full mt-2 mr-3" />
                          <span className="text-gray-700">{area}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Skill Matching */}
                {currentApplication.aiAnalysis.skillsMatch && (
                  <div className="mb-6">
                    <h3 className="font-semibold text-gray-900 mb-3">Skill Matching Analysis</h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-medium text-green-700 mb-2">Matched Skills</h4>
                          <div className="flex flex-wrap gap-1">
                            {currentApplication.aiAnalysis.skillsMatch.matchedSkills?.map((skill, index) => (
                              <span key={index} className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div>
                          <h4 className="font-medium text-red-700 mb-2">Missing Skills</h4>
                          <div className="flex flex-wrap gap-1">
                            {currentApplication.aiAnalysis.skillsMatch.missingSkills?.map((skill, index) => (
                              <span key={index} className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded">
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* AI Recommendations & Tips */}
                {(currentApplication.aiAnalysis.insights?.recommendations?.length || 0) > 0 && (
                  <div className="mb-6">
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                      <InformationCircleIcon className="h-5 w-5 mr-2 text-blue-600" />
                      Recommendations
                    </h3>
                    <ul className="space-y-2">
                      {(currentApplication.aiAnalysis.insights?.recommendations as string[]).map((rec: string, index: number) => (
                        <li key={index} className="flex items-start">
                          <span className="flex-shrink-0 w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3" />
                          <span className="text-gray-700">{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {(currentApplication.aiAnalysis.insights?.keywordSuggestions?.length || 0) > 0 && (
                  <div className="mb-6">
                    <h3 className="font-semibold text-gray-900 mb-3">Suggested Keywords</h3>
                    <div className="flex flex-wrap gap-1">
                      {(currentApplication.aiAnalysis.insights?.keywordSuggestions || []).slice(0, 10).map((kw: string, idx: number) => (
                        <span key={idx} className="px-2 py-1 bg-blue-50 text-blue-800 text-xs rounded border border-blue-200">{kw}</span>
                      ))}
                    </div>
                  </div>
                )}

                {(currentApplication.aiAnalysis.insights?.recommendedRoles?.length || 0) > 0 && (
                  <div className="mb-6">
                    <h3 className="font-semibold text-gray-900 mb-1">Recommended Roles</h3>
                    <p className="text-sm text-gray-600 mb-2">{currentApplication.aiAnalysis.insights?.careerLevelFit}</p>
                    <div className="flex flex-wrap gap-1">
                      {(currentApplication.aiAnalysis.insights?.recommendedRoles || []).map((role: string, idx: number) => (
                        <span key={idx} className="px-2 py-1 bg-purple-50 text-purple-800 text-xs rounded border border-purple-200">{role}</span>
                      ))}
                    </div>
                  </div>
                )}

                {(currentApplication.aiAnalysis.insights?.boostScoreActions?.length || 0) > 0 && (
                  <div className="mb-6">
                    <h3 className="font-semibold text-gray-900 mb-3">Quick Wins to Boost Score</h3>
                    <ul className="space-y-2">
                      {(currentApplication.aiAnalysis.insights?.boostScoreActions || []).slice(0, 3).map((a: any, idx: number) => (
                        <li key={idx} className="flex items-start">
                          <span className="flex-shrink-0 w-2 h-2 bg-green-600 rounded-full mt-2 mr-3" />
                          <span className="text-gray-700">{a.action} <span className="text-xs text-gray-500">(+{a.impact})</span></span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {(currentApplication.aiAnalysis.insights?.learningPaths?.length || 0) > 0 && (
                  <div className="mb-2">
                    <h3 className="font-semibold text-gray-900 mb-2">Learning Paths</h3>
                    <ul className="list-disc list-inside space-y-1 text-sm text-blue-700">
                      {(currentApplication.aiAnalysis.insights?.learningPaths || []).slice(0, 3).map((lp: any, idx: number) => (
                        <li key={idx}>
                          <a href={lp.url} target="_blank" rel="noreferrer" className="hover:underline">{lp.title}</a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Application Timeline */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <ClockIcon className="h-6 w-6 mr-2 text-gray-600" />
                Application Timeline
              </h2>
              
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <DocumentTextIcon className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="font-medium text-gray-900">Application Submitted</p>
                    <p className="text-sm text-gray-600">{formatDateTime(currentApplication.createdAt)}</p>
                  </div>
                </div>
                
                {currentApplication.statusHistory?.map((event, index) => (
                  <div key={index} className="flex items-start">
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${getStatusColor(event.status).replace('text-', 'text-white bg-')}`}>
                      {event.status === 'hired' ? <CheckCircleIcon className="h-4 w-4" /> : <ClockIcon className="h-4 w-4" />}
                    </div>
                    <div className="ml-4">
                      <p className="font-medium text-gray-900 capitalize">Status changed to {event.status}</p>
                      <p className="text-sm text-gray-600">{formatDateTime(event.date)}</p>
                      {event.notes && (
                        <p className="text-sm text-gray-700 mt-1 italic">"{event.notes}"</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Job Information */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                <BriefcaseIcon className="h-5 w-5 mr-2 text-gray-600" />
                Job Information
              </h3>
              
              <div className="space-y-3 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Position:</span>
                  <p className="text-gray-900">{(typeof currentApplication.job === 'object' && currentApplication.job ? currentApplication.job.title : 'Not Available')}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Company:</span>
                  <p className="text-gray-900">{(typeof currentApplication.job === 'object' && currentApplication.job ? currentApplication.job.company : 'Not Available')}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Department:</span>
                  <p className="text-gray-900">{(typeof currentApplication.job === 'object' && currentApplication.job ? currentApplication.job.department : 'Not Available')}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Location:</span>
                  <p className="text-gray-900">
                    {(typeof currentApplication.job === 'object' && currentApplication.job && currentApplication.job.location ? `${currentApplication.job.location.city}, ${currentApplication.job.location.state}` : 'Not Available')}
                  </p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Job Type:</span>
                  <p className="text-gray-900 capitalize">{(typeof currentApplication.job === 'object' && currentApplication.job ? (currentApplication.job.jobType ?? '').replace(/-/g, ' ') : 'Not Available')}</p>
                </div>
              </div>
              
              {(typeof currentApplication.job === 'object' && currentApplication.job && currentApplication.job._id) && (
                <Link
                  to={`/jobs/${currentApplication.job._id}`}
                  className="mt-4 inline-flex items-center text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  View Job Posting →
                </Link>
              )}
            </div>

            {/* Application Metadata */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Application Details</h3>
              
              <div className="space-y-3 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Applied:</span>
                  <p className="text-gray-900">{formatDateTime(currentApplication.createdAt)}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Last Updated:</span>
                  <p className="text-gray-900">{formatDateTime(currentApplication.updatedAt)}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Application ID:</span>
                  <p className="text-gray-900 font-mono text-xs">{currentApplication._id}</p>
                </div>
              </div>
            </div>

            {/* Recruiter Notes */}
            {isRecruiterOrAdmin && currentApplication.recruiterNotes && currentApplication.recruiterNotes.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                  <ChatBubbleLeftRightIcon className="h-5 w-5 mr-2 text-gray-600" />
                  Recruiter Notes
                </h3>
                
                <div className="space-y-4">
                  {currentApplication.recruiterNotes.map((note, index) => (
                    <div key={index} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900">{note.addedBy?.firstName} {note.addedBy?.lastName}</span>
                        <span className="text-xs text-gray-500">{formatDateTime(note.addedAt)}</span>
                      </div>
                      <p className="text-gray-700 text-sm">{note.note}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Status Update Modal/Form */}
        {showStatusUpdate && isRecruiterOrAdmin && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Update Application Status</h3>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">New Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as ApplicationStatus)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select status...</option>
                  <option value="pending">Pending</option>
                  <option value="reviewing">Reviewing</option>
                  <option value="interviewing">Interviewing</option>
                  <option value="hired">Hired</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Note (Optional)</label>
                <textarea
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Add a note about this status change..."
                />
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={handleStatusUpdate}
                  disabled={!newStatus}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  Update Status
                </button>
                <button
                  onClick={() => setShowStatusUpdate(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Note Modal */}
        {showNoteForm && isRecruiterOrAdmin && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Recruiter Note</h3>
              
              <div className="mb-6">
                <textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Add your note about this candidate..."
                />
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={handleAddNote}
                  disabled={!newNote.trim()}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  Add Note
                </button>
                <button
                  onClick={() => setShowNoteForm(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
