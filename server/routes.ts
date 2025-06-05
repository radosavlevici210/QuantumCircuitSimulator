import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertDocumentSchema, updateDocumentSchema } from "@shared/schema";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

// File upload configuration
const uploadDir = "uploads";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage_multer = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage: storage_multer,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.txt', '.pdf', '.docx', '.doc'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported file type. Only TXT, PDF, and DOCX files are allowed.'));
    }
  }
});

// Text extraction functions
async function extractTextFromFile(filePath: string, fileType: string): Promise<{ content: string; pageCount?: number }> {
  try {
    switch (fileType.toLowerCase()) {
      case '.txt':
        const txtContent = fs.readFileSync(filePath, 'utf-8');
        return { content: txtContent };
      
      case '.pdf':
        // For PDF extraction, we'll use a simple approach
        // In production, you'd use pdf-parse or similar
        try {
          const pdfParse = require('pdf-parse');
          const pdfBuffer = fs.readFileSync(filePath);
          const data = await pdfParse(pdfBuffer);
          return { content: data.text, pageCount: data.numpages };
        } catch (error) {
          console.error('PDF parsing error:', error);
          return { content: 'PDF content extraction failed' };
        }
      
      case '.docx':
      case '.doc':
        // For DOCX extraction
        try {
          const mammoth = require('mammoth');
          const buffer = fs.readFileSync(filePath);
          const result = await mammoth.extractRawText({ buffer });
          return { content: result.value };
        } catch (error) {
          console.error('DOCX parsing error:', error);
          return { content: 'DOCX content extraction failed' };
        }
      
      default:
        return { content: 'Unsupported file type' };
    }
  } catch (error) {
    console.error('Text extraction error:', error);
    return { content: 'Text extraction failed' };
  }
}

// Basic text analysis
function analyzeContent(content: string): { description: string; category: string; keywords: string[] } {
  const words = content.toLowerCase().split(/\W+/).filter(word => word.length > 3);
  const wordCount = words.length;
  
  // Generate description (first 200 chars)
  const description = content.substring(0, 200).trim() + (content.length > 200 ? '...' : '');
  
  // Simple keyword extraction (most frequent words)
  const wordFreq = words.reduce((freq: Record<string, number>, word) => {
    freq[word] = (freq[word] || 0) + 1;
    return freq;
  }, {});
  
  const keywords = Object.entries(wordFreq)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .map(([word]) => word);
  
  // Simple categorization based on keywords
  let category = "General";
  const techKeywords = ['software', 'technology', 'system', 'algorithm', 'code', 'programming', 'quantum', 'ai', 'artificial', 'intelligence'];
  const legalKeywords = ['legal', 'law', 'compliance', 'regulation', 'gdpr', 'copyright', 'patent', 'license'];
  const researchKeywords = ['research', 'study', 'analysis', 'methodology', 'experiment', 'data', 'results'];
  
  if (techKeywords.some(keyword => content.toLowerCase().includes(keyword))) {
    category = "Technical";
  } else if (legalKeywords.some(keyword => content.toLowerCase().includes(keyword))) {
    category = "Legal";
  } else if (researchKeywords.some(keyword => content.toLowerCase().includes(keyword))) {
    category = "Research";
  }
  
  return { description, category, keywords };
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Get all documents
  app.get("/api/documents", async (req, res) => {
    try {
      const { search, fileType, category } = req.query;
      let documents;
      
      if (search || fileType || category) {
        documents = await storage.searchDocuments(
          search as string || "",
          fileType as string,
          category as string
        );
      } else {
        documents = await storage.getAllDocuments();
      }
      
      res.json(documents);
    } catch (error) {
      console.error('Error fetching documents:', error);
      res.status(500).json({ message: "Failed to fetch documents" });
    }
  });

  // Get document by ID
  app.get("/api/documents/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const document = await storage.getDocument(id);
      
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }
      
      res.json(document);
    } catch (error) {
      console.error('Error fetching document:', error);
      res.status(500).json({ message: "Failed to fetch document" });
    }
  });

  // Upload document
  app.post("/api/documents/upload", upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const fileType = path.extname(req.file.originalname);
      const title = req.body.title || path.basename(req.file.originalname, fileType);

      // Create initial document record
      const documentData = {
        title,
        originalFilename: req.file.originalname,
        filename: req.file.filename,
        fileType,
        fileSize: req.file.size,
        content: null,
        description: null,
        category: null,
        keywords: [],
        pageCount: null,
        status: "processing" as const,
      };

      const document = await storage.createDocument(documentData);

      // Process file asynchronously
      setImmediate(async () => {
        try {
          const filePath = path.join(uploadDir, req.file!.filename);
          const { content, pageCount } = await extractTextFromFile(filePath, fileType);
          const { description, category, keywords } = analyzeContent(content);

          await storage.updateDocument(document.id, {
            content,
            description,
            category,
            keywords,
            pageCount,
            status: "completed",
          });
        } catch (error) {
          console.error('Error processing document:', error);
          await storage.updateDocument(document.id, {
            status: "error",
          });
        }
      });

      res.json(document);
    } catch (error) {
      console.error('Error uploading document:', error);
      res.status(500).json({ message: "Failed to upload document" });
    }
  });

  // Delete document
  app.delete("/api/documents/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const document = await storage.getDocument(id);
      
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }

      // Delete file from disk
      const filePath = path.join(uploadDir, document.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      const deleted = await storage.deleteDocument(id);
      if (deleted) {
        res.json({ message: "Document deleted successfully" });
      } else {
        res.status(500).json({ message: "Failed to delete document" });
      }
    } catch (error) {
      console.error('Error deleting document:', error);
      res.status(500).json({ message: "Failed to delete document" });
    }
  });

  // Download document
  app.get("/api/documents/:id/download", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const document = await storage.getDocument(id);
      
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }

      const filePath = path.join(uploadDir, document.filename);
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ message: "File not found on disk" });
      }

      res.download(filePath, document.originalFilename);
    } catch (error) {
      console.error('Error downloading document:', error);
      res.status(500).json({ message: "Failed to download document" });
    }
  });

  // Get document stats
  app.get("/api/stats", async (req, res) => {
    try {
      const stats = await storage.getDocumentStats();
      res.json(stats);
    } catch (error) {
      console.error('Error fetching stats:', error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
