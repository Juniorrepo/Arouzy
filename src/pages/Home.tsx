import React, { useState, useEffect } from "react";
import { Search } from "lucide-react";
import ContentGrid from "../components/Content/ContentGrid";
import FilterBar from "../components/Content/FilterBar";
import Pagination from "../components/Content/Pagination";
import { contentService } from "../services/api";
import { useSearch } from "../contexts/SearchContext";

// Types
export interface ContentItem {
  id: number;
  title: string;
  description?: string;
  imageCount: number;
  videoCount: number;
  thumbnail: string;
  createdAt: string;
  upvotes: number;
  user?: {
    id: number;
    username: string;
  };
  tags?: Array<{
    id: number;
    name: string;
  }>;
}

// Sort types
type SortOption = "hot" | "top" | "new" | "shuffle";

// Filter types
interface Filters {
  tags?: string[];
  minUpvotes?: number;
  fromDate?: string;
}

const Home: React.FC = () => {
  const [content, setContent] = useState<ContentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [activeSort, setActiveSort] = useState<SortOption>("hot");
  const [filters, setFilters] = useState<Filters>({});
  const { searchQuery, searchResults, isSearching } = useSearch();

  useEffect(() => {
    if (searchQuery.trim()) {
      // Use search results when there's a search query
      setContent(searchResults);
      setTotalPages(1); // Search results don't have pagination for now
    } else {
      // Fetch regular content when no search query
      fetchContent();
    }
  }, [currentPage, activeSort, filters, searchQuery, searchResults]);

  const fetchContent = async () => {
    setIsLoading(true);
    try {
      const response = await contentService.getContent(
        currentPage,
        activeSort,
        filters
      );
      setContent(response.data.content);
      setTotalPages(response.data.pagination.totalPages);
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching content:", error);
      // Fallback to mock data if API fails
      const mockData = generateMockData(20);
      setContent(mockData);
      setTotalPages(5);
      setIsLoading(false);
    }
  };

  const handleSortChange = (sort: SortOption) => {
    setActiveSort(sort);
    setCurrentPage(1); // Reset to first page when sort changes
  };

  const handleFilterChange = (newFilters: Filters) => {
    setFilters(newFilters);
    setCurrentPage(1); // Reset to first page when filters change
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Generate mock data for demonstration (fallback)
  const generateMockData = (count: number): ContentItem[] => {
    const gradients = [
      "linear-gradient(135deg, #ff9a9e 0%, #fad0c4 100%)",
      "linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)",
      "linear-gradient(135deg, #fad0c4 0%, #f5576c 100%)",
      "linear-gradient(135deg, #fbc2eb 0%, #a6c1ee 100%)",
      "linear-gradient(135deg, #d4fc79 0%, #96e6a1 100%)",
      "linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)",
      "linear-gradient(135deg, #a6c0fe 0%, #f68084 100%)",
      "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
    ];

    const titles = [
      "Amazing Sunset Photography",
      "Urban Street Art Collection",
      "Nature Wildlife Documentary",
      "Modern Architecture Design",
      "Vintage Car Restoration",
      "Cooking Masterclass Series",
      "Travel Adventure Vlog",
      "Music Production Tutorial",
      "Fitness Workout Guide",
      "Art Painting Techniques",
    ];

    const descriptions = [
      "Beautiful sunset photography from around the world",
      "Street art collection featuring urban artists",
      "Wildlife documentary showcasing nature's beauty",
      "Modern architectural designs and concepts",
      "Vintage car restoration process and results",
      "Cooking masterclass with professional chefs",
      "Travel adventures and exploration videos",
      "Music production tutorials and tips",
      "Fitness workout guides for all levels",
      "Art painting techniques and tutorials",
    ];

    const tags = [
      [
        { id: 1, name: "photography" },
        { id: 2, name: "nature" },
      ],
      [
        { id: 3, name: "art" },
        { id: 4, name: "urban" },
      ],
      [
        { id: 5, name: "wildlife" },
        { id: 6, name: "documentary" },
      ],
      [
        { id: 7, name: "architecture" },
        { id: 8, name: "design" },
      ],
      [
        { id: 9, name: "vintage" },
        { id: 10, name: "cars" },
      ],
      [
        { id: 11, name: "cooking" },
        { id: 12, name: "food" },
      ],
      [
        { id: 13, name: "travel" },
        { id: 14, name: "adventure" },
      ],
      [
        { id: 15, name: "music" },
        { id: 16, name: "tutorial" },
      ],
      [
        { id: 17, name: "fitness" },
        { id: 18, name: "workout" },
      ],
      [
        { id: 19, name: "art" },
        { id: 20, name: "painting" },
      ],
    ];

    const usernames = [
      "alice",
      "bob",
      "charlie",
      "diana",
      "edward",
      "fiona",
      "george",
      "helen",
      "ivan",
      "julia",
    ];

    return Array.from({ length: count }, (_, i) => ({
      id: i + 1,
      title: titles[i % titles.length],
      description: descriptions[i % descriptions.length],
      imageCount: Math.floor(Math.random() * 20) + 5,
      videoCount: Math.floor(Math.random() * 6),
      thumbnail: gradients[i % gradients.length],
      createdAt: new Date(
        Date.now() - Math.random() * 1000 * 60 * 60 * 24 * 30
      ).toISOString(),
      upvotes: Math.floor(Math.random() * 1000),
      user: {
        id: i + 1,
        username: usernames[i % usernames.length],
      },
      tags: tags[i % tags.length],
    }));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <FilterBar
        activeSort={activeSort}
        onSortChange={handleSortChange}
        filters={filters}
        onFilterChange={handleFilterChange}
      />

      {/* Search Results Indicator */}
      {isSearching && (
        <div className="mt-4 mb-6 p-4 bg-dark-800 rounded-lg border border-dark-600">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Search className="h-5 w-5 text-primary-400" />
              <span className="text-white font-medium">
                Search results for "{searchQuery}"
              </span>
              <span className="text-gray-400">
                ({content.length} {content.length === 1 ? "result" : "results"})
              </span>
            </div>
            {content.length === 0 && (
              <span className="text-gray-400 text-sm">
                No content found matching your search
              </span>
            )}
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="mt-8 flex justify-center">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <>
          <ContentGrid content={content} />
          {!isSearching && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          )}
        </>
      )}
    </div>
  );
};

export default Home;
