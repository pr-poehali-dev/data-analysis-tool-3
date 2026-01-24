import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PhoneVerification } from "./PhoneVerification";

const registrationSchema = z.object({
  firstName: z.string().min(2, "Минимум 2 символа"),
  lastName: z.string().min(2, "Минимум 2 символа"),
  phone: z.string().regex(/^\+?[0-9]{10,12}$/, "Некорректный номер телефона"),
  email: z.string().email("Некорректный email"),
  password: z.string().min(6, "Минимум 6 символов"),
});

type FormData = z.infer<typeof registrationSchema>;

interface RegistrationFormProps {
  onSuccess: (data: FormData) => void;
}

export const RegistrationForm = ({ onSuccess }: RegistrationFormProps) => {
  const [step, setStep] = useState<"form" | "phone-verify">("form");
  const [formData, setFormData] = useState<FormData | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(registrationSchema),
  });

  const onSubmit = async (data: FormData) => {
    console.log("Form submitted with data:", data);
    setFormData(data);
    console.log("Switching to phone-verify step");
    setStep("phone-verify");
  };

  const handlePhoneVerified = () => {
    if (formData) {
      onSuccess(formData);
    }
  };

  console.log("Current step:", step);
  console.log("Form data:", formData);

  return (
    <div className="w-full max-w-2xl mx-auto">
      <AnimatePresence mode="wait">
        {step === "form" && (
          <motion.div
            key="registration-form"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-foreground mb-3">
                Регистрация
              </h2>
              <p className="text-muted-foreground">
                Заполните данные для регистрации
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#155eef] hover:bg-[#155eef]/90 text-white"
                size="lg"
              >
                {isSubmitting ? "Регистрация..." : "Продолжить"}
              </Button>
            </form>
          </motion.div>
        )}

        {step === "phone-verify" && formData && (
          <motion.div
            key="phone-verification"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <PhoneVerification
              phone={formData.phone}
              onVerified={handlePhoneVerified}
              onBack={() => setStep("form")}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};