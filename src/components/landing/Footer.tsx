import { Instagram } from "lucide-react";
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
    vk?: string;
    telegram?: string;
    instagram?: string;
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
    vk: "https://vk.com",
    telegram: "https://t.me",
    instagram: "https://instagram.com",
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
      <div className="max-w-[1200px] mx-auto px-8 py-6">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-6 mb-8 items-start">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="col-span-2"
            style={{ marginTop: '-4.5rem' }}
          >
            <img 
              src="https://cdn.poehali.dev/projects/98f29e7d-3c71-4ce1-9618-2738c542d164/bucket/bf9825ff-384f-4373-81c0-67ea99aefa6f.png" 
              alt={companyName} 
              className="h-16 w-auto mb-4"
            />
            <p className="text-sm leading-5 text-[#666666] max-w-xs mb-1.5">
              {tagline}
            </p>

            <div className="flex items-center gap-3">
              {socialLinks.vk && (
                <a
                  href={socialLinks.vk}
                  className="w-9 h-9 flex items-center justify-center rounded-full bg-white border border-[#e5e5e5] text-[#666666] hover:text-[#202020] hover:border-[#202020] transition-colors duration-150"
                  aria-label="VK"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M15.684 0H8.316C1.592 0 0 1.592 0 8.316v7.368C0 22.408 1.592 24 8.316 24h7.368C22.408 24 24 22.408 24 15.684V8.316C24 1.592 22.391 0 15.684 0zm3.692 17.123h-1.744c-.66 0-.864-.525-2.05-1.727-1.033-1-1.49-1.135-1.744-1.135-.356 0-.458.102-.458.593v1.575c0 .424-.136.678-1.253.678-1.846 0-3.896-1.118-5.335-3.202C4.624 10.857 4.03 8.57 4.03 8.096c0-.254.102-.491.593-.491h1.744c.441 0 .61.203.78.677.863 2.49 2.303 4.675 2.896 4.675.22 0 .322-.102.322-.66V9.721c-.068-1.186-.695-1.287-.695-1.71 0-.204.17-.407.44-.407h2.744c.373 0 .508.203.508.643v3.473c0 .372.168.507.271.507.22 0 .407-.135.813-.542 1.254-1.406 2.151-3.574 2.151-3.574.119-.254.322-.491.763-.491h1.744c.525 0 .644.27.525.643-.22 1.017-2.354 4.031-2.354 4.031-.186.305-.254.44 0 .78.186.254.796.779 1.203 1.253.745.847 1.32 1.558 1.473 2.05.17.49-.085.744-.576.744z"/>
                  </svg>
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
              {socialLinks.instagram && (
                <a
                  href={socialLinks.instagram}
                  className="w-9 h-9 flex items-center justify-center rounded-full bg-white border border-[#e5e5e5] text-[#666666] hover:text-[#202020] hover:border-[#202020] transition-colors duration-150"
                  aria-label="Instagram"
                >
                  <Instagram className="w-4 h-4" />
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
              <h4 className="text-sm font-medium text-[#202020] mb-3 uppercase tracking-wide">
                {section.title}
              </h4>
              <ul className="space-y-2">
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
          className="pt-6 border-t border-[#e5e5e5]"
        >
          <div className="flex flex-col md:flex-row justify-between items-center gap-3">
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