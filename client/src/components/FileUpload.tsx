import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { formatFileSize, getFileIcon, getFileIconColor } from "@/lib/utils";

interface UploadProgress {
  file: File;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
}

export default function FileUpload() {
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      
      // Simulate progress for demo
      const updateProgress = (progress: number) => {
        setUploadProgress(prev => 
          prev.map(p => p.file === file ? { ...p, progress } : p)
        );
      };

      updateProgress(25);
      await new Promise(resolve => setTimeout(resolve, 500));
      updateProgress(50);
      await new Promise(resolve => setTimeout(resolve, 500));
      updateProgress(75);
      
      const response = await apiRequest('POST', '/api/documents/upload', formData);
      return response.json();
    },
    onSuccess: (data, file) => {
      setUploadProgress(prev => 
        prev.map(p => p.file === file ? { ...p, progress: 100, status: 'completed' } : p)
      );
      
      toast({
        title: "Upload successful",
        description: `${file.name} has been uploaded and is being processed.`,
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
      
      // Remove completed upload after delay
      setTimeout(() => {
        setUploadProgress(prev => prev.filter(p => p.file !== file));
      }, 2000);
    },
    onError: (error, file) => {
      setUploadProgress(prev => 
        prev.map(p => p.file === file ? { ...p, status: 'error' } : p)
      );
      
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload file",
        variant: "destructive",
      });
    },
  });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    acceptedFiles.forEach(file => {
      // Check file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: `${file.name} exceeds the 10MB limit.`,
          variant: "destructive",
        });
        return;
      }

      // Add to progress tracking
      setUploadProgress(prev => [...prev, { file, progress: 0, status: 'uploading' }]);
      
      // Start upload
      uploadMutation.mutate(file);
    });
  }, [uploadMutation, toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/plain': ['.txt'],
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/msword': ['.doc'],
    },
    multiple: true,
  });

  const removeUpload = (file: File) => {
    setUploadProgress(prev => prev.filter(p => p.file !== file));
  };

  return (
    <section className="bg-surface rounded-lg shadow-material p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-medium text-gray-900">Upload Documents</h2>
        <div className="text-sm text-gray-500">Max file size: 10MB</div>
      </div>
      
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-all cursor-pointer ${
          isDragActive 
            ? 'border-primary bg-primary/5' 
            : 'border-gray-300 hover:border-primary hover:bg-primary/5'
        }`}
      >
        <input {...getInputProps()} />
        <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-lg text-gray-600 mb-2">
          {isDragActive ? 'Drop files here' : 'Drag and drop files here'}
        </p>
        <p className="text-sm text-gray-500 mb-4">or click to browse</p>
        <Button className="bg-primary hover:bg-primary/90">
          Choose Files
        </Button>
        <p className="text-xs text-gray-400 mt-3">
          Supported formats: TXT, PDF, DOCX
        </p>
      </div>

      {uploadProgress.length > 0 && (
        <div className="mt-6 space-y-3">
          {uploadProgress.map(({ file, progress, status }) => (
            <div key={file.name} className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 rounded flex items-center justify-center ${getFileIconColor(file.name.split('.').pop() || '')}`}>
                  <span className="material-icons text-sm">
                    {getFileIcon(file.name.split('.').pop() || '')}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-sm">{file.name}</p>
                  <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {status === 'uploading' && (
                  <>
                    <div className="w-32">
                      <Progress value={progress} className="h-2" />
                    </div>
                    <span className="text-sm text-gray-600">{progress}%</span>
                  </>
                )}
                {status === 'completed' && (
                  <span className="text-green-600 text-sm font-medium">✓ Complete</span>
                )}
                {status === 'error' && (
                  <span className="text-red-600 text-sm font-medium">✗ Failed</span>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => removeUpload(file)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
