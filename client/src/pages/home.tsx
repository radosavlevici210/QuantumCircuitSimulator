import { useState } from "react";
import Header from "@/components/Header";
import FileUpload from "@/components/FileUpload";
import SearchFilters from "@/components/SearchFilters";
import DocumentList from "@/components/DocumentList";
import DocumentPreview from "@/components/DocumentPreview";
import Sidebar from "@/components/Sidebar";
import type { Document } from "@shared/schema";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [fileType, setFileType] = useState("All Types");
  const [category, setCategory] = useState("All Categories");
  const [previewDocument, setPreviewDocument] = useState<Document | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const handlePreviewDocument = (document: Document) => {
    setPreviewDocument(document);
    setIsPreviewOpen(true);
  };

  const handleClosePreview = () => {
    setIsPreviewOpen(false);
    setPreviewDocument(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-8">
            <FileUpload />
            
            <SearchFilters
              onSearchChange={setSearchQuery}
              onFileTypeChange={setFileType}
              onCategoryChange={setCategory}
            />
            
            <DocumentList
              searchQuery={searchQuery}
              fileType={fileType}
              category={category}
              onPreviewDocument={handlePreviewDocument}
            />
          </div>

          {/* Sidebar */}
          <Sidebar />
        </div>
      </div>

      {/* Document Preview Modal */}
      <DocumentPreview
        document={previewDocument}
        open={isPreviewOpen}
        onClose={handleClosePreview}
      />
    </div>
  );
}
