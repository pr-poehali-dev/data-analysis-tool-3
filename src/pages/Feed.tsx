import { useState } from "react";
import { RequestsFeed } from "@/components/dashboard/RequestsFeed";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { RegistrationForm } from "@/components/auth/RegistrationForm";
import { PortfolioNavbar, Footer } from "@/components/landing";

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
    <div className="min-h-screen bg-background">
      <PortfolioNavbar onRegisterClick={handleRegistrationClick} />

      <main className="max-w-7xl mx-auto px-6 py-8 mt-20">
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

      <Footer />

      <Dialog open={isRegistrationOpen} onOpenChange={setIsRegistrationOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <RegistrationForm onSuccess={handleRegistrationComplete} />
        </DialogContent>
      </Dialog>
    </div>
  );
};