import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Icon from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { documentsStore, SavedDocument } from "@/store/documentsStore";
import { generateDOCXLazy } from "./rental-agreement/DOCXGeneratorLazy";

interface DocumentsListProps {
  onEdit: (doc: SavedDocument) => void;
  onCreateNew: () => void;
}

export const DocumentsList = ({ onEdit, onCreateNew }: DocumentsListProps) => {
  const [documents, setDocuments] = useState<SavedDocument[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    const loadDocuments = () => {
      setDocuments(documentsStore.getDocuments());
    };

    loadDocuments();
    const unsubscribe = documentsStore.subscribe(loadDocuments);
    return unsubscribe;
  }, []);

  const handleDelete = (id: string) => {
    if (window.confirm("Вы уверены, что хотите удалить этот документ?")) {
      setDeletingId(id);
      setTimeout(() => {
        documentsStore.deleteDocument(id);
        setDeletingId(null);
      }, 300);
    }
  };

  const handleDownload = async (doc: SavedDocument) => {
    try {
      setDownloadingId(doc.id);
      await generateDOCXLazy(doc.data, doc.id);
    } catch (error) {
      console.error('Ошибка при скачивании:', error);
      alert('Не удалось скачать документ. Попробуйте еще раз.');
    } finally {
      setDownloadingId(null);
    }
  };

  if (documents.length === 0) {
    return (
      <div className="bg-white border border-border rounded-xl p-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Icon name="FileText" size={32} className="text-primary" />
          </div>
          <h3 className="text-xl font-semibold text-foreground mb-2">У вас пока нет документов</h3>
          <p className="text-sm text-muted-foreground mb-6">
            Создайте свой первый договор аренды
          </p>
          <Button onClick={onCreateNew}>
            <Icon name="Plus" size={16} className="mr-2" />
            Создать договор
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-foreground">Сохраненные документы</h3>
        <Button onClick={onCreateNew}>
          <Icon name="Plus" size={16} className="mr-2" />
          Новый договор
        </Button>
      </div>

      <div className="grid gap-4">
        {documents.map((doc) => (
          <motion.div
            key={doc.id}
            initial={{ opacity: 1, x: 0 }}
            animate={{ opacity: deletingId === doc.id ? 0 : 1, x: deletingId === doc.id ? -20 : 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white border border-border rounded-xl p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Icon name="FileText" size={20} className="text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground">Договор аренды жилья</h4>
                    <p className="text-xs text-muted-foreground">
                      {doc.fileName}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Арендодатель:</span>
                    <p className="font-medium text-foreground">{doc.data.landlordFullName}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Арендатор:</span>
                    <p className="font-medium text-foreground">{doc.data.tenantFullName}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Адрес объекта:</span>
                    <p className="font-medium text-foreground">{doc.data.propertyAddress}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Период:</span>
                    <p className="font-medium text-foreground">
                      {doc.data.contractStartDate} - {doc.data.contractEndDate}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 mt-4 pt-4 border-t border-border text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Icon name="Calendar" size={14} />
                    <span>Создан: {doc.createdAt.toLocaleDateString("ru-RU")}</span>
                  </div>
                  {doc.createdAt.getTime() !== doc.updatedAt.getTime() && (
                    <div className="flex items-center gap-1">
                      <Icon name="Clock" size={14} />
                      <span>Обновлен: {doc.updatedAt.toLocaleDateString("ru-RU")}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownload(doc)}
                  disabled={downloadingId === doc.id}
                  className="whitespace-nowrap flex items-center justify-start"
                >
                  <Icon name={downloadingId === doc.id ? "Loader2" : "Download"} size={16} className={`mr-2 ${downloadingId === doc.id ? 'animate-spin' : ''}`} />
                  {downloadingId === doc.id ? 'Загрузка...' : 'Скачать'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(doc)}
                  className="whitespace-nowrap flex items-center justify-start"
                >
                  <Icon name="Edit" size={16} className="mr-2" />
                  Изменить
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(doc.id)}
                  className="whitespace-nowrap flex items-center justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Icon name="Trash2" size={16} className="mr-2" />
                  Удалить
                </Button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};