import React, { useState, useEffect } from "react";
import { Calendar, Filter, ChevronDown, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { contentService } from "../../services/api";

// Types
type SortOption = "hot" | "top" | "new" | "shuffle";

interface Filters {
  tags?: string[];
  minUpvotes?: number;
  fromDate?: string;
}

interface FilterBarProps {
  activeSort: SortOption;
  onSortChange: (sort: SortOption) => void;
  filters: Filters;
  onFilterChange: (filters: Filters) => void;
}

const FilterBar: React.FC<FilterBarProps> = ({
  activeSort,
  onSortChange,
  filters,
  onFilterChange,
}) => {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [tempFilters, setTempFilters] = useState<Filters>(filters);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [isLoadingTags, setIsLoadingTags] = useState(false);

  // Fetch available tags on component mount
  useEffect(() => {
    const fetchTags = async () => {
      setIsLoadingTags(true);
      try {
        const response = await contentService.getTags();
        const tags = response.data.tags.map(
          (tag: { id: number; name: string }) => tag.name
        );
        setAvailableTags(tags);
      } catch (error) {
        console.error("Error fetching tags:", error);
        // Fallback to default tags if API fails
        setAvailableTags([
          "photography",
          "art",
          "nature",
          "travel",
          "food",
          "music",
          "sports",
          "technology",
        ]);
      } finally {
        setIsLoadingTags(false);
      }
    };

    fetchTags();
  }, []);

  const handleSortClick = (sort: SortOption) => {
    onSortChange(sort);
  };

  const toggleFilterDropdown = () => {
    setIsFilterOpen(!isFilterOpen);
    if (!isFilterOpen) {
      setTempFilters({ ...filters });
    }
  };

  const handleApplyFilter = () => {
    console.log("Applying filters:", tempFilters);
    onFilterChange(tempFilters);
    setIsFilterOpen(false);
  };

  const handleResetFilter = () => {
    setTempFilters({});
    onFilterChange({});
    setIsFilterOpen(false);
  };

  const handleTempFilterChange = (key: keyof Filters, value: any) => {
    setTempFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // Count active filters
  const activeFilterCount = [
    filters.tags && filters.tags.length > 0,
    filters.minUpvotes && filters.minUpvotes > 0,
    filters.fromDate && filters.fromDate !== "",
  ].filter(Boolean).length;

  return (
    <div className="relative">
      {/* Sorting and Filtering Controls */}
      <div className="flex items-center justify-between border-b border-dark-600 pb-4">
        {/* Sort Buttons */}
        <div className="flex space-x-1">
          <button
            onClick={() => handleSortClick("hot")}
            className={`px-4 py-1.5 rounded-md transition-colors ${
              activeSort === "hot"
                ? "text-white border-b-2 border-primary-500"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Hot
          </button>

          <button
            onClick={() => handleSortClick("top")}
            className={`px-4 py-1.5 rounded-md transition-colors ${
              activeSort === "top"
                ? "text-white border-b-2 border-primary-500"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Top
          </button>

          <button
            onClick={() => handleSortClick("new")}
            className={`px-4 py-1.5 rounded-md transition-colors ${
              activeSort === "new"
                ? "text-white border-b-2 border-primary-500"
                : "text-gray-400 hover:text-white"
            }`}
          >
            New
          </button>

          <button
            onClick={() => handleSortClick("shuffle")}
            className={`hidden sm:block px-4 py-1.5 rounded-md transition-colors ${
              activeSort === "shuffle"
                ? "text-white border-b-2 border-primary-500"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Shuffle
          </button>
        </div>

        {/* Filter Button */}
        <button
          onClick={toggleFilterDropdown}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full ${
            activeFilterCount > 0 || isFilterOpen
              ? "bg-primary-500 text-white"
              : "bg-dark-500 text-white hover:bg-dark-400"
          } transition-colors`}
        >
          <Filter className="w-4 h-4" />
          <span className="text-sm font-medium">
            {activeFilterCount > 0
              ? `Filters (${activeFilterCount})`
              : "Filters"}
          </span>
          <ChevronDown
            className={`w-4 h-4 transition-transform ${
              isFilterOpen ? "rotate-180" : ""
            }`}
          />
        </button>
      </div>

      {/* Filter Dropdown */}
      <AnimatePresence>
        {isFilterOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-2 w-full sm:w-80 bg-dark-500 rounded-lg shadow-lg z-10 p-4"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-medium">Filter Content</h3>
              <button
                onClick={toggleFilterDropdown}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Filter by Tags */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Tags</label>
              {isLoadingTags ? (
                <div className="flex items-center justify-center py-4">
                  <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
                  <span className="ml-2 text-gray-400 text-sm">
                    Loading tags...
                  </span>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {availableTags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => {
                        const currentTags = tempFilters.tags || [];
                        const updatedTags = currentTags.includes(tag)
                          ? currentTags.filter((t) => t !== tag)
                          : [...currentTags, tag];
                        handleTempFilterChange("tags", updatedTags);
                      }}
                      className={`px-3 py-1 text-sm rounded-full ${
                        tempFilters.tags?.includes(tag)
                          ? "bg-primary-500 text-white"
                          : "bg-dark-400 text-white hover:bg-dark-300"
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Filter by Upvotes */}
            <div className="mb-4">
              <label
                htmlFor="minUpvotes"
                className="block text-sm font-medium mb-2"
              >
                Minimum Upvotes
              </label>
              <select
                id="minUpvotes"
                value={tempFilters.minUpvotes || ""}
                onChange={(e) =>
                  handleTempFilterChange(
                    "minUpvotes",
                    e.target.value ? Number(e.target.value) : undefined
                  )
                }
                className="w-full bg-dark-600 border border-dark-400 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Any</option>
                <option value="10">10+</option>
                <option value="50">50+</option>
                <option value="100">100+</option>
                <option value="500">500+</option>
              </select>
            </div>

            {/* Filter by Date */}
            <div className="mb-6">
              <label
                htmlFor="fromDate"
                className="block text-sm font-medium mb-2"
              >
                From Date
              </label>
              <div className="relative">
                <input
                  id="fromDate"
                  type="date"
                  value={tempFilters.fromDate || ""}
                  onChange={(e) =>
                    handleTempFilterChange(
                      "fromDate",
                      e.target.value || undefined
                    )
                  }
                  className="w-full bg-dark-600 border border-dark-400 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500 pr-10"
                />
                <Calendar className="absolute right-3 top-2.5 text-gray-400 h-5 w-5" />
              </div>
            </div>

            {/* Actions */}
            <div className="flex space-x-3">
              <button
                onClick={handleResetFilter}
                className="flex-1 py-2 border border-dark-400 rounded-md text-white hover:bg-dark-400 transition-colors"
              >
                Reset
              </button>
              <button
                onClick={handleApplyFilter}
                className="flex-1 py-2 bg-primary-500 rounded-md text-white hover:bg-primary-600 transition-colors"
              >
                Apply Filters
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FilterBar;
