import { useState } from "react";
import Icon from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { RentalAgreementConstructor } from "./documents/RentalAgreementConstructor";
import { DocumentsList } from "./documents/DocumentsList";
import { SavedDocument } from "@/store/documentsStore";

interface User {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  city?: string;
}

interface DashboardOtherSectionsProps {
  activeSection: string;
  user: User;
}

export const DashboardOtherSections = ({ activeSection, user }: DashboardOtherSectionsProps) => {
  const [editingDocument, setEditingDocument] = useState<SavedDocument | null>(null);
  const [showConstructor, setShowConstructor] = useState(false);

  const handleEditDocument = (doc: SavedDocument) => {
    setEditingDocument(doc);
    setShowConstructor(true);
  };

  const handleCreateNew = () => {
    setEditingDocument(null);
    setShowConstructor(true);
  };

  const handleDocumentSaved = () => {
    setShowConstructor(false);
    setEditingDocument(null);
  };

  const handleBackToList = () => {
    setShowConstructor(false);
    setEditingDocument(null);
  };

  switch (activeSection) {
    case "messages":
      return (
        <div>
          <h2 className="text-3xl font-bold text-foreground mb-6">Сообщения</h2>
          <div className="bg-white border border-border rounded-xl p-8 text-center">
            <Icon name="MessageSquare" size={48} className="mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg text-muted-foreground">У вас нет новых сообщений</p>
          </div>
        </div>
      );
    case "documents":
      return (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-bold text-foreground">Документы</h2>
            {showConstructor && (
              <Button variant="outline" onClick={handleBackToList}>
                <Icon name="ArrowLeft" size={16} className="mr-2" />
                К списку
              </Button>
            )}
          </div>
          {showConstructor ? (
            <RentalAgreementConstructor
              documentId={editingDocument?.id}
              initialFormData={editingDocument?.data}
              onDocumentSaved={handleDocumentSaved}
            />
          ) : (
            <DocumentsList
              onEdit={handleEditDocument}
              onCreateNew={handleCreateNew}
            />
          )}
        </div>
      );
    case "balance":
      return (
        <div>
          <h2 className="text-3xl font-bold text-foreground mb-6">Баланс</h2>
          <div className="grid md:grid-cols-3 gap-6 mb-6">
            <div className="bg-white border border-border rounded-xl p-6">
              <p className="text-sm text-muted-foreground mb-2">Доступно к выводу</p>
              <p className="text-3xl font-bold text-foreground">0 ₽</p>
            </div>
            <div className="bg-white border border-border rounded-xl p-6">
              <p className="text-sm text-muted-foreground mb-2">В обработке</p>
              <p className="text-3xl font-bold text-foreground">0 ₽</p>
            </div>
            <div className="bg-white border border-border rounded-xl p-6">
              <p className="text-sm text-muted-foreground mb-2">Заработано всего</p>
              <p className="text-3xl font-bold text-foreground">0 ₽</p>
            </div>
          </div>
          <div className="bg-white border border-border rounded-xl p-8 text-center">
            <Icon name="Wallet" size={48} className="mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg text-muted-foreground">История транзакций пуста</p>
          </div>
        </div>
      );
    case "settings":
      return (
        <div>
          <h2 className="text-3xl font-bold text-foreground mb-6">Настройки профиля</h2>
          <div className="bg-white border border-border rounded-xl p-8">
            <div className="grid gap-6">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Имя</label>
                <input
                  type="text"
                  defaultValue={user.firstName}
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Фамилия</label>
                <input
                  type="text"
                  defaultValue={user.lastName}
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Email</label>
                <input
                  type="email"
                  defaultValue={user.email}
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Телефон</label>
                <input
                  type="tel"
                  defaultValue={user.phone}
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              {user.city && (
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Город</label>
                  <input
                    type="text"
                    defaultValue={user.city}
                    className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              )}
              <div className="flex gap-4 pt-4">
                <Button>
                  <Icon name="Save" size={16} className="mr-2" />
                  Сохранить изменения
                </Button>
                <Button variant="outline">Отменить</Button>
              </div>
            </div>
          </div>
        </div>
      );
    default:
      return null;
  }
};