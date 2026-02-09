import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import Icon from "@/components/ui/icon";
import { Button } from "@/components/ui/button";

export const HowItWorks = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const hash = location.hash;
    if (hash) {
      setTimeout(() => {
        const element = document.querySelector(hash);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }
  }, [location]);

  const sections = [
    {
      id: "find-housing",
      category: "АРЕНДАТОРАМ",
      title: "1. Найти жилье",
      icon: "Search",
      content: `Этот раздел для тех, кто ищет квартиру. Вы не просматриваете бесконечные объявления. Вместо этого вы создаете детальную заявку-анкету: рассказываете о себе, кто будет жить, указываете желаемый район, бюджет и сроки. Фиксируете сумму вознаграждения, которое готовы заплатить за удачную рекомендацию. Вашу заявку увидят не агентства, а люди, которые могут порекомендовать проверенный вариант от своих знакомых. Вы получаете приватные предложения на закрытом рынке и выбираете лучший, экономя время и минуя риски.`
    },
    {
      id: "how-it-works",
      category: "АРЕНДАТОРАМ",
      title: "2. Как это работает",
      icon: "Cog",
      content: `Наш сервис соединяет три стороны безопасной сделкой:

· Арендатор создает заявку → получает варианты → согласовывает и платит вознаграждение.
· Рекомендатель находит подходящую заявку → связывает арендатора с владельцем → получает гарантированное вознаграждение.
· Арендодатель подтверждает показ своей квартиры → знакомится с проверенным жильцом → сдает без комиссии.

Платформа обеспечивает общение, безопасный расчет вознаграждения через эскроу и предоставляет возможность составить договор.`
    },
    {
      id: "safety",
      category: "АРЕНДАТОРАМ",
      title: "3. Гарантии безопасности",
      icon: "Shield",
      content: `Наша главная гарантия — система защищенного расчета (эскроу). Арендатор блокирует сумму вознаграждения на счете платформы только после устной договоренности. Деньги переводятся рекомендателю только после того, как арендатор подтвердит успешное заселение. Если возник спор, служба поддержки сервиса изучит переписку внутреннего мессенджера и вынесет решение. Арендная плата передается напрямую, минуя сервис, что сохраняет привычный порядок расчетов. Все пользователи проходят верификацию, а данные защищены.`
    },
    {
      id: "feed",
      category: "РЕКОМЕНДАТЕЛЯМ",
      title: "4. Лента заявок",
      icon: "List",
      content: `Это «витрина» для рекомендателей и арендодателей. Здесь публикуются заявки от арендаторов — подробные анкеты с описанием потребностей, бюджета и фиксированной суммы вознаграждения. Вы можете фильтровать заявки по городу, району, бюджету и типу жилья. Найдя подходящий запрос, вы как рекомендатель можете предложить свой вариант или знакомого арендодателя. Лента обновляется в реальном времени, давая доступ к актуальному спросу.`
    },
    {
      id: "pricing",
      category: "РЕКОМЕНДАТЕЛЯМ",
      title: "5. Вознаграждения",
      icon: "DollarSign",
      content: `Вознаграждение — фиксированное и известно заранее, его выставляет в заявке сам арендатор. Обычно размер вознаграждения зависит от средней стоимости аренды в определенном городе (например, в Москве вознаграждение может быть 10 000 ₽, а в Рязани - 5 000 ₽). Никаких скрытых бонусов или торгов. Из этой суммы сервис удерживает комиссию 8% для обеспечения работы платежной системы, поддержки и безопасности платформы. Остальные 92% получает рекомендатель. Пример: при вознаграждении 10 000 ₽ рекомендатель получает 9 200 ₽.`
    },
    {
      id: "payouts",
      category: "РЕКОМЕНДАТЕЛЯМ",
      title: "6. Правила выплат",
      icon: "Wallet",
      content: `Выплата вознаграждения происходит строго после успешного завершения сделки по алгоритму:

1. Блокировка: Арендатор переводит полную сумму вознаграждения на защищенный эскроу-счет.
2. Ожидание: Деньги заморожены на период заселения (2-5 дней).
3. Подтверждение: Арендатор подтверждает в приложении, что заселился и все в порядке.
4. Расчет: Сервис автоматически удерживает 8% комиссии от суммы вознаграждения и переводит 92% на счет рекомендателя.

Если арендатор не подтверждает сделку, запускается проверка внутри сервиса. Деньги возвращаются арендатору в случае доказанной недобросовестности рекомендации.`
    },
    {
      id: "rent-out",
      category: "ВЛАДЕЛЬЦАМ",
      title: "7. Сдать жильё",
      icon: "Home",
      content: `Этот раздел для владельцев недвижимости. Вы можете сдать квартиру без комиссии, найдя жильца через доверенные связи. Когда ваш знакомый (рекомендатель) предлагает вашу квартиру подходящему арендатору, вы получаете уведомление. Вам нужно лишь подтвердить согласие на показ. После этого вы общаетесь с предварительно одобренным кандидатом, который уже прошел проверку рекомендателем. Вы заключаете сделку напрямую, получая арендную плату целиком, а рекомендатель получает вознаграждение от арендатора через платформу.`
    },
    {
      id: "verification",
      category: "ВЛАДЕЛЬЦАМ",
      title: "8. Верификация жильцов",
      icon: "BadgeCheck",
      content: `Мы стремимся к максимальному доверию в сделках. Поэтому все участники проходят базовую верификацию по номеру телефона. Арендаторам и рекомендателям мы рекомендуем заполнить подробный профиль: указать место работы, добавить ссылки на соцсети. После успешных сделок формируется репутация в виде отзывов и рейтинга. Это помогает арендодателям и рекомендателям оценить надежность пользователя. Данные защищены и не передаются третьим лицам.`
    },
    {
      id: "contracts",
      category: "ВЛАДЕЛЬЦАМ",
      title: "9. Договоры аренды",
      icon: "FileText",
      content: `Чтобы обезопасить сделку юридически, мы предоставляем встроенный конструктор типового договора аренды, актуального для любого региона. Договор вы сами заполняете в конструкторе. При необходимости можно добавить свои дополнения. Готовый документ можно скачать для подписания или отправить по электронной почте. Составленные договоры хранятся в вашем личном кабинете в возможны к скачиванию в любое время. Это бесплатно и гарантирует чистоту сделки.`
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img 
              src="https://cdn.poehali.dev/projects/98f29e7d-3c71-4ce1-9618-2738c542d164/bucket/bf9825ff-384f-4373-81c0-67ea99aefa6f.png" 
              alt="SovetPay" 
              className="h-12 w-auto cursor-pointer"
              onClick={() => navigate('/')}
            />
          </div>
          <Button onClick={() => navigate('/')} variant="outline">
            <Icon name="ArrowLeft" size={16} className="mr-2" />
            На главную
          </Button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Как работает SovetPay
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Полное руководство по использованию сервиса для всех участников
          </p>
        </motion.div>

        <div className="space-y-8">
          {sections.map((section, index) => {
            const isNewCategory = index === 0 || sections[index - 1].category !== section.category;
            
            return (
              <div key={section.id}>
                {isNewCategory && (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ duration: 0.4 }}
                    className="mb-6 mt-12 first:mt-0"
                  >
                    <h2 className="text-2xl font-bold text-primary uppercase tracking-wide">
                      {section.category}
                    </h2>
                    <div className="h-1 w-20 bg-primary mt-2 rounded-full"></div>
                  </motion.div>
                )}
                
                <motion.div
                  id={section.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 hover:shadow-xl transition-shadow scroll-mt-24"
                >
                  <div className="flex items-start gap-4 mb-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                      <Icon name={section.icon} size={24} className="text-primary" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 pt-1">
                      {section.title}
                    </h3>
                  </div>
                  <div className="pl-16">
                    <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                      {section.content}
                    </p>
                  </div>
                </motion.div>
              </div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mt-16 text-center"
        >
          <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-2xl p-8 border border-primary/20">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Готовы начать?
            </h3>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              Присоединяйтесь к сервису и находите жилье через проверенные рекомендации
            </p>
            <Button size="lg" onClick={() => navigate('/')}>
              Перейти на главную
            </Button>
          </div>
        </motion.div>
      </main>

      <footer className="bg-white border-t border-gray-200 mt-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-center text-gray-600 text-sm">
            © {new Date().getFullYear()} SovetPay. Все права защищены.
          </p>
        </div>
      </footer>
    </div>
  );
};