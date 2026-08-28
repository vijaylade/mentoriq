import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "../components/ui/button";
import {
  User,
  LogOut,
  LayoutDashboard,
  Home,
  Info,
  Menu,
  X,
} from "lucide-react";
import logo from "../logo.svg";

const Navigation = () => {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    window.location.href = "/";
  };

  const dashboardLink =
    user?.role === "admin"
      ? "/admin"
      : user?.role === "teacher"
      ? "/teacher"
      : "/dashboard";

  return (
    <nav className="sticky top-0 z-50 backdrop-blur-xl bg-white/60 border-b border-white/20">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-4">
        <div className="flex items-center justify-between">

          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-2"
            data-testid="logo-link"
          >
            <img src={logo} alt="Altanon Logo" className="w-10 h-10" />
            <span className="text-xl md:text-2xl font-outfit font-black text-slate-900">
              Altanon Learn
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-3">
            <Link to="/">
              <Button className="clay-button-secondary">
                <Home className="w-4 h-4 mr-1" />
                Home
              </Button>
            </Link>

            <Link to="/courses">
              <Button className="clay-button-secondary">
                Courses
              </Button>
            </Link>

            <Link to="/about">
              <Button className="clay-button-secondary">
                <Info className="w-4 h-4 mr-1" />
                About Us
              </Button>
            </Link>

            {user ? (
              <>
                <div className="flex items-center gap-3 px-4 py-2 bg-slate-100 rounded-xl">
                  <User className="w-5 h-5 text-slate-600" />
                  <div>
                    <p className="text-sm font-bold">{user.name}</p>
                    <p className="text-xs capitalize text-slate-500">
                      {user.role}
                    </p>
                  </div>
                </div>

                <Link to={dashboardLink}>
                  <Button className="clay-button-secondary">
                    <LayoutDashboard className="w-4 h-4 mr-1" />
                    Dashboard
                  </Button>
                </Link>

                <Button
                  onClick={handleLogout}
                  className="clay-button-secondary"
                >
                  <LogOut className="w-4 h-4 mr-1" />
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Link to="/login">
                  <Button className="clay-button-secondary">
                    <User className="w-4 h-4 mr-1" />
                    Login
                  </Button>
                </Link>

                <Link to="/register">
                  <Button className="clay-button-primary">
                    Sign Up
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Hamburger */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-slate-100"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? (
              <X className="w-7 h-7" />
            ) : (
              <Menu className="w-7 h-7" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="md:hidden mt-4 rounded-xl bg-white shadow-lg border border-slate-200 p-4 space-y-3">

            <Link
              to="/"
              onClick={() => setMobileOpen(false)}
              className="block"
            >
              <Button className="w-full justify-start clay-button-secondary">
                <Home className="w-4 h-4 mr-2" />
                Home
              </Button>
            </Link>

            <Link
              to="/courses"
              onClick={() => setMobileOpen(false)}
              className="block"
            >
              <Button className="w-full justify-start clay-button-secondary">
                Courses
              </Button>
            </Link>

            <Link
              to="/about"
              onClick={() => setMobileOpen(false)}
              className="block"
            >
              <Button className="w-full justify-start clay-button-secondary">
                <Info className="w-4 h-4 mr-2" />
                About Us
              </Button>
            </Link>

            {user ? (
              <>
                <div className="rounded-lg bg-slate-100 p-3">
                  <p className="font-semibold">{user.name}</p>
                  <p className="text-sm capitalize text-slate-500">
                    {user.role}
                  </p>
                </div>

                <Link
                  to={dashboardLink}
                  onClick={() => setMobileOpen(false)}
                  className="block"
                >
                  <Button className="w-full justify-start clay-button-secondary">
                    <LayoutDashboard className="w-4 h-4 mr-2" />
                    Dashboard
                  </Button>
                </Link>

                <Button
                  onClick={handleLogout}
                  className="w-full justify-start clay-button-secondary"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setMobileOpen(false)}
                  className="block"
                >
                  <Button className="w-full justify-start clay-button-secondary">
                    <User className="w-4 h-4 mr-2" />
                    Login
                  </Button>
                </Link>

                <Link
                  to="/register"
                  onClick={() => setMobileOpen(false)}
                  className="block"
                >
                  <Button className="w-full clay-button-primary">
                    Sign Up
                  </Button>
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;