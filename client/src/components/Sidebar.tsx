import { useQuery } from "@tanstack/react-query";
import { FileText, Cloud, Clock, Lightbulb, TrendingUp, Shield } from "lucide-react";
import { formatFileSize } from "@/lib/utils";

export default function Sidebar() {
  const { data: stats } = useQuery({
    queryKey: ['/api/stats'],
    queryFn: async () => {
      const response = await fetch('/api/stats', { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch stats');
      return response.json();
    },
  });

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="bg-surface rounded-lg shadow-material p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Stats</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <FileText className="h-4 w-4 text-blue-600" />
              </div>
              <span className="text-sm text-gray-600">Total Documents</span>
            </div>
            <span className="font-semibold text-gray-900">
              {stats?.totalDocuments || 0}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <Cloud className="h-4 w-4 text-green-600" />
              </div>
              <span className="text-sm text-gray-600">Storage Used</span>
            </div>
            <span className="font-semibold text-gray-900">
              {stats ? formatFileSize(stats.totalSize) : '0 B'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                <Clock className="h-4 w-4 text-orange-600" />
              </div>
              <span className="text-sm text-gray-600">Processing</span>
            </div>
            <span className="font-semibold text-gray-900">
              {stats?.processingCount || 0}
            </span>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-surface rounded-lg shadow-material p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
        <div className="space-y-4">
          {stats?.totalDocuments > 0 ? (
            <>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                <div className="flex-1">
                  <p className="text-sm text-gray-900">Document uploaded</p>
                  <p className="text-xs text-gray-500">New document added to library</p>
                  <p className="text-xs text-gray-400">Recently</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <div className="flex-1">
                  <p className="text-sm text-gray-900">Content analyzed</p>
                  <p className="text-xs text-gray-500">Text extraction completed</p>
                  <p className="text-xs text-gray-400">Recently</p>
                </div>
              </div>
            </>
          ) : (
            <p className="text-sm text-gray-500">No recent activity</p>
          )}
        </div>
      </div>

      {/* Key Insights */}
      <div className="bg-surface rounded-lg shadow-material p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Key Insights</h3>
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="flex items-start space-x-3">
              <Lightbulb className="h-4 w-4 text-blue-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-900">Document Analysis</p>
                <p className="text-xs text-blue-700 mt-1">
                  AI-powered content extraction and categorization
                </p>
              </div>
            </div>
          </div>
          <div className="p-4 bg-green-50 rounded-lg">
            <div className="flex items-start space-x-3">
              <TrendingUp className="h-4 w-4 text-green-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-green-900">Smart Search</p>
                <p className="text-xs text-green-700 mt-1">
                  Find documents by content, not just filenames
                </p>
              </div>
            </div>
          </div>
          <div className="p-4 bg-orange-50 rounded-lg">
            <div className="flex items-start space-x-3">
              <Shield className="h-4 w-4 text-orange-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-orange-900">Secure Storage</p>
                <p className="text-xs text-orange-700 mt-1">
                  Your documents are processed and stored securely
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
