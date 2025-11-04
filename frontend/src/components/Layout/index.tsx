/**
 * Main Layout Component with Navigation
 */
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { Upload, Activity, TestTube, Home, Menu, X } from "lucide-react";
import { useState } from "react";
import { clsx } from "clsx";

export function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { path: "/", label: "Home", icon: <Home className="w-5 h-5" /> },
    { path: "/upload", label: "Upload", icon: <Upload className="w-5 h-5" /> },
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
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Navigation Bar */}
      <nav className="sticky top-0 z-50 bg-slate-800/50 backdrop-blur-lg border-b border-slate-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-3 hover:opacity-80 transition-opacity"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-primary-400 to-purple-500 bg-clip-text text-transparent">
                Sienn AI
              </span>
            </button>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-2">
              {navItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={clsx(
                    "flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-200 border",
                    isActive(item.path)
                      ? "bg-primary-500/20 text-primary-400 border-primary-500/30"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/50 border-transparent"
                  )}
                >
                  {item.icon}
                  <span className="font-medium">{item.label}</span>
                </button>
              ))}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-slate-800/50 transition-colors"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-700/50 animate-fade-in-down">
            <div className="px-4 py-3 space-y-2">
              {navItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => {
                    navigate(item.path);
                    setMobileMenuOpen(false);
                  }}
                  className={clsx(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 border",
                    isActive(item.path)
                      ? "bg-primary-500/20 text-primary-400 border-primary-500/30"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/50 border-transparent"
                  )}
                >
                  {item.icon}
                  <span className="font-medium">{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main>
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-slate-800/50 backdrop-blur-lg border-t border-slate-700/50 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-sm text-slate-400">
            <p>Sienn AI - Fine-Tuning Platform</p>
            <p className="mt-1">Built with ❤️ using React, FastAPI, and HuggingFace</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
