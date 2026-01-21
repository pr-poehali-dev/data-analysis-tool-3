import { useState } from "react";
import { RequestsFeed } from "@/components/dashboard/RequestsFeed";
import { Button } from "@/components/ui/button";
import Icon from "@/components/ui/icon";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { RegistrationForm } from "@/components/auth/RegistrationForm";

export const Feed = () => {
  const navigate = useNavigate();
  const [isRegistrationOpen, setIsRegistrationOpen] = useState(false);

  const handleRegistrationClick = () => {
    setIsRegistrationOpen(true);
  };

  const handleRegistrationComplete = () => {
    setIsRegistrationOpen(false);
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-border sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <button onClick={() => navigate("/")} className="hover:opacity-80 transition-opacity">
            <img 
              src="https://cdn.poehali.dev/projects/98f29e7d-3c71-4ce1-9618-2738c542d164/bucket/34962643-9b8b-4fd1-bec2-5ba3e9cbbfcc.png" 
              alt="SovetPay" 
              className="h-12 w-auto"
            />
          </button>
          <Button onClick={() => navigate("/")}>
            <Icon name="Home" size={16} className="mr-2" />
            На главную
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h1 className="text-4xl font-bold text-foreground mb-2">Лента заявок</h1>
          <p className="text-lg text-muted-foreground">
            Просматривайте актуальные заявки арендаторов и предлагайте варианты жилья
          </p>
        </div>

        <RequestsFeed onRegisterClick={handleRegistrationClick} />

        <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-xl">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
              <Icon name="Info" className="text-white" size={20} />
            </div>
            <div>
              <h4 className="text-lg font-semibold text-foreground mb-2">
                Зарегистрируйтесь, чтобы предлагать варианты
              </h4>
              <p className="text-muted-foreground mb-4">
                Создайте аккаунт рекомендателя и начните зарабатывать на успешных рекомендациях жилья
              </p>
              <Button onClick={handleRegistrationClick}>
                <Icon name="UserPlus" size={16} className="mr-2" />
                Зарегистрироваться
              </Button>
            </div>
          </div>
        </div>
      </main>

      <Dialog open={isRegistrationOpen} onOpenChange={setIsRegistrationOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <RegistrationForm onSuccess={handleRegistrationComplete} />
        </DialogContent>
      </Dialog>
    </div>
  );
};