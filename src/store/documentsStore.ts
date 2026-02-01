import { RentalAgreementData } from "@/components/dashboard/documents/rental-agreement/types";

export interface SavedDocument {
  id: string;
  type: "rental-agreement";
  data: RentalAgreementData;
  createdAt: Date;
  updatedAt: Date;
  fileName: string;
}

class DocumentsStore {
  private documents: SavedDocument[] = [];
  private listeners: (() => void)[] = [];

  constructor() {
    const saved = localStorage.getItem("documents");
    if (saved) {
      this.documents = JSON.parse(saved, (key, value) => {
        if (key === "createdAt" || key === "updatedAt") {
          return new Date(value);
        }
        return value;
      });
    }
  }

  subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify() {
    localStorage.setItem("documents", JSON.stringify(this.documents));
    this.listeners.forEach((listener) => listener());
  }

  saveDocument(data: RentalAgreementData, existingId?: string): SavedDocument {
    const now = new Date();
    
    if (existingId) {
      const index = this.documents.findIndex((doc) => doc.id === existingId);
      if (index !== -1) {
        this.documents[index] = {
          ...this.documents[index],
          data,
          updatedAt: now,
        };
        this.notify();
        return this.documents[index];
      }
    }

    const newDocument: SavedDocument = {
      id: crypto.randomUUID(),
      type: "rental-agreement",
      data,
      createdAt: now,
      updatedAt: now,
      fileName: `Договор_аренды_${now.toLocaleDateString("ru-RU").replace(/\./g, "_")}.docx`,
    };

    this.documents.unshift(newDocument);
    this.notify();
    return newDocument;
  }

  getDocuments(): SavedDocument[] {
    return [...this.documents];
  }

  getDocument(id: string): SavedDocument | undefined {
    return this.documents.find((doc) => doc.id === id);
  }

  deleteDocument(id: string) {
    this.documents = this.documents.filter((doc) => doc.id !== id);
    this.notify();
  }
}

export const documentsStore = new DocumentsStore();