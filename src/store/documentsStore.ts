import { RentalAgreementData } from "@/components/dashboard/documents/rental-agreement/types";
import { authStore } from "@/store/authStore";
import funcUrls from "../../backend/func2url.json";

const API_URL = funcUrls["documents-api"];

function authHeaders(extra?: Record<string, string>): Record<string, string> {
  return { ...authStore.getAuthHeaders(), ...extra };
}

export interface SavedDocument {
  id: string;
  type: "rental-agreement";
  data: RentalAgreementData;
  createdAt: Date;
  updatedAt: Date;
  fileName: string;
}

function parseDocument(raw: Record<string, unknown>): SavedDocument {
  return {
    id: raw.id as string,
    type: (raw.type as "rental-agreement") || "rental-agreement",
    data: raw.data as RentalAgreementData,
    createdAt: new Date(raw.createdAt as string),
    updatedAt: new Date(raw.updatedAt as string),
    fileName: raw.fileName as string,
  };
}

class DocumentsStore {
  private cache: SavedDocument[] = [];
  private listeners: (() => void)[] = [];
  private fetched = false;

  constructor() {
    localStorage.removeItem("documents");
  }

  subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach((listener) => listener());
  }

  private getUserEmail(): string {
    const user = authStore.getUser();
    return user?.email || "";
  }

  async fetchDocuments(): Promise<SavedDocument[]> {
    const email = this.getUserEmail();
    if (!email) return this.cache;

    try {
      const res = await fetch(API_URL, { headers: authHeaders() });
      const data = await res.json();
      const docs: SavedDocument[] = (data.documents || []).map(parseDocument);
      this.cache = docs;
      this.fetched = true;
      this.notify();
      return docs;
    } catch (e) {
      console.error("Ошибка загрузки документов:", e);
      return this.cache;
    }
  }

  async saveDocument(
    data: RentalAgreementData,
    existingId?: string
  ): Promise<SavedDocument> {
    const email = this.getUserEmail();
    const now = new Date();
    const fileName = `Договор_аренды_${now.toLocaleDateString("ru-RU").replace(/\./g, "_")}.docx`;

    try {
      const res = await fetch(API_URL, {
        method: existingId ? "PUT" : "POST",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({
          id: existingId || undefined,
          userEmail: email,
          type: "rental-agreement",
          fileName,
          data,
        }),
      });
      const result = await res.json();
      const saved = parseDocument(result.document);

      if (existingId) {
        const idx = this.cache.findIndex((d) => d.id === existingId);
        if (idx !== -1) {
          this.cache[idx] = saved;
        } else {
          this.cache.unshift(saved);
        }
      } else {
        this.cache.unshift(saved);
      }

      this.notify();
      return saved;
    } catch (e) {
      console.error("Ошибка сохранения документа:", e);
      const fallback: SavedDocument = {
        id: existingId || crypto.randomUUID(),
        type: "rental-agreement",
        data,
        createdAt: now,
        updatedAt: now,
        fileName,
      };
      if (existingId) {
        const idx = this.cache.findIndex((d) => d.id === existingId);
        if (idx !== -1) {
          this.cache[idx] = { ...this.cache[idx], data, updatedAt: now };
        }
      } else {
        this.cache.unshift(fallback);
      }
      this.notify();
      return existingId
        ? this.cache.find((d) => d.id === existingId) || fallback
        : fallback;
    }
  }

  getDocuments(): SavedDocument[] {
    if (!this.fetched) {
      this.fetchDocuments();
    }
    return [...this.cache];
  }

  getDocument(id: string): SavedDocument | undefined {
    return this.cache.find((doc) => doc.id === id);
  }

  async deleteDocument(id: string) {
    try {
      await fetch(`${API_URL}?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
    } catch (e) {
      console.error("Ошибка удаления документа:", e);
    }
    this.cache = this.cache.filter((doc) => doc.id !== id);
    this.notify();
  }
}

export const documentsStore = new DocumentsStore();