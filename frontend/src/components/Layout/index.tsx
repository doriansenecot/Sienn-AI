/**
 * Modern Layout Component with Enhanced Navigation
 */
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { Upload, Activity, TestTube, Home, Menu, X, Database, Sparkles } from "lucide-react";
import { useState } from "react";
import { clsx } from "clsx";

export function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { path: "/", label: "Home", icon: <Home className="w-5 h-5" /> },
    { path: "/upload", label: "Upload", icon: <Upload className="w-5 h-5" /> },
    { path: "/training", label: "Training", icon: <Sparkles className="w-5 h-5" /> },
    { path: "/models", label: "Models", icon: <Database className="w-5 h-5" /> },
    { path: "/dashboard", label: "Dashboard", icon: <Activity className="w-5 h-5" /> },
    { path: "/inference", label: "Test", icon: <TestTube className="w-5 h-5" /> },
  ];

  const isActive = (path: string) => {
    if (path === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-dark-950 text-white relative">
      {/* Grain Overlay */}
      <div className="grain-overlay" />

      {/* Navigation Bar */}
      <nav className="sticky top-0 z-50 glass-strong border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-3 hover:scale-105 transition-transform duration-200 focus-ring rounded-xl"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 via-secondary-500 to-accent-500 flex items-center justify-center shadow-lg shadow-primary-500/50 animate-glow-pulse">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-gradient bg-[length:200%_auto] animate-gradient-x">Sienn AI</span>
            </button>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={clsx(
                    "flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all duration-200 font-medium text-sm",
                    isActive(item.path)
                      ? "bg-gradient-to-r from-primary-500/20 to-secondary-500/20 text-white border border-primary-500/30 shadow-glow-sm"
                      : "text-dark-300 hover:text-white hover:bg-white/5 border border-transparent"
                  )}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              ))}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2.5 rounded-xl hover:bg-white/5 transition-colors focus-ring"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-white/10 animate-fade-in-down">
            <div className="px-4 py-4 space-y-1 bg-dark-900/50 backdrop-blur-xl">
              {navItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => {
                    navigate(item.path);
                    setMobileMenuOpen(false);
                  }}
                  className={clsx(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium text-sm",
                    isActive(item.path)
                      ? "bg-gradient-to-r from-primary-500/20 to-secondary-500/20 text-white border border-primary-500/30"
                      : "text-dark-300 hover:text-white hover:bg-white/5 border border-transparent"
                  )}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="relative z-10">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="relative z-10 glass-dark border-t border-white/10 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-dark-400">
            <div className="flex items-center gap-2">
              <span className="text-gradient font-semibold">Sienn AI</span>
              <span>•</span>
              <span>© {new Date().getFullYear()}</span>
            </div>
            <a
              href="https://github.com/doriansenecot"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 hover:text-primary-400 transition-colors"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path
                  fillRule="evenodd"
                  d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                  clipRule="evenodd"
                />
              </svg>
              <span>@doriansenecot</span>
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
