import React from "react";
import { Link } from "react-router-dom";
import { Search, Tag, User, Image, Video } from "lucide-react";
import { useSearch } from "../../contexts/SearchContext";
import { getThumbnailUrl } from "../../utils/imageUtils";
import SkeletonLoader from "./SkeletonLoader";

interface SearchSuggestionsProps {
  searchQuery: string;
  isVisible: boolean;
  onSelect: () => void;
}

const SearchSuggestions: React.FC<SearchSuggestionsProps> = ({
  searchQuery,
  isVisible,
  onSelect,
}) => {
  const { searchSuggestions, isSearchingSuggestions } = useSearch();

  if (!isVisible || !searchQuery.trim()) {
    return null;
  }

  // Show loading state with skeleton
  if (isSearchingSuggestions) {
    return (
      <div className="absolute top-full left-0 right-0 mt-1 bg-dark-800 border border-dark-600 rounded-lg shadow-lg z-50">
        <SkeletonLoader count={3} />
      </div>
    );
  }

  if (searchSuggestions.length === 0) {
    return (
      <div className="absolute top-full left-0 right-0 mt-1 bg-dark-800 border border-dark-600 rounded-lg shadow-lg z-50">
        <div className="p-4 text-center text-gray-400">
          <Search className="h-5 w-5 mx-auto mb-2" />
          <p>No results found for "{searchQuery}"</p>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute top-full left-0 right-0 mt-1 bg-dark-800 border border-dark-600 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
      {searchSuggestions.map((item) => (
        <Link
          key={item.id}
          to={`/content/${item.id}`}
          onClick={onSelect}
          className="block p-3 hover:bg-dark-700 transition-colors border-b border-dark-600 last:border-b-0"
        >
          <div className="flex items-start space-x-3">
            {/* Thumbnail */}
            <div className="flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden bg-gradient-to-br from-primary-500 to-primary-600">
              {item.thumbnail && !item.thumbnail.includes("gradient") ? (
                <img
                  src={getThumbnailUrl(item.thumbnail)}
                  alt={item.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Image className="h-6 w-6 text-white" />
                </div>
              )}
            </div>

            {/* Content Info */}
            <div className="flex-1 min-w-0">
              <h4 className="text-white font-medium text-sm line-clamp-1">
                {item.title}
              </h4>

              {item.description && (
                <p className="text-gray-400 text-xs line-clamp-1 mt-1">
                  {item.description}
                </p>
              )}

              {/* Meta Info */}
              <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                {item.user && (
                  <div className="flex items-center space-x-1">
                    <User className="h-3 w-3" />
                    <span>{item.user.username}</span>
                  </div>
                )}

                <div className="flex items-center space-x-1">
                  <Image className="h-3 w-3" />
                  <span>{item.imageCount}</span>
                </div>

                {item.videoCount > 0 && (
                  <div className="flex items-center space-x-1">
                    <Video className="h-3 w-3" />
                    <span>{item.videoCount}</span>
                  </div>
                )}
              </div>

              {/* Tags */}
              {item.tags && item.tags.length > 0 && (
                <div className="flex items-center space-x-1 mt-1">
                  <Tag className="h-3 w-3 text-gray-500" />
                  <div className="flex space-x-1">
                    {item.tags.slice(0, 2).map((tag) => (
                      <span
                        key={tag.id}
                        className="text-xs bg-dark-600 text-gray-300 px-1.5 py-0.5 rounded"
                      >
                        #{tag.name}
                      </span>
                    ))}
                    {item.tags.length > 2 && (
                      <span className="text-xs text-gray-500">
                        +{item.tags.length - 2}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </Link>
      ))}

      {/* View All Results */}
      <div className="p-3 border-t border-dark-600">
        <Link
          to={`/?search=${encodeURIComponent(searchQuery)}`}
          onClick={onSelect}
          className="text-primary-400 hover:text-primary-300 text-sm font-medium"
        >
          View all {searchSuggestions.length} results →
        </Link>
      </div>
    </div>
  );
};

export default SearchSuggestions;
