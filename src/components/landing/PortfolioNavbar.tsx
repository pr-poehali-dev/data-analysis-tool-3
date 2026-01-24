import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, LogOut, User } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { authStore } from "@/store/authStore";

interface NavigationLink {
  name: string;
  href: string;
}

interface PortfolioNavbarProps {
  onRegisterClick?: () => void;
  onLoginClick?: () => void;
  onLogout?: () => void;
}

const navigationLinks: NavigationLink[] = [
  { name: "Как работает", href: "#how-it-works" },
  { name: "Преимущества", href: "#benefits" },
  { name: "Лента заявок", href: "/feed" },
];

export const PortfolioNavbar = ({ onRegisterClick, onLoginClick, onLogout }: PortfolioNavbarProps = {}) => {
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

  const handleLinkClick = (href: string) => {
    closeMobileMenu();
    if (href.startsWith('/')) {
      navigate(href);
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 0);
    } else {
      if (location.pathname !== '/') {
        navigate('/');
        setTimeout(() => {
          const element = document.querySelector(href);
          if (element) {
            element.scrollIntoView({ behavior: "smooth" });
          }
        }, 100);
      } else {
        const element = document.querySelector(href);
        if (element) {
          element.scrollIntoView({ behavior: "smooth" });
        }
      }
    }
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

          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <>
                <div className="flex items-center gap-2 text-sm text-foreground">
                  <User size={18} />
                  <span>{user.firstName} {user.lastName}</span>
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
                  className="text-[#155eef] border-2 border-[#155eef] px-[18px] rounded-full text-base font-semibold hover:bg-[#155eef]/5 transition-all duration-200 hover:rounded-2xl shadow-sm whitespace-nowrap leading-4 py-[13px]"
                >
                  <span className="font-medium">Войти</span>
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
            className="md:hidden bg-background/95 backdrop-blur-md border-t border-border"
          >
            <div className="px-6 py-6 space-y-4">
              {navigationLinks.map((link) => (
                <button
                  key={link.name}
                  onClick={() => handleLinkClick(link.href)}
                  className="block w-full text-left text-foreground hover:text-primary py-3 text-lg font-medium transition-colors duration-200"
                >
                  <span>{link.name}</span>
                </button>
              ))}
              <div className="pt-4 border-t border-border">
                {user ? (
                  <>
                    <div className="flex items-center gap-2 text-foreground mb-4 px-3">
                      <User size={20} />
                      <span className="font-medium">{user.firstName} {user.lastName}</span>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center justify-center gap-2 text-white bg-red-500 hover:bg-red-600 px-[18px] py-[15px] rounded-full text-base font-semibold transition-all duration-200"
                    >
                      <LogOut size={18} />
                      <span>Выйти</span>
                    </button>
                  </>
                ) : (
                  <div className="space-y-3">
                    <button
                      onClick={() => {
                        closeMobileMenu();
                        if (onLoginClick) onLoginClick();
                      }}
                      className="w-full text-[#155eef] border-2 border-[#155eef] px-[18px] py-[13px] rounded-full text-base font-semibold hover:bg-[#155eef]/5 transition-all duration-200"
                    >
                      <span>Войти</span>
                    </button>
                    <button
                      onClick={() => {
                        closeMobileMenu();
                        if (onRegisterClick) onRegisterClick();
                      }}
                      className="w-full bg-[#155eef] text-white px-[18px] py-[15px] rounded-full text-base font-semibold hover:bg-[#155eef]/90 transition-all duration-200"
                    >
                      <span>Попробовать</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};