import React, { useState, useEffect } from 'react';
import ContentGrid from '../components/Content/ContentGrid';
import FilterBar from '../components/Content/FilterBar';
import Pagination from '../components/Content/Pagination';
import { contentService } from '../services/api';

// Types
export interface ContentItem {
  id: number;
  title: string;
  imageCount: number;
  videoCount: number;
  thumbnail: string;
  createdAt: string;
  upvotes: number;
}

// Sort types
type SortOption = 'hot' | 'top' | 'new' | 'shuffle';

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
  const [totalPages, setTotalPages] = useState(5); // Default to 5 until we get actual data
  const [activeSort, setActiveSort] = useState<SortOption>('hot');
  const [filters, setFilters] = useState<Filters>({});

  useEffect(() => {
    fetchContent();
  }, [currentPage, activeSort, filters]);

  const fetchContent = async () => {
    setIsLoading(true);
    try {
      // In a real app, this would be an API call
      // const response = await contentService.getContent(currentPage, activeSort, filters);
      // setContent(response.data.content);
      // setTotalPages(response.data.totalPages);
      
      // Mock data for demonstration
      const mockData = generateMockData(20);
      setTimeout(() => {
        setContent(mockData);
        setIsLoading(false);
      }, 500);
    } catch (error) {
      console.error('Error fetching content:', error);
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
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Generate mock data for demonstration
  const generateMockData = (count: number): ContentItem[] => {
    const gradients = [
      'linear-gradient(135deg, #ff9a9e 0%, #fad0c4 100%)',
      'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
      'linear-gradient(135deg, #fad0c4 0%, #f5576c 100%)',
      'linear-gradient(135deg, #fbc2eb 0%, #a6c1ee 100%)',
      'linear-gradient(135deg, #d4fc79 0%, #96e6a1 100%)',
      'linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)',
      'linear-gradient(135deg, #a6c0fe 0%, #f68084 100%)',
      'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    ];
    
    return Array.from({ length: count }, (_, i) => ({
      id: i + 1,
      title: 'Content title this is the content title this is the content',
      imageCount: 10,
      videoCount: Math.floor(Math.random() * 6),
      thumbnail: gradients[i % gradients.length],
      createdAt: new Date(Date.now() - Math.random() * 1000 * 60 * 60 * 24 * 30).toISOString(),
      upvotes: Math.floor(Math.random() * 1000),
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
      
      {isLoading ? (
        <div className="mt-8 flex justify-center">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <>
          <ContentGrid content={content} />
          <Pagination 
            currentPage={currentPage} 
            totalPages={totalPages} 
            onPageChange={handlePageChange} 
          />
        </>
      )}
    </div>
  );
};

export default Home;