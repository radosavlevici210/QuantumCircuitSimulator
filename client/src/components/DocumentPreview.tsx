import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { Document } from "@shared/schema";

interface DocumentPreviewProps {
  document: Document | null;
  open: boolean;
  onClose: () => void;
}

export default function DocumentPreview({ document, open, onClose }: DocumentPreviewProps) {
  if (!document) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Document Preview</span>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>
        
        <div className="overflow-y-auto max-h-[calc(90vh-120px)] p-4 border rounded bg-gray-50">
          {document.status === 'completed' && document.content ? (
            <div className="prose max-w-none bg-white p-6 rounded shadow-sm">
              <div className="mb-4 pb-4 border-b">
                <h1 className="text-xl font-semibold text-gray-900 mb-2">
                  {document.title}
                </h1>
                <div className="text-sm text-gray-500 space-x-4">
                  <span>File: {document.originalFilename}</span>
                  <span>Type: {document.fileType.toUpperCase()}</span>
                  {document.pageCount && <span>Pages: {document.pageCount}</span>}
                </div>
              </div>
              <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                {document.content}
              </div>
            </div>
          ) : document.status === 'processing' ? (
            <div className="flex flex-col items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
              <p className="text-gray-600">Processing document...</p>
              <p className="text-sm text-gray-500 mt-2">Please wait while we extract the content</p>
            </div>
          ) : document.status === 'error' ? (
            <div className="flex flex-col items-center justify-center h-64">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <X className="h-6 w-6 text-red-600" />
              </div>
              <p className="text-red-600 font-medium">Error processing document</p>
              <p className="text-sm text-gray-500 mt-2">Unable to extract content from this file</p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64">
              <p className="text-gray-600">No content available</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
