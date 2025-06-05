import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Eye, Download, Trash2, List, Grid } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { formatFileSize, formatTimeAgo, getFileIcon, getFileIconColor, getCategoryColor } from "@/lib/utils";
import type { Document } from "@shared/schema";

interface DocumentListProps {
  searchQuery: string;
  fileType: string;
  category: string;
  onPreviewDocument: (document: Document) => void;
}

export default function DocumentList({ 
  searchQuery, 
  fileType, 
  category, 
  onPreviewDocument 
}: DocumentListProps) {
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: documents = [], isLoading } = useQuery<Document[]>({
    queryKey: ['/api/documents', { search: searchQuery, fileType, category }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (fileType && fileType !== 'All Types') params.append('fileType', fileType);
      if (category && category !== 'All Categories') params.append('category', category);
      
      const response = await fetch(`/api/documents?${params.toString()}`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch documents');
      }
      
      return response.json();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest('DELETE', `/api/documents/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
      toast({
        title: "Document deleted",
        description: "Document has been successfully deleted.",
      });
    },
    onError: (error) => {
      toast({
        title: "Delete failed",
        description: error.message || "Failed to delete document",
        variant: "destructive",
      });
    },
  });

  const handleDownload = async (document: Document) => {
    try {
      const response = await fetch(`/api/documents/${document.id}/download`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Download failed');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = document.originalFilename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      toast({
        title: "Download failed",
        description: "Failed to download document",
        variant: "destructive",
      });
    }
  };

  const handleDelete = (document: Document) => {
    if (window.confirm(`Are you sure you want to delete "${document.title}"?`)) {
      deleteMutation.mutate(document.id);
    }
  };

  if (isLoading) {
    return (
      <section className="bg-surface rounded-lg shadow-material p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-surface rounded-lg shadow-material">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-medium text-gray-900">Documents</h2>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">
              {documents.length} document{documents.length !== 1 ? 's' : ''}
            </span>
            <div className="flex rounded-md shadow-sm border border-gray-300">
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                className="rounded-r-none border-0"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                className="rounded-l-none border-0"
                onClick={() => setViewMode('grid')}
              >
                <Grid className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {documents.length === 0 ? (
        <div className="p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="material-icons text-gray-400 text-2xl">description</span>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No documents found</h3>
          <p className="text-gray-500">
            {searchQuery || fileType !== 'All Types' || category !== 'All Categories'
              ? 'Try adjusting your search criteria'
              : 'Upload your first document to get started'
            }
          </p>
        </div>
      ) : (
        <div className="divide-y divide-gray-200">
          {documents.map((document) => (
            <div key={document.id} className="p-6 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4 flex-1">
                  <div className="flex-shrink-0">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${getFileIconColor(document.fileType)}`}>
                      <span className="material-icons">
                        {getFileIcon(document.fileType)}
                      </span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-medium text-gray-900 mb-1">
                      {document.title}
                    </h3>
                    {document.description && (
                      <p className="text-sm text-gray-600 mb-2">
                        {document.description}
                      </p>
                    )}
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>{formatFileSize(document.fileSize)}</span>
                      {document.pageCount && (
                        <span>{document.pageCount} pages</span>
                      )}
                      <span>{formatTimeAgo(new Date(document.uploadDate))}</span>
                      {document.category && (
                        <Badge variant="secondary" className={getCategoryColor(document.category)}>
                          {document.category}
                        </Badge>
                      )}
                      {document.status === 'processing' && (
                        <Badge variant="outline" className="text-orange-600 border-orange-200">
                          Processing...
                        </Badge>
                      )}
                      {document.status === 'error' && (
                        <Badge variant="destructive">
                          Error
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2 ml-4">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onPreviewDocument(document)}
                    disabled={document.status !== 'completed'}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDownload(document)}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(document)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
