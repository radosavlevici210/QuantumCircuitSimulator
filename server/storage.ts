import { users, documents, type User, type InsertUser, type Document, type InsertDocument, type UpdateDocument } from "@shared/schema";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Document methods
  getDocument(id: number): Promise<Document | undefined>;
  getAllDocuments(): Promise<Document[]>;
  searchDocuments(query: string, fileType?: string, category?: string): Promise<Document[]>;
  createDocument(document: InsertDocument): Promise<Document>;
  updateDocument(id: number, updates: UpdateDocument): Promise<Document | undefined>;
  deleteDocument(id: number): Promise<boolean>;
  getDocumentStats(): Promise<{
    totalDocuments: number;
    totalSize: number;
    processingCount: number;
  }>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private documents: Map<number, Document>;
  currentUserId: number;
  currentDocumentId: number;

  constructor() {
    this.users = new Map();
    this.documents = new Map();
    this.currentUserId = 1;
    this.currentDocumentId = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getDocument(id: number): Promise<Document | undefined> {
    return this.documents.get(id);
  }

  async getAllDocuments(): Promise<Document[]> {
    return Array.from(this.documents.values()).sort((a, b) => 
      new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime()
    );
  }

  async searchDocuments(query: string, fileType?: string, category?: string): Promise<Document[]> {
    const allDocuments = Array.from(this.documents.values());
    const lowerQuery = query.toLowerCase();
    
    return allDocuments.filter(doc => {
      const matchesQuery = !query || 
        doc.title.toLowerCase().includes(lowerQuery) ||
        doc.description?.toLowerCase().includes(lowerQuery) ||
        doc.content?.toLowerCase().includes(lowerQuery) ||
        doc.keywords?.some(keyword => keyword.toLowerCase().includes(lowerQuery));
      
      const matchesFileType = !fileType || fileType === "All Types" || doc.fileType === fileType;
      const matchesCategory = !category || category === "All Categories" || doc.category === category;
      
      return matchesQuery && matchesFileType && matchesCategory;
    }).sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime());
  }

  async createDocument(insertDocument: InsertDocument): Promise<Document> {
    const id = this.currentDocumentId++;
    const document: Document = {
      ...insertDocument,
      id,
      uploadDate: new Date(),
    };
    this.documents.set(id, document);
    return document;
  }

  async updateDocument(id: number, updates: UpdateDocument): Promise<Document | undefined> {
    const document = this.documents.get(id);
    if (!document) return undefined;
    
    const updatedDocument = { ...document, ...updates };
    this.documents.set(id, updatedDocument);
    return updatedDocument;
  }

  async deleteDocument(id: number): Promise<boolean> {
    return this.documents.delete(id);
  }

  async getDocumentStats(): Promise<{
    totalDocuments: number;
    totalSize: number;
    processingCount: number;
  }> {
    const docs = Array.from(this.documents.values());
    return {
      totalDocuments: docs.length,
      totalSize: docs.reduce((total, doc) => total + doc.fileSize, 0),
      processingCount: docs.filter(doc => doc.status === "processing").length,
    };
  }
}

export const storage = new MemStorage();
