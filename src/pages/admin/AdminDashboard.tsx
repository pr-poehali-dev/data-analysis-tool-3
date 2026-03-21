import Icon from "@/components/ui/icon";

export default function AdminDashboard() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">Дашборд</h1>
        <p className="text-muted-foreground mt-1">Добро пожаловать в панель администратора</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Пользователи", icon: "Users", color: "text-blue-600 bg-blue-50" },
          { label: "Заявки", icon: "FileText", color: "text-green-600 bg-green-50" },
          { label: "Рекомендации", icon: "ThumbsUp", color: "text-purple-600 bg-purple-50" },
          { label: "Сделки", icon: "Banknote", color: "text-orange-600 bg-orange-50" },
        ].map((item) => (
          <div key={item.label} className="bg-background border rounded-xl p-5 flex items-center gap-4">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${item.color}`}>
              <Icon name={item.icon} size={20} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{item.label}</p>
              <p className="text-xl font-semibold text-foreground">—</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 bg-background border rounded-xl p-6 flex flex-col items-center justify-center text-center py-16">
        <Icon name="Construction" size={40} className="text-muted-foreground mb-3" />
        <p className="text-muted-foreground">Полная статистика будет добавлена в следующем этапе</p>
      </div>
    </div>
  );
}
