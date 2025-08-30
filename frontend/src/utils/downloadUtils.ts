import toast from 'react-hot-toast';
import api from '../services/api';
import { AxiosResponse } from 'axios';

interface Base64ResumeResponse {
  status: string;
  data: {
    filename: string;
    mimeType: string;
    size: number;
    base64Data: string;
  };
}

// Detect if IDM is intercepting downloads
const detectIDMInterference = (blob: Blob, response: AxiosResponse): boolean => {
  // Check if blob is empty or unusually small
  if (blob.size === 0) {
    console.warn('IDM interference detected: Empty blob received');
    return true;
  }

  // Check if content type suggests IDM interference
  if (blob.type === 'text/xml' || blob.type === 'application/xml') {
    console.warn('IDM interference detected: XML content type received');
    return true;
  }

  // Check if response headers suggest IDM interference
  const contentLength = response.headers['content-length'];
  if (contentLength && parseInt(contentLength) === 0) {
    console.warn('IDM interference detected: Zero content length');
    return true;
  }

  return false;
};

// Create download from blob data
const createBlobDownload = (blob: Blob, filename: string): boolean => {
  try {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    
    // Anti-IDM attributes
    link.setAttribute('data-no-download-manager', 'true');
    link.setAttribute('download-manager', 'false');
    
    document.body.appendChild(link);
    link.click();
    
    // Cleanup
    setTimeout(() => {
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    }, 100);
    
    return true;
  } catch (error) {
    console.error('Error creating blob download:', error);
    return false;
  }
};

// Create download from base64 data
const createBase64Download = (base64Data: string, filename: string, mimeType: string): boolean => {
  try {
    const dataUrl = `data:${mimeType};base64,${base64Data}`;
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    
    // Anti-IDM attributes
    link.setAttribute('data-no-download-manager', 'true');
    link.setAttribute('download-manager', 'false');
    
    document.body.appendChild(link);
    link.click();
    
    // Cleanup
    setTimeout(() => {
      document.body.removeChild(link);
    }, 100);
    
    return true;
  } catch (error) {
    console.error('Error creating base64 download:', error);
    return false;
  }
};

// Main download function with multiple fallbacks
export const downloadResume = async (candidateId: string | null = null): Promise<void> => {
  const loadingToastId = toast.loading(
    candidateId ? 'Downloading candidate resume...' : 'Downloading your resume...'
  );

  try {
    console.log('Starting resume download...');
    
    // Method 1: Try base64 download first (most reliable against IDM)
    try {
      const endpoint = candidateId 
        ? `/users/${candidateId}/resume/base64`
        : '/users/resume/base64';
      
      console.log('Attempting base64 download from:', endpoint);
      
      const response = await api.get<Base64ResumeResponse>(endpoint);
      
      if (response.data.status === 'success') {
        const { filename, mimeType, base64Data, size } = response.data.data;
        
        console.log('Base64 data received:', {
          filename,
          mimeType,
          size,
          base64Length: base64Data.length
        });
        
        const success = createBase64Download(base64Data, filename, mimeType);
        
        if (success) {
          toast.success('Resume downloaded successfully!', { id: loadingToastId });
          return;
        }
      }
    } catch (base64Error: any) {
      console.warn('Base64 download failed:', base64Error.message);
    }

    // Method 2: Fallback to blob download
    try {
      const endpoint = candidateId 
        ? `/users/${candidateId}/resume/download`
        : '/users/resume/download';
      
      console.log('Attempting blob download from:', endpoint);
      
      const response = await api.get(endpoint, {
        responseType: 'blob'
      });

      const blob = response.data;
      console.log('Blob download received:', {
        size: blob.size,
        type: blob.type
      });

      // Check for IDM interference
      if (detectIDMInterference(blob, response)) {
        throw new Error('IDM interference detected in blob download');
      }

      // Extract filename from Content-Disposition header
      const contentDisposition = response.headers['content-disposition'];
      let filename = 'resume.pdf';
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].replace(/['"]/g, '');
        }
      }

      const success = createBlobDownload(blob, filename);
      
      if (success) {
        toast.success('Resume downloaded successfully!', { id: loadingToastId });
        return;
      }
      
    } catch (blobError: any) {
      console.warn('Blob download failed:', blobError.message);
      
      // Show specific IDM warning if detected
      if (blobError.message.includes('IDM interference')) {
        toast.error(
          'IDM (Internet Download Manager) is interfering with downloads. Please disable IDM or add localhost to IDM exceptions.',
          { 
            id: loadingToastId,
            duration: 6000 
          }
        );
        return;
      }
    }

    // If all methods failed
    throw new Error('All download methods failed');

  } catch (error: any) {
    console.error('Download error:', error);
    
    let errorMessage = 'Failed to download resume. ';
    
    if (error.response?.status === 404) {
      errorMessage += 'Resume not found.';
    } else if (error.response?.status === 403) {
      errorMessage += 'You do not have permission to download this resume.';
    } else {
      errorMessage += 'Please try again or contact support if the issue persists.';
    }

    toast.error(errorMessage, { id: loadingToastId });
  }
};

// Utility function to download any user's resume (for admin/recruiter)
export const downloadCandidateResume = async (candidateId: string): Promise<void> => {
  return downloadResume(candidateId);
};
