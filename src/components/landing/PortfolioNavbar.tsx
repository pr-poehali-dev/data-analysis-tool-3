import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, LogOut, User, Instagram } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { authStore } from "@/store/authStore";

const footerSections = [
  {
    title: "Арендаторам",
    links: [
      { label: "Найти жильё", href: "/how-it-works#find-housing" },
      { label: "Как это работает", href: "/how-it-works#how-it-works" },
      { label: "Гарантии безопасности", href: "/how-it-works#safety" },
    ],
  },
  {
    title: "Рекомендателям",
    links: [
      { label: "Лента заявок", href: "/how-it-works#feed" },
      { label: "Вознаграждения", href: "/how-it-works#pricing" },
      { label: "Правила выплат", href: "/how-it-works#payouts" },
    ],
  },
  {
    title: "Владельцам",
    links: [
      { label: "Сдать жильё", href: "/how-it-works#rent-out" },
      { label: "Верификация жильцов", href: "/how-it-works#verification" },
      { label: "Договоры аренды", href: "/how-it-works#contracts" },
    ],
  },
  {
    title: "Компания",
    links: [
      { label: "Помощь", href: "#help" },
      { label: "Контакты", href: "#contact" },
      { label: "Политика конфиденциальности", href: "/privacy-policy" },
    ],
  },
];

const socialLinks = {
  vk: "https://vk.ru/sovetpay",
  telegram: "https://t.me/SovetPay",
  instagram: "https://www.instagram.com/sovetpay",
};

interface NavigationLink {
  name: string;
  href: string;
}

interface PortfolioNavbarProps {
  onRegisterClick?: () => void;
  onLoginClick?: () => void;
  onLogout?: () => void;
  showNavigation?: boolean;
}

const navigationLinks: NavigationLink[] = [
  { name: "Как работает", href: "#how-it-works" },
  { name: "Преимущества", href: "#benefits" },
  { name: "Лента заявок", href: "/feed" },
];

export const PortfolioNavbar = ({ onRegisterClick, onLoginClick, onLogout, showNavigation = true }: PortfolioNavbarProps = {}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [user, setUser] = useState(authStore.getUser());

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setUser(authStore.getUser());
    
    const unsubscribe = authStore.subscribe(() => {
      setUser(authStore.getUser());
    });
    
    return unsubscribe;
  }, []);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const scrollToElement = (selector: string) => {
    const element = document.querySelector(selector);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleLinkClick = (href: string) => {
    const wasMobileOpen = isMobileMenuOpen;
    closeMobileMenu();

    const doNavigation = () => {
      if (href.startsWith('/')) {
        navigate(href);
        setTimeout(() => {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 0);
      } else if (location.pathname !== '/') {
        navigate('/', { state: { scrollTo: href } });
      } else {
        scrollToElement(href);
      }
    };

    if (wasMobileOpen) {
      setTimeout(doNavigation, 350);
    } else {
      doNavigation();
    }
  };

  const handleFooterLinkClick = (href: string) => {
    closeMobileMenu();
    const doNav = () => {
      if (href.startsWith('/')) {
        navigate(href);
      } else if (href.startsWith('#')) {
        if (location.pathname !== '/') {
          navigate('/', { state: { scrollTo: href } });
        } else {
          const el = document.querySelector(href);
          if (el) el.scrollIntoView({ behavior: "smooth" });
        }
      }
    };
    setTimeout(doNav, 350);
  };

  const handleLogoClick = () => {
    if (location.pathname === '/') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      navigate('/');
    }
  };

  const handleLogout = () => {
    authStore.logout();
    closeMobileMenu();
    if (onLogout) {
      onLogout();
    }
    navigate('/');
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? "bg-background/95 backdrop-blur-md shadow-sm" : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <div className="flex-shrink-0">
            <button
              onClick={handleLogoClick}
              className="hover:opacity-80 transition-opacity duration-200 relative z-0"
            >
              <img 
                src="https://cdn.poehali.dev/projects/98f29e7d-3c71-4ce1-9618-2738c542d164/bucket/bf9825ff-384f-4373-81c0-67ea99aefa6f.png" 
                alt="SovetPay" 
                className="h-16 w-auto object-contain"
              />
            </button>
          </div>

          {showNavigation && (
            <div className="hidden md:block">
              <div className="ml-10 flex items-center space-x-8">
                {navigationLinks.map((link) => (
                  <button
                    key={link.name}
                    onClick={() => handleLinkClick(link.href)}
                    className="text-foreground hover:text-primary px-3 py-2 text-base font-medium transition-colors duration-200 relative group"
                  >
                    <span>{link.name}</span>
                    <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full" />
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <>
                <div className="flex items-center gap-3 text-sm text-foreground">
                  {user.photo ? (
                    <img
                      src={user.photo}
                      alt={`${user.firstName} ${user.lastName}`}
                      className="w-10 h-10 rounded-full object-cover border-2 border-primary"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center border-2 border-primary">
                      <User size={20} className="text-primary" />
                    </div>
                  )}
                  <span className="font-medium">{user.firstName} {user.lastName}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 text-foreground hover:text-red-600 px-4 py-2 rounded-lg hover:bg-red-50 transition-all duration-200"
                >
                  <LogOut size={18} />
                  <span>Выйти</span>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={onLoginClick}
                  className="text-[#202020] border border-[#202020] rounded-full px-[18px] py-[15px] text-base leading-4 whitespace-nowrap transition-all duration-150 ease-[cubic-bezier(0.455,0.03,0.515,0.955)] hover:rounded-2xl"
                >
                  Войти
                </button>
                <button
                  onClick={onRegisterClick}
                  className="bg-[#155eef] text-white px-[18px] rounded-full text-base font-semibold hover:bg-[#155eef]/90 transition-all duration-200 hover:rounded-2xl shadow-sm hover:shadow-md whitespace-nowrap leading-4 py-[15px]"
                >
                  <span className="font-medium">Попробовать</span>
                </button>
              </>
            )}
          </div>

          <div className="md:hidden">
            <button
              onClick={toggleMobileMenu}
              className="text-foreground hover:text-primary p-2 rounded-md transition-colors duration-200"
              aria-label="Открыть меню"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="md:hidden bg-background/95 backdrop-blur-md border-t border-border overflow-y-auto"
            style={{ maxHeight: 'calc(100dvh - 5rem)' }}
          >
            <div className="px-5 py-4 space-y-2">
              <div>
                {user ? (
                  <>
                    <div className="flex items-center gap-2.5 text-foreground mb-3 px-1">
                      {user.photo ? (
                        <img
                          src={user.photo}
                          alt={`${user.firstName} ${user.lastName}`}
                          className="w-9 h-9 rounded-full object-cover border-2 border-primary"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center border-2 border-primary">
                          <User size={18} className="text-primary" />
                        </div>
                      )}
                      <span className="text-sm font-medium">{user.firstName} {user.lastName}</span>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center justify-center gap-2 text-white bg-red-500 hover:bg-red-600 px-4 py-2.5 rounded-full text-sm font-semibold transition-all duration-200"
                    >
                      <LogOut size={15} />
                      <span>Выйти</span>
                    </button>
                  </>
                ) : (
                  <div className="flex gap-2.5">
                    <button
                      onClick={() => {
                        closeMobileMenu();
                        if (onLoginClick) onLoginClick();
                      }}
                      className="flex-1 text-[#202020] border border-[#202020] rounded-full px-4 py-2.5 text-sm leading-4 whitespace-nowrap transition-all duration-150"
                    >
                      Войти
                    </button>
                    <button
                      onClick={() => {
                        closeMobileMenu();
                        if (onRegisterClick) onRegisterClick();
                      }}
                      className="flex-1 bg-[#155eef] text-white px-4 py-2.5 rounded-full text-sm font-semibold hover:bg-[#155eef]/90 transition-all duration-200"
                    >
                      Попробовать
                    </button>
                  </div>
                )}
              </div>
              {showNavigation && navigationLinks.map((link) => (
                <button
                  key={link.name}
                  onClick={() => handleLinkClick(link.href)}
                  className="block w-full text-left text-foreground hover:text-primary py-2 text-sm font-medium transition-colors duration-200 border-t border-border"
                >
                  {link.name}
                </button>
              ))}

              <div className="border-t border-border pt-3 mt-1">
                <div className="flex items-center gap-3 mb-3">
                  <img 
                    src="https://cdn.poehali.dev/projects/98f29e7d-3c71-4ce1-9618-2738c542d164/bucket/bf9825ff-384f-4373-81c0-67ea99aefa6f.png" 
                    alt="SovetPay" 
                    className="h-10 w-auto"
                  />
                  <p className="text-xs leading-4 text-muted-foreground">
                    Аренда жилья через рекомендации — безопасно и выгодно
                  </p>
                </div>

                <div className="flex items-center gap-2.5 mb-3">
                  <a href={socialLinks.vk} className="w-8 h-8 flex items-center justify-center rounded-full bg-background border border-border text-muted-foreground hover:text-foreground hover:border-foreground transition-colors duration-150" aria-label="VK">
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M15.684 0H8.316C1.592 0 0 1.592 0 8.316v7.368C0 22.408 1.592 24 8.316 24h7.368C22.408 24 24 22.408 24 15.684V8.316C24 1.592 22.391 0 15.684 0zm3.692 17.123h-1.744c-.66 0-.864-.525-2.05-1.727-1.033-1-1.49-1.135-1.744-1.135-.356 0-.458.102-.458.593v1.575c0 .424-.136.678-1.253.678-1.846 0-3.896-1.118-5.335-3.202C4.624 10.857 4.03 8.57 4.03 8.096c0-.254.102-.491.593-.491h1.744c.441 0 .61.203.78.677.863 2.49 2.303 4.675 2.896 4.675.22 0 .322-.102.322-.66V9.721c-.068-1.186-.695-1.287-.695-1.71 0-.204.17-.407.44-.407h2.744c.373 0 .508.203.508.643v3.473c0 .372.168.507.271.507.22 0 .407-.135.813-.542 1.254-1.406 2.151-3.574 2.151-3.574.119-.254.322-.491.763-.491h1.744c.525 0 .644.27.525.643-.22 1.017-2.354 4.031-2.354 4.031-.186.305-.254.44 0 .78.186.254.796.779 1.203 1.253.745.847 1.32 1.558 1.473 2.05.17.49-.085.744-.576.744z"/></svg>
                  </a>
                  <a href={socialLinks.telegram} className="w-8 h-8 flex items-center justify-center rounded-full bg-background border border-border text-muted-foreground hover:text-foreground hover:border-foreground transition-colors duration-150" aria-label="Telegram">
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
                  </a>
                  <a href={socialLinks.instagram} className="w-8 h-8 flex items-center justify-center rounded-full bg-background border border-border text-muted-foreground hover:text-foreground hover:border-foreground transition-colors duration-150" aria-label="Instagram">
                    <Instagram className="w-3.5 h-3.5" />
                  </a>
                </div>

                <div className="grid grid-cols-2 gap-x-4 gap-y-3 mb-3">
                  {footerSections.map((section, index) => (
                    <div key={index}>
                      <h4 className="text-[10px] font-bold text-foreground/60 mb-1 uppercase tracking-wider">
                        {section.title}
                      </h4>
                      <ul className="space-y-0.5">
                        {section.links.map((link, linkIndex) => (
                          <li key={linkIndex}>
                            <button
                              onClick={() => handleFooterLinkClick(link.href)}
                              className="text-xs text-muted-foreground hover:text-foreground transition-colors duration-150 text-left leading-5"
                            >
                              {link.label}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>

                <p className="text-[10px] text-muted-foreground/70 pt-2 border-t border-border">
                  © {new Date().getFullYear()} SovetPay. Все права защищены.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};