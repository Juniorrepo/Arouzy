import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useSearch } from "../../contexts/SearchContext";
import { Search, Menu, X, User, LogOut } from "lucide-react";
import SearchSuggestions from "../Content/SearchSuggestions";
import { contentService } from "../../services/api";
import { ContentItem } from "../../pages/Home";

const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { searchQuery, setSearchQuery, clearSearch } = useSearch();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [dynamicContent, setDynamicContent] = useState<ContentItem[]>([]);
  const [isLoadingContent, setIsLoadingContent] = useState(false);

  // Fetch content for search suggestions
  useEffect(() => {
    const fetchContentForSuggestions = async () => {
      setIsLoadingContent(true);
      try {
        const response = await contentService.getContent(1, "hot", {});
        setDynamicContent(response.data.content || []);
      } catch (error) {
        console.error("Error fetching content for suggestions:", error);
        // Fallback to empty array if API fails
        setDynamicContent([]);
      } finally {
        setIsLoadingContent(false);
      }
    };

    fetchContentForSuggestions();
  }, []);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const toggleProfileMenu = () => setIsProfileMenuOpen(!isProfileMenuOpen);

  const handleLogout = () => {
    logout();
    navigate("/login");
    setIsProfileMenuOpen(false);
  };

  return (
    <nav className="bg-dark-900 py-4 px-6 border-b border-dark-600">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center space-x-2">
          <span className="text-primary-500 font-bold text-2xl font-handwriting">
            Arouzy
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-8">
          <Link
            to="/"
            className="text-white hover:text-primary-300 transition-colors"
          >
            Shop
          </Link>
          <Link
            to="/"
            className="text-white hover:text-primary-300 transition-colors"
          >
            Live Cams
          </Link>
        </div>

        {/* Search Bar */}
        <div className="hidden md:flex flex-1 max-w-xl mx-8">
          <div className="relative w-full">
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search content, tags, users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setShowSearchSuggestions(true)}
              onBlur={() =>
                setTimeout(() => setShowSearchSuggestions(false), 200)
              }
              className="w-full bg-dark-600 rounded-full py-2 px-4 pl-10 text-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
            />
            <Search className="absolute left-3 top-2.5 text-gray-400 h-5 w-5" />
            {searchQuery && (
              <button
                onClick={clearSearch}
                className="absolute right-3 top-2.5 text-gray-400 hover:text-white transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            )}

            {/* Search Suggestions */}
            <SearchSuggestions
              searchQuery={searchQuery}
              content={dynamicContent}
              isVisible={showSearchSuggestions}
              onSelect={() => setShowSearchSuggestions(false)}
              isLoading={isLoadingContent}
            />
          </div>
        </div>

        {/* Auth Buttons / User Profile */}
        <div className="hidden md:flex items-center space-x-4">
          {isAuthenticated ? (
            <div className="relative">
              <button
                onClick={toggleProfileMenu}
                className="flex items-center space-x-2 text-white hover:text-primary-300 transition-colors focus:outline-none"
              >
                <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center">
                  <User className="h-5 w-5 text-white" />
                </div>
              </button>

              {/* Profile Dropdown */}
              {isProfileMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-dark-800 rounded-md shadow-lg py-1 z-10 animate-fade-in">
                  <Link
                    to={`/profile/${user?.username}`}
                    className="block px-4 py-2 text-sm text-white hover:bg-dark-700"
                    onClick={() => setIsProfileMenuOpen(false)}
                  >
                    Profile
                  </Link>
                  <Link
                    to={`/upload`}
                    className="block px-4 py-2 text-sm text-white hover:bg-dark-700"
                    onClick={() => setIsProfileMenuOpen(false)}
                  >
                    Upload
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-dark-700"
                  >
                    <div className="flex items-center">
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign out
                    </div>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              to="/signup"
              className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-1.5 rounded-full transition-colors duration-200"
            >
              sign up
            </Link>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden text-white focus:outline-none"
          onClick={toggleMenu}
        >
          {isMenuOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-dark-800 mt-4 py-4 px-6 animate-slide-down">
          <div className="flex flex-col space-y-4">
            <div className="mb-2">
              <div className="relative w-full">
                <input
                  type="text"
                  placeholder="Search content, tags, users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setShowSearchSuggestions(true)}
                  onBlur={() =>
                    setTimeout(() => setShowSearchSuggestions(false), 200)
                  }
                  className="w-full bg-dark-600 rounded-full py-2 px-4 pl-10 text-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                />
                <Search className="absolute left-3 top-2.5 text-gray-400 h-5 w-5" />
                {searchQuery && (
                  <button
                    onClick={clearSearch}
                    className="absolute right-3 top-2.5 text-gray-400 hover:text-white transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}

                {/* Mobile Search Suggestions */}
                <SearchSuggestions
                  searchQuery={searchQuery}
                  content={dynamicContent}
                  isVisible={showSearchSuggestions}
                  onSelect={() => setShowSearchSuggestions(false)}
                  isLoading={isLoadingContent}
                />
              </div>
            </div>
            <Link
              to="/"
              className="text-white hover:text-primary-300 transition-colors py-2"
              onClick={() => setIsMenuOpen(false)}
            >
              Shop
            </Link>
            <Link
              to="/"
              className="text-white hover:text-primary-300 transition-colors py-2"
              onClick={() => setIsMenuOpen(false)}
            >
              Live Cams
            </Link>
            {!isAuthenticated ? (
              <div className="flex flex-col space-y-2 pt-4 border-t border-dark-600">
                <Link
                  to="/login"
                  className="text-white hover:text-primary-300 transition-colors py-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="bg-primary-500 hover:bg-primary-600 text-white py-2 rounded-full text-center transition-colors duration-200"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Sign up
                </Link>
              </div>
            ) : (
              <div className="flex flex-col space-y-2 pt-4 border-t border-dark-600">
                <Link
                  to={`/profile/${user?.username}`}
                  className="text-white hover:text-primary-300 transition-colors py-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Profile
                </Link>
                <button
                  onClick={() => {
                    handleLogout();
                    setIsMenuOpen(false);
                  }}
                  className="text-white hover:text-primary-300 transition-colors py-2 text-left"
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
