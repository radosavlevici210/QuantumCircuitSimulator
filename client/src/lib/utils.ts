import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return 'Just now';
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  }
  
  return date.toLocaleDateString();
}

export function getFileIcon(fileType: string): string {
  switch (fileType.toLowerCase()) {
    case '.pdf':
      return 'picture_as_pdf';
    case '.docx':
    case '.doc':
      return 'description';
    case '.txt':
      return 'article';
    default:
      return 'description';
  }
}

export function getFileIconColor(fileType: string): string {
  switch (fileType.toLowerCase()) {
    case '.pdf':
      return 'text-red-600 bg-red-100';
    case '.docx':
    case '.doc':
      return 'text-blue-600 bg-blue-100';
    case '.txt':
      return 'text-green-600 bg-green-100';
    default:
      return 'text-gray-600 bg-gray-100';
  }
}

export function getCategoryColor(category: string): string {
  switch (category?.toLowerCase()) {
    case 'technical':
      return 'bg-blue-100 text-blue-800';
    case 'legal':
      return 'bg-orange-100 text-orange-800';
    case 'research':
      return 'bg-green-100 text-green-800';
    case 'general':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-purple-100 text-purple-800';
  }
}
