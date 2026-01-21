import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import Icon from "@/components/ui/icon";

const cities = [
  "Рязань",
  "Казань",
  "Санкт-Петербург",
  "Москва",
];

const baseSchema = z.object({
  role: z.enum(["tenant", "recommender", "landlord"], {
    required_error: "Выберите роль",
  }),
  firstName: z.string().min(2, "Минимум 2 символа"),
  lastName: z.string().min(2, "Минимум 2 символа"),
  phone: z.string().regex(/^\+?[0-9]{10,12}$/, "Некорректный номер телефона"),
  email: z.string().email("Некорректный email"),
  password: z.string().min(6, "Минимум 6 символов"),
});

const tenantSchema = baseSchema.extend({
  socialLink: z.string().url("Некорректная ссылка").optional().or(z.literal("")),
  city: z.string().min(1, "Выберите город"),
});

type FormData = z.infer<typeof tenantSchema>;

interface RegistrationFormProps {
  onSuccess: (data: FormData) => void;
}

export const RegistrationForm = ({ onSuccess }: RegistrationFormProps) => {
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [step, setStep] = useState<"role" | "form">("role");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = useForm<FormData>({
    resolver: zodResolver(selectedRole === "tenant" ? tenantSchema : baseSchema),
  });

  const roleValue = watch("role");

  const handleRoleSelect = (role: "tenant" | "recommender" | "landlord") => {
    setSelectedRole(role);
    setValue("role", role);
    setStep("form");
  };

  const onSubmit = async (data: FormData) => {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    onSuccess(data);
  };

  const roles = [
    {
      id: "tenant",
      title: "Я ищу жильё",
      description: "Хочу арендовать квартиру через рекомендации",
      icon: "Search",
    },
    {
      id: "recommender",
      title: "Я хочу рекомендовать",
      description: "Буду предлагать варианты и получать вознаграждение",
      icon: "Users",
    },
    {
      id: "landlord",
      title: "Я сдаю жильё",
      description: "Хочу сдать квартиру без комиссии",
      icon: "Home",
    },
  ];

  return (
    <div className="w-full max-w-2xl mx-auto">
      <AnimatePresence mode="wait">
        {step === "role" && (
          <motion.div
            key="role-selection"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-foreground mb-3">
                Регистрация
              </h2>
              <p className="text-muted-foreground text-lg">
                Выберите, как вы хотите использовать SovetPay
              </p>
            </div>

            <div className="grid gap-4">
              {roles.map((role) => (
                <motion.button
                  key={role.id}
                  onClick={() =>
                    handleRoleSelect(role.id as "tenant" | "recommender" | "landlord")
                  }
                  className="p-6 bg-white border-2 border-border rounded-2xl hover:border-primary hover:shadow-lg transition-all duration-200 text-left group"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                      <Icon
                        name={role.icon}
                        className="text-primary"
                        size={24}
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-foreground mb-1">
                        {role.title}
                      </h3>
                      <p className="text-muted-foreground">{role.description}</p>
                    </div>
                    <Icon
                      name="ChevronRight"
                      className="text-muted-foreground group-hover:text-primary transition-colors"
                      size={24}
                    />
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {step === "form" && (
          <motion.div
            key="registration-form"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <button
              onClick={() => setStep("role")}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
            >
              <Icon name="ChevronLeft" size={20} />
              <span>Назад</span>
            </button>

            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-foreground mb-3">
                {roles.find((r) => r.id === selectedRole)?.title}
              </h2>
              <p className="text-muted-foreground">
                Заполните данные для регистрации
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <input type="hidden" {...register("role")} />

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Имя</Label>
                  <Input
                    id="firstName"
                    placeholder="Иван"
                    {...register("firstName")}
                    error={errors.firstName?.message}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName">Фамилия</Label>
                  <Input
                    id="lastName"
                    placeholder="Иванов"
                    {...register("lastName")}
                    error={errors.lastName?.message}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Номер телефона</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+7 (900) 123-45-67"
                  {...register("phone")}
                  error={errors.phone?.message}
                />
                <p className="text-xs text-muted-foreground">
                  Мы отправим SMS с кодом подтверждения
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="ivan@example.com"
                  {...register("email")}
                  error={errors.email?.message}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Пароль</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••"
                  {...register("password")}
                  error={errors.password?.message}
                />
              </div>

              {selectedRole === "tenant" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="city">Город</Label>
                    <select
                      id="city"
                      {...register("city")}
                      className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="">Выберите город</option>
                      {cities.map((city) => (
                        <option key={city} value={city}>
                          {city}
                        </option>
                      ))}
                    </select>
                    {errors.city && (
                      <p className="text-sm text-red-500">{errors.city.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="socialLink">
                      Ссылка на соцсеть <span className="text-muted-foreground">(опционально)</span>
                    </Label>
                    <Input
                      id="socialLink"
                      type="url"
                      placeholder="https://vk.com/ivan"
                      {...register("socialLink")}
                      error={errors.socialLink?.message}
                    />
                    <p className="text-xs text-muted-foreground">
                      Поможет рекомендателям узнать больше о вас
                    </p>
                  </div>
                </>
              )}

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-12 text-base"
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <Icon name="Loader2" className="animate-spin" size={20} />
                    <span>Регистрация...</span>
                  </div>
                ) : (
                  "Зарегистрироваться"
                )}
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                Регистрируясь, вы соглашаетесь с{" "}
                <a href="#terms" className="text-primary hover:underline">
                  условиями использования
                </a>{" "}
                и{" "}
                <a href="#privacy" className="text-primary hover:underline">
                  политикой конфиденциальности
                </a>
              </p>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
