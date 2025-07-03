import React, { createContext, useContext, useState, useCallback } from "react";
import { ContentItem } from "../pages/Home";

interface SearchContextType {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchResults: ContentItem[];
  isSearching: boolean;
  performSearch: (content: ContentItem[], query: string) => ContentItem[];
  clearSearch: () => void;
  getSearchSuggestions: (
    query: string,
    content: ContentItem[]
  ) => ContentItem[];
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export const useSearch = () => {
  const context = useContext(SearchContext);
  if (context === undefined) {
    throw new Error("useSearch must be used within a SearchProvider");
  }
  return context;
};

export const SearchProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<ContentItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const performSearch = useCallback(
    (content: ContentItem[], query: string): ContentItem[] => {
      if (!query.trim()) {
        return content;
      }

      const searchTerm = query.toLowerCase().trim();

      return content.filter((item) => {
        // Search in title
        if (item.title.toLowerCase().includes(searchTerm)) {
          return true;
        }

        // Search in description (if available)
        if (
          item.description &&
          item.description.toLowerCase().includes(searchTerm)
        ) {
          return true;
        }

        // Search in tags (if available)
        if (
          item.tags &&
          item.tags.some((tag) => tag.name.toLowerCase().includes(searchTerm))
        ) {
          return true;
        }

        // Search in username (if available)
        if (
          item.user &&
          item.user.username.toLowerCase().includes(searchTerm)
        ) {
          return true;
        }

        return false;
      });
    },
    []
  );

  const clearSearch = useCallback(() => {
    setSearchQuery("");
    setSearchResults([]);
    setIsSearching(false);
  }, []);

  const handleSetSearchQuery = useCallback((query: string) => {
    setSearchQuery(query);
    setIsSearching(query.trim().length > 0);
  }, []);

  const getSearchSuggestions = useCallback(
    (query: string, content: ContentItem[]): ContentItem[] => {
      if (!query.trim()) {
        return [];
      }

      const searchTerm = query.toLowerCase().trim();

      return content
        .filter((item) => {
          // Search in title
          if (item.title.toLowerCase().includes(searchTerm)) {
            return true;
          }

          // Search in description (if available)
          if (
            item.description &&
            item.description.toLowerCase().includes(searchTerm)
          ) {
            return true;
          }

          // Search in tags (if available)
          if (
            item.tags &&
            item.tags.some((tag) => tag.name.toLowerCase().includes(searchTerm))
          ) {
            return true;
          }

          // Search in username (if available)
          if (
            item.user &&
            item.user.username.toLowerCase().includes(searchTerm)
          ) {
            return true;
          }

          return false;
        })
        .slice(0, 5); // Limit to 5 suggestions
    },
    []
  );

  const value = {
    searchQuery,
    setSearchQuery: handleSetSearchQuery,
    searchResults,
    isSearching,
    performSearch,
    clearSearch,
    getSearchSuggestions,
  };

  return (
    <SearchContext.Provider value={value}>{children}</SearchContext.Provider>
  );
};
