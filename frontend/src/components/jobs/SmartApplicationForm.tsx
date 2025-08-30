import React, { useState } from 'react';
import { useApplicationStore } from '@/store/applicationStore';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { aiService, ResumeAnalysisResult } from '@/services/aiService';
import {
  DocumentArrowUpIcon,
  SparklesIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  StarIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

interface SmartApplicationFormProps {
  jobId: string;
  jobTitle: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const SmartApplicationForm: React.FC<SmartApplicationFormProps> = ({
  jobId,
  jobTitle,
  onClose,
  onSuccess,
}) => {
  const { applyToJob, isLoading } = useApplicationStore();
  const [step, setStep] = useState<'upload' | 'analysis' | 'review'>('upload');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [analysisResult, setAnalysisResult] = useState<ResumeAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Please upload a PDF or Word document');
        return;
      }
      
      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return;
      }
      
      setResumeFile(file);
      setStep('analysis');
    }
  };

  const analyzeResume = async () => {
    if (!resumeFile) return;

    setIsAnalyzing(true);
    try {
      const analysis = await aiService.analyzeResumeForJob(resumeFile, jobId);
      setAnalysisResult(analysis);
      setStep('review');
      setShowAnalysis(true);
      toast.success('Resume analysis complete!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to analyze resume');
      setStep('upload');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSubmitApplication = async () => {
    if (!resumeFile) {
      toast.error('Please select a resume file');
      return;
    }

    const success = await applyToJob(jobId, resumeFile);
    if (success) {
      onSuccess();
    }
  };

  const skipAnalysis = () => {
    setStep('review');
    setShowAnalysis(false);
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Apply to {jobTitle}</h3>
            <p className="text-sm text-gray-600 mt-1">
              {step === 'upload' && 'Upload your resume to get started'}
              {step === 'analysis' && 'Analyzing your resume against job requirements'}
              {step === 'review' && 'Review your application before submitting'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Progress Steps */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <div className={`flex items-center space-x-2 ${step === 'upload' ? 'text-blue-600' : step === 'analysis' || step === 'review' ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'upload' ? 'bg-blue-100' : 'bg-green-100'}`}>
                <DocumentArrowUpIcon className="h-4 w-4" />
              </div>
              <span className="font-medium">Upload Resume</span>
            </div>
            
            <div className={`h-1 flex-1 ${step === 'analysis' || step === 'review' ? 'bg-green-200' : 'bg-gray-200'}`} />
            
            <div className={`flex items-center space-x-2 ${step === 'analysis' ? 'text-blue-600' : step === 'review' ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'analysis' ? 'bg-blue-100' : step === 'review' ? 'bg-green-100' : 'bg-gray-100'}`}>
                <SparklesIcon className="h-4 w-4" />
              </div>
              <span className="font-medium">AI Analysis</span>
            </div>
            
            <div className={`h-1 flex-1 ${step === 'review' ? 'bg-green-200' : 'bg-gray-200'}`} />
            
            <div className={`flex items-center space-x-2 ${step === 'review' ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'review' ? 'bg-blue-100' : 'bg-gray-100'}`}>
                <CheckCircleIcon className="h-4 w-4" />
              </div>
              <span className="font-medium">Review & Submit</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {step === 'upload' && (
            <div className="text-center">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-12">
                <DocumentArrowUpIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h4 className="text-lg font-medium text-gray-900 mb-2">Upload Your Resume</h4>
                <p className="text-gray-600 mb-6">
                  We'll analyze your resume against the job requirements to give you personalized insights
                </p>
                
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileChange}
                  className="hidden"
                  id="resume-upload"
                />
                <label
                  htmlFor="resume-upload"
                  className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors cursor-pointer"
                >
                  <DocumentArrowUpIcon className="h-5 w-5 mr-2" />
                  Choose Resume File
                </label>
                
                <p className="text-xs text-gray-500 mt-4">
                  Supported formats: PDF, DOC, DOCX (Max 10MB)
                </p>
              </div>

              {/* Skip option */}
              <div className="mt-6">
                <button
                  onClick={() => setStep('review')}
                  className="text-gray-600 hover:text-gray-800 text-sm underline"
                >
                  Skip resume upload and apply without analysis
                </button>
              </div>
            </div>
          )}

          {step === 'analysis' && (
            <div className="text-center">
              {!isAnalyzing ? (
                <div className="space-y-6">
                  <div className="flex items-center justify-center">
                    <div className="p-4 bg-blue-100 rounded-full">
                      <SparklesIcon className="h-12 w-12 text-blue-600" />
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-xl font-semibold text-gray-900 mb-2">Ready for AI Analysis</h4>
                    <p className="text-gray-600 mb-6">
                      We'll analyze your resume against the job requirements and provide insights to help improve your application.
                    </p>
                    
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                      <div className="flex items-center justify-center mb-2">
                        <DocumentArrowUpIcon className="h-5 w-5 text-blue-600 mr-2" />
                        <span className="font-medium text-blue-900">{resumeFile?.name}</span>
                      </div>
                      <p className="text-sm text-blue-700">Resume uploaded successfully</p>
                    </div>
                  </div>
                  
                  <div className="flex space-x-4 justify-center">
                    <button
                      onClick={analyzeResume}
                      className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                    >
                      Analyze My Resume
                    </button>
                    <button
                      onClick={skipAnalysis}
                      className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Skip Analysis
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <LoadingSpinner size="lg" />
                  <div>
                    <h4 className="text-xl font-semibold text-gray-900 mb-2">Analyzing Your Resume</h4>
                    <p className="text-gray-600">
                      Our AI is analyzing your resume against the job requirements. This may take a few moments...
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 'review' && (
            <div className="space-y-6">
              {/* Analysis Results */}
              {showAnalysis && analysisResult && (
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <SparklesIcon className="h-6 w-6 mr-2 text-purple-600" />
                    AI Analysis Results
                  </h4>
                  
                  {/* Overall Score */}
                  <div className={`mb-4 p-4 rounded-lg border ${getScoreBgColor(analysisResult.overallScore)}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <h5 className="font-semibold text-gray-900">Overall Match Score</h5>
                        <p className="text-sm text-gray-600">Based on job requirements analysis</p>
                      </div>
                      <div className={`text-2xl font-bold ${getScoreColor(analysisResult.overallScore)}`}>
                        {analysisResult.overallScore}%
                      </div>
                    </div>
                  </div>

                  {/* Quick Insights */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    {/* Strengths */}
                    {analysisResult.keyStrengths && analysisResult.keyStrengths.length > 0 && (
                      <div>
                        <h5 className="font-semibold text-green-700 mb-2 flex items-center">
                          <CheckCircleIcon className="h-4 w-4 mr-1" />
                          Key Strengths
                        </h5>
                        <ul className="text-sm space-y-1">
                          {analysisResult.keyStrengths.slice(0, 3).map((strength, index) => (
                            <li key={index} className="text-green-700">• {strength}</li>
                          ))}
                          {analysisResult.keyStrengths.length > 3 && (
                            <li className="text-green-600 italic">+{analysisResult.keyStrengths.length - 3} more...</li>
                          )}
                        </ul>
                      </div>
                    )}

                    {/* Areas for Improvement */}
                    {analysisResult.areasForImprovement && analysisResult.areasForImprovement.length > 0 && (
                      <div>
                        <h5 className="font-semibold text-yellow-700 mb-2 flex items-center">
                          <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                          Areas to Address
                        </h5>
                        <ul className="text-sm space-y-1">
                          {analysisResult.areasForImprovement.slice(0, 3).map((area, index) => (
                            <li key={index} className="text-yellow-700">• {area}</li>
                          ))}
                          {analysisResult.areasForImprovement.length > 3 && (
                            <li className="text-yellow-600 italic">+{analysisResult.areasForImprovement.length - 3} more...</li>
                          )}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Skill Match */}
                  {analysisResult.skillMatch && (
                    <div className="mb-4">
                      <h5 className="font-semibold text-gray-900 mb-2">Skill Matching</h5>
                      <div className="flex items-center mb-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${analysisResult.skillMatch.matchPercentage}%` }}
                          />
                        </div>
                        <span className="ml-3 text-sm font-medium text-gray-700">
                          {analysisResult.skillMatch.matchPercentage}% match
                        </span>
                      </div>
                      <div className="text-xs text-gray-600">
                        {analysisResult.skillMatch.matched.length} of {analysisResult.skillMatch.matched.length + analysisResult.skillMatch.missing.length} required skills matched
                      </div>
                    </div>
                  )}

                  {/* Recommendations */}
                  {analysisResult.recommendations && analysisResult.recommendations.length > 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h5 className="font-semibold text-blue-900 mb-2">AI Recommendations</h5>
                      <ul className="text-sm space-y-1">
                        {analysisResult.recommendations.slice(0, 2).map((recommendation, index) => (
                          <li key={index} className="text-blue-800">• {recommendation}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Application Summary */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Application Summary</h4>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">Position:</span>
                    <span className="font-medium text-gray-900">{jobTitle}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">Resume:</span>
                    <span className="font-medium text-gray-900">
                      {resumeFile ? resumeFile.name : 'No resume uploaded'}
                    </span>
                  </div>
                  
                  {showAnalysis && analysisResult && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-700">AI Match Score:</span>
                      <span className={`font-bold ${getScoreColor(analysisResult.overallScore)}`}>
                        {analysisResult.overallScore}%
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Submit Application */}
              <div className="text-center">
                <p className="text-gray-600 mb-6">
                  {showAnalysis 
                    ? 'Ready to submit your application with AI insights!' 
                    : 'Ready to submit your application!'
                  }
                </p>
                
                <div className="flex space-x-4 justify-center">
                  <button
                    onClick={handleSubmitApplication}
                    disabled={isLoading}
                    className="px-8 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center"
                  >
                    {isLoading ? (
                      <LoadingSpinner size="sm" className="text-white mr-2" />
                    ) : (
                      <CheckCircleIcon className="h-5 w-5 mr-2" />
                    )}
                    Submit Application
                  </button>
                  
                  <button
                    onClick={onClose}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              {step === 'upload' && 'Step 1 of 3: Upload your resume'}
              {step === 'analysis' && 'Step 2 of 3: AI analysis in progress'}
              {step === 'review' && 'Step 3 of 3: Review and submit'}
            </div>
            
            <div className="flex space-x-3">
              {step === 'analysis' && !isAnalyzing && (
                <button
                  onClick={() => setStep('upload')}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Back
                </button>
              )}
              
              {step === 'analysis' && !isAnalyzing && (
                <button
                  onClick={analyzeResume}
                  className="px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors flex items-center"
                >
                  <SparklesIcon className="h-4 w-4 mr-2" />
                  Start Analysis
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
