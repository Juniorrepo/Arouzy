import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from "react";
import { ContentItem } from "../pages/Home";
import { searchService } from "../services/api";

interface SearchContextType {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchResults: ContentItem[];
  searchSuggestions: ContentItem[];
  isSearching: boolean;
  isSearchingSuggestions: boolean;
  performSearch: (query: string, page?: number) => Promise<void>;
  clearSearch: () => void;
  getSearchSuggestions: (query: string) => Promise<void>;
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
  const [searchSuggestions, setSearchSuggestions] = useState<ContentItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSearchingSuggestions, setIsSearchingSuggestions] = useState(false);

  // Debounce refs
  const searchTimeoutRef = useRef<number>();
  const suggestionsTimeoutRef = useRef<number>();

  const performSearch = useCallback(async (query: string, page: number = 1) => {
    if (!query.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    try {
      const response = await searchService.searchContent(query, page);
      setSearchResults(response.data.content || []);
    } catch (error) {
      console.error("Error performing search:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const getSearchSuggestions = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchSuggestions([]);
      setIsSearchingSuggestions(false);
      return;
    }

    setIsSearchingSuggestions(true);
    try {
      const response = await searchService.getSearchSuggestions(query);
      setSearchSuggestions(response.data.content || []);
    } catch (error) {
      console.error("Error getting search suggestions:", error);
      setSearchSuggestions([]);
    } finally {
      setIsSearchingSuggestions(false);
    }
  }, []);

  const clearSearch = useCallback(() => {
    setSearchQuery("");
    setSearchResults([]);
    setSearchSuggestions([]);
    setIsSearching(false);
    setIsSearchingSuggestions(false);

    // Clear timeouts
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    if (suggestionsTimeoutRef.current) {
      clearTimeout(suggestionsTimeoutRef.current);
    }
  }, []);

  const handleSetSearchQuery = useCallback(
    (query: string) => {
      setSearchQuery(query);

      // Clear existing timeouts
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      if (suggestionsTimeoutRef.current) {
        clearTimeout(suggestionsTimeoutRef.current);
      }

      if (query.trim()) {
        // Debounce search suggestions (300ms)
        suggestionsTimeoutRef.current = setTimeout(() => {
          getSearchSuggestions(query);
        }, 300);

        // Debounce full search (500ms)
        searchTimeoutRef.current = setTimeout(() => {
          performSearch(query);
        }, 500);
      } else {
        setSearchResults([]);
        setSearchSuggestions([]);
        setIsSearching(false);
        setIsSearchingSuggestions(false);
      }
    },
    [performSearch, getSearchSuggestions]
  );

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      if (suggestionsTimeoutRef.current) {
        clearTimeout(suggestionsTimeoutRef.current);
      }
    };
  }, []);

  const value = {
    searchQuery,
    setSearchQuery: handleSetSearchQuery,
    searchResults,
    searchSuggestions,
    isSearching,
    isSearchingSuggestions,
    performSearch,
    clearSearch,
    getSearchSuggestions,
  };

  return (
    <SearchContext.Provider value={value}>{children}</SearchContext.Provider>
  );
};
