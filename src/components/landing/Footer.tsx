import { Github, Twitter, Mail } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

interface FooterLink {
  label: string;
  href: string;
}

interface FooterSection {
  title: string;
  links: FooterLink[];
}

interface FooterProps {
  companyName?: string;
  tagline?: string;
  sections?: FooterSection[];
  socialLinks?: {
    twitter?: string;
    telegram?: string;
    github?: string;
    email?: string;
  };
  copyrightText?: string;
  onRegisterClick?: () => void;
}

const defaultSections: FooterSection[] = [
  {
    title: "Арендаторам",
    links: [
      { label: "Найти жильё", href: "#register" },
      { label: "Как это работает", href: "#how-it-works" },
      { label: "Гарантии безопасности", href: "#safety" },
    ],
  },
  {
    title: "Рекомендателям",
    links: [
      { label: "Лента заявок", href: "/feed" },
      { label: "Вознаграждения", href: "#pricing" },
      { label: "Правила выплат", href: "#payouts" },
    ],
  },
  {
    title: "Владельцам",
    links: [
      { label: "Сдать жильё", href: "#rent-out" },
      { label: "Верификация жильцов", href: "#verification" },
      { label: "Договоры аренды", href: "#contracts" },
    ],
  },
  {
    title: "Компания",
    links: [
      { label: "Помощь", href: "#help" },
      { label: "Контакты", href: "#contact" },
      { label: "Политика конфиденциальности", href: "#privacy" },
    ],
  },
];

export const Footer = ({
  companyName = "SovetPay",
  tagline = "Аренда жилья через рекомендации — безопасно и выгодно",
  sections = defaultSections,
  socialLinks = {
    twitter: "https://twitter.com",
    telegram: "https://t.me",
    github: "https://github.com",
    email: "hello@sinhrolink.ru",
  },
  copyrightText,
  onRegisterClick,
}: FooterProps) => {
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();
  const copyright = copyrightText || `© ${currentYear} ${companyName}. Все права защищены.`;

  const handleLinkClick = (href: string, e: React.MouseEvent) => {
    if (href === '#register' && onRegisterClick) {
      e.preventDefault();
      onRegisterClick();
    } else if (href.startsWith('/')) {
      e.preventDefault();
      navigate(href);
    } else if (href.startsWith('#')) {
      e.preventDefault();
      const element = document.querySelector(href);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <footer className="w-full bg-[#fafafa] border-t border-[#e5e5e5]">
      <div className="max-w-[1200px] mx-auto px-8 py-8">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8 mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="col-span-2"
          >
            <h4 className="text-sm font-medium text-[#202020] mb-4 uppercase tracking-wide opacity-0 pointer-events-none">
              Placeholder
            </h4>
            <div>
              <img 
                src="https://cdn.poehali.dev/projects/98f29e7d-3c71-4ce1-9618-2738c542d164/bucket/34962643-9b8b-4fd1-bec2-5ba3e9cbbfcc.png" 
                alt={companyName} 
                className="h-50 w-auto mb-4"
              />
              <p className="text-sm leading-5 text-[#666666] max-w-xs mb-6">
                {tagline}
              </p>
            </div>

            <div className="flex items-center gap-3">
              {socialLinks.twitter && (
                <a
                  href={socialLinks.twitter}
                  className="w-9 h-9 flex items-center justify-center rounded-full bg-white border border-[#e5e5e5] text-[#666666] hover:text-[#202020] hover:border-[#202020] transition-colors duration-150"
                  aria-label="Twitter"
                >
                  <Twitter className="w-4 h-4" />
                </a>
              )}
              {socialLinks.telegram && (
                <a
                  href={socialLinks.telegram}
                  className="w-9 h-9 flex items-center justify-center rounded-full bg-white border border-[#e5e5e5] text-[#666666] hover:text-[#202020] hover:border-[#202020] transition-colors duration-150"
                  aria-label="Telegram"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                  </svg>
                </a>
              )}
              {socialLinks.github && (
                <a
                  href={socialLinks.github}
                  className="w-9 h-9 flex items-center justify-center rounded-full bg-white border border-[#e5e5e5] text-[#666666] hover:text-[#202020] hover:border-[#202020] transition-colors duration-150"
                  aria-label="GitHub"
                >
                  <Github className="w-4 h-4" />
                </a>
              )}
              {socialLinks.email && (
                <a
                  href={`mailto:${socialLinks.email}`}
                  className="w-9 h-9 flex items-center justify-center rounded-full bg-white border border-[#e5e5e5] text-[#666666] hover:text-[#202020] hover:border-[#202020] transition-colors duration-150"
                  aria-label="Email"
                >
                  <Mail className="w-4 h-4" />
                </a>
              )}
            </div>
          </motion.div>

          {sections.map((section, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: index * 0.1, ease: "easeOut" }}
              className="col-span-1"
            >
              <h4 className="text-sm font-medium text-[#202020] mb-4 uppercase tracking-wide">
                {section.title}
              </h4>
              <ul className="space-y-3">
                {section.links.map((link, linkIndex) => (
                  <li key={linkIndex}>
                    <a
                      href={link.href}
                      onClick={(e) => handleLinkClick(link.href, e)}
                      className="text-sm text-[#666666] hover:text-[#202020] transition-colors duration-150 cursor-pointer"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="pt-8 border-t border-[#e5e5e5]"
        >
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-[#666666]">
              {copyright}
            </p>
            <div className="flex items-center gap-6">
              <a
                href="#status"
                className="text-sm text-[#666666] hover:text-[#202020] transition-colors duration-150"
              >
                Статус
              </a>
              <a
                href="#sitemap"
                className="text-sm text-[#666666] hover:text-[#202020] transition-colors duration-150"
              >
                Карта сайта
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </footer>
  );
};