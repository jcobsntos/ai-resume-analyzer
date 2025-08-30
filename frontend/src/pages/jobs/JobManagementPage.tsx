import React, { useEffect, useState } from 'react';
import { useJobStore } from '@/store/jobStore';
import { useAuthStore } from '@/store/authStore';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Job, JobFormData } from '@/types';

export const JobManagementPage: React.FC = () => {
  const { user } = useAuthStore();
  const { jobs, fetchJobs, isLoading, createJob, updateJob, deleteJob } = useJobStore();

  const [showCreate, setShowCreate] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [form, setForm] = useState<JobFormData>({
    title: '',
    description: '',
    company: '',
    location: { city: '', state: '', country: 'Philippines', remote: false, hybrid: false },
    department: 'Engineering',
    jobType: 'full-time',
    experienceLevel: 'entry',
    salary: { min: 0, max: 0, currency: 'PHP', period: 'monthly' },
    requiredSkills: [],
    preferredSkills: [],
    responsibilities: [],
    qualifications: [],
    benefits: [],
    featured: false,
    urgent: false,
  });
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchJobs(1, { isActive: true });
  }, [fetchJobs]);

  useEffect(() => {
    if (user?.company) {
      setForm(prev => ({ ...prev, company: prev.company || user.company! }));
    }
  }, [user]);

  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type, checked } = e.target as any;
    if (name.startsWith('location.')) {
      const key = name.split('.')[1] as keyof typeof form.location;
      setForm(prev => ({ ...prev, location: { ...prev.location, [key]: type === 'checkbox' ? checked : value } }));
    } else if (name === 'requiredSkills' || name === 'preferredSkills') {
      setForm(prev => ({ ...prev, [name]: value.split(',').map(s => s.trim()).filter(Boolean) as any }));
    } else if (name === 'responsibilities' || name === 'qualifications' || name === 'benefits') {
      setForm(prev => ({ ...prev, [name]: value.split('\n').map(s => s.trim()).filter(Boolean) as any }));
    } else if (name.startsWith('salary.')) {
      const key = name.split('.')[1] as keyof typeof form.salary;
      setForm(prev => ({ ...prev, salary: { ...prev.salary, [key]: value ? (key === 'min' || key === 'max' ? Number(value) : value) : undefined } }));
    } else if (type === 'checkbox') {
      setForm(prev => ({ ...prev, [name]: checked } as any));
    } else {
      setForm(prev => ({ ...prev, [name]: value } as any));
    }
  };

  const submitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clean up arrays by removing empty entries before validation
    const cleanedForm = {
      ...form,
      requiredSkills: form.requiredSkills.map(s => s.trim()).filter(s => s.length > 0),
      preferredSkills: form.preferredSkills.map(s => s.trim()).filter(s => s.length > 0),
      responsibilities: form.responsibilities.map(s => s.trim()).filter(s => s.length > 0),
      qualifications: form.qualifications.map(s => s.trim()).filter(s => s.length > 0),
      benefits: form.benefits.map(s => s.trim()).filter(s => s.length > 0)
    };
    
    // Inline validation with field messages
    const errors: Record<string, string> = {};
    if (!cleanedForm.company) {
      errors.company = 'Company is required';
    }
    if (!cleanedForm.description || cleanedForm.description.trim().length < 50) {
      errors.description = 'Description must be at least 50 characters';
    }
    if (!cleanedForm.location?.city) {
      errors.locationCity = 'City is required';
    }
    if (!cleanedForm.location?.state) {
      errors.locationState = 'State is required';
    }
    if (!cleanedForm.requiredSkills || cleanedForm.requiredSkills.length === 0) {
      errors.requiredSkills = 'Please add at least one required skill (one per line)';
    }
    if (!cleanedForm.responsibilities || cleanedForm.responsibilities.length === 0) {
      errors.responsibilities = 'Please add at least one responsibility';
    }
    if (!cleanedForm.qualifications || cleanedForm.qualifications.length === 0) {
      errors.qualifications = 'Please add at least one qualification';
    }
    setValidationErrors(errors);
    if (Object.keys(errors).length > 0) return;

    const success = editingJob 
      ? await updateJob(editingJob._id, cleanedForm as any)
      : await createJob(cleanedForm as any);
      
    if (success) {
      setShowCreate(false);
      setEditingJob(null);
      resetForm();
      setValidationErrors({});
    }
  };

  const resetForm = () => {
    setForm({
      title: '',
      description: '',
      company: user?.company || '',
      location: { city: '', state: '', country: 'Philippines', remote: false, hybrid: false },
      department: 'Engineering',
      jobType: 'full-time',
      experienceLevel: 'entry',
      salary: { min: 0, max: 0, currency: 'PHP', period: 'monthly' },
      requiredSkills: [],
      preferredSkills: [],
      responsibilities: [],
      qualifications: [],
      benefits: [],
      featured: false,
      urgent: false,
    });
  };

  const startEdit = (job: Job) => {
    setEditingJob(job);
    setForm({
      title: job.title,
      description: job.description,
      company: job.company,
      location: job.location,
      department: job.department,
      jobType: job.jobType,
      experienceLevel: job.experienceLevel,
      salary: job.salary || { min: 0, max: 0, currency: 'PHP', period: 'monthly' },
      requiredSkills: job.requiredSkills || [],
      preferredSkills: job.preferredSkills || [],
      responsibilities: job.responsibilities || [],
      qualifications: job.qualifications || [],
      benefits: job.benefits || [],
      featured: job.featured || false,
      urgent: job.urgent || false,
    });
    setShowCreate(true);
  };

  const quickStatus = async (job: Job, status: Job['status']) => {
    await updateJob(job._id, { status });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Job Management</h1>
            <p className="text-gray-600">Create, update, and manage job postings</p>
          </div>
          <button onClick={() => setShowCreate(!showCreate)} className="px-4 py-2 bg-blue-600 text-white rounded-md">
            {showCreate ? 'Close' : 'New Job'}
          </button>
        </div>

        {showCreate && (
          <div className="bg-white rounded-lg border p-6 mb-6">
            <form onSubmit={submitForm} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <input name="title" value={form.title} onChange={onChange} placeholder="Title" className="px-3 py-2 border rounded w-full" required />
              </div>
              <div>
                <input name="company" value={form.company} onChange={onChange} placeholder="Company" className="px-3 py-2 border rounded w-full" required />
                {validationErrors.company && <p className="mt-1 text-sm text-red-600">{validationErrors.company}</p>}
              </div>
              <div className="md:col-span-2">
                <textarea name="description" value={form.description} onChange={onChange} placeholder="Description" className="px-3 py-2 border rounded w-full h-28" required />
                {validationErrors.description && <p className="mt-1 text-sm text-red-600">{validationErrors.description}</p>}
              </div>
              <div>
                <input name="location.city" value={form.location.city} onChange={onChange} placeholder="City" className="px-3 py-2 border rounded w-full" required />
                {validationErrors.locationCity && <p className="mt-1 text-sm text-red-600">{validationErrors.locationCity}</p>}
              </div>
              <div>
                <input name="location.state" value={form.location.state} onChange={onChange} placeholder="State" className="px-3 py-2 border rounded w-full" required />
                {validationErrors.locationState && <p className="mt-1 text-sm text-red-600">{validationErrors.locationState}</p>}
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Department</label>
                <select name="department" value={form.department} onChange={onChange} className="px-3 py-2 border rounded w-full">
                  {['Engineering','Product','Design','Marketing','Sales','Human Resources','Finance','Operations','Customer Success','Data Science','Other'].map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Job Type</label>
                <select name="jobType" value={form.jobType} onChange={onChange} className="px-3 py-2 border rounded w-full">
                  {['full-time','part-time','contract','internship','freelance'].map(t => (
                    <option key={t} value={t}>{t.replace('-',' ')}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Experience Level</label>
                <select name="experienceLevel" value={form.experienceLevel} onChange={onChange} className="px-3 py-2 border rounded w-full">
                  {['entry','mid','senior','lead','executive'].map(l => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Minimum Salary (PHP)</label>
                <input type="number" name="salary.min" value={form.salary.min || ''} onChange={onChange} placeholder="30000" className="px-3 py-2 border rounded w-full" />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Maximum Salary (PHP)</label>
                <input type="number" name="salary.max" value={form.salary.max || ''} onChange={onChange} placeholder="80000" className="px-3 py-2 border rounded w-full" />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Currency</label>
                <select name="salary.currency" value={form.salary.currency} onChange={onChange} className="px-3 py-2 border rounded w-full">
                  <option value="PHP">PHP</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Salary Period</label>
                <select name="salary.period" value={form.salary.period} onChange={onChange} className="px-3 py-2 border rounded w-full">
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                  <option value="hourly">Hourly</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm text-gray-700 mb-1">Required Skills (one per line)</label>
                <textarea name="requiredSkills" value={form.requiredSkills.join('\n')} onChange={(e) => setForm(prev => ({ ...prev, requiredSkills: e.target.value.split('\n').map(s => s.trim()).filter(Boolean) }))} className="px-3 py-2 border rounded w-full h-24" />
                {validationErrors.requiredSkills && <p className="mt-1 text-sm text-red-600">{validationErrors.requiredSkills}</p>}
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm text-gray-700 mb-1">Responsibilities (one per line)</label>
                <textarea name="responsibilities" value={form.responsibilities.join('\n')} onChange={onChange} className="px-3 py-2 border rounded w-full h-24" />
                {validationErrors.responsibilities && <p className="mt-1 text-sm text-red-600">{validationErrors.responsibilities}</p>}
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm text-gray-700 mb-1">Qualifications (one per line)</label>
                <textarea name="qualifications" value={form.qualifications.join('\n')} onChange={onChange} className="px-3 py-2 border rounded w-full h-24" />
                {validationErrors.qualifications && <p className="mt-1 text-sm text-red-600">{validationErrors.qualifications}</p>}
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm text-gray-700 mb-1">Benefits (optional, one per line)</label>
                <textarea name="benefits" value={form.benefits.join('\n')} onChange={onChange} className="px-3 py-2 border rounded w-full h-24" placeholder="Health insurance\nFlexible work hours\n401k matching" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm text-gray-700 mb-1">Preferred Skills (optional, one per line)</label>
                <textarea name="preferredSkills" value={form.preferredSkills.join('\n')} onChange={(e) => setForm(prev => ({ ...prev, preferredSkills: e.target.value.split('\n').map(s => s.trim()).filter(Boolean) }))} className="px-3 py-2 border rounded w-full h-24" placeholder="Experience with AWS\nKnowledge of CI/CD" />
              </div>
              <div className="md:col-span-2 flex items-center space-x-4">
                <label className="flex items-center">
                  <input type="checkbox" name="location.remote" checked={form.location.remote} onChange={onChange} className="mr-2" />
                  Remote Work Available
                </label>
                <label className="flex items-center">
                  <input type="checkbox" name="location.hybrid" checked={form.location.hybrid} onChange={onChange} className="mr-2" />
                  Hybrid Work Available
                </label>
                <label className="flex items-center">
                  <input type="checkbox" name="featured" checked={form.featured} onChange={onChange} className="mr-2" />
                  Featured Job
                </label>
                <label className="flex items-center">
                  <input type="checkbox" name="urgent" checked={form.urgent} onChange={onChange} className="mr-2" />
                  Urgent Hiring
                </label>
              </div>
              <div className="md:col-span-2 flex justify-end">
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md">{editingJob ? 'Update Job' : 'Create Job'}</button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-white rounded-lg border overflow-hidden">
          {isLoading ? (
            <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
          ) : jobs.length === 0 ? (
            <div className="p-6 text-gray-600">No jobs found.</div>
          ) : (
            <div className="divide-y">
              {jobs.map(job => (
                <div key={job._id} className="p-4 flex items-start justify-between">
                  <div>
                    <div className="font-semibold text-gray-900">{job.title}</div>
                    <div className="text-sm text-gray-600">{job.company} • {job.location?.city}, {job.location?.state}</div>
                    <div className="mt-2 text-xs text-gray-500">{job.department} • {job.jobType} • {job.experienceLevel}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <select value={job.status} onChange={(e) => quickStatus(job, e.target.value as Job['status'])} className="px-2 py-1 border rounded text-sm">
                      {['draft','active','paused','closed','filled'].map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                    <button onClick={() => startEdit(job)} className="px-3 py-1 rounded-md text-sm bg-blue-100 text-blue-800">Edit</button>
                    <button onClick={() => deleteJob(job._id)} className="px-3 py-1 rounded-md text-sm bg-red-100 text-red-800">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
