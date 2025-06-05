import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface SearchFiltersProps {
  onSearchChange: (query: string) => void;
  onFileTypeChange: (fileType: string) => void;
  onCategoryChange: (category: string) => void;
}

export default function SearchFilters({ 
  onSearchChange, 
  onFileTypeChange, 
  onCategoryChange 
}: SearchFiltersProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    onSearchChange(value);
  };

  return (
    <section className="bg-surface rounded-lg shadow-material p-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Input
              type="text"
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          </div>
        </div>
        <div className="flex gap-2">
          <Select onValueChange={onFileTypeChange}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All Types">All Types</SelectItem>
              <SelectItem value=".pdf">PDF</SelectItem>
              <SelectItem value=".docx">DOCX</SelectItem>
              <SelectItem value=".txt">TXT</SelectItem>
            </SelectContent>
          </Select>
          
          <Select onValueChange={onCategoryChange}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All Categories">All Categories</SelectItem>
              <SelectItem value="Technical">Technical</SelectItem>
              <SelectItem value="Legal">Legal</SelectItem>
              <SelectItem value="Research">Research</SelectItem>
              <SelectItem value="General">General</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </section>
  );
}
