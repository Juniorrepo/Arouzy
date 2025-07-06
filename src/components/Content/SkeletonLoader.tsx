import React from "react";

interface SkeletonLoaderProps {
  count?: number;
  className?: string;
}

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  count = 3,
  className = "",
}) => {
  return (
    <div className={className}>
      {[...Array(count)].map((_, index) => (
        <div
          key={index}
          className="flex items-start space-x-3 p-3 animate-pulse"
        >
          {/* Skeleton thumbnail */}
          <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-dark-600"></div>

          {/* Skeleton content */}
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-dark-600 rounded w-3/4"></div>
            <div className="h-3 bg-dark-600 rounded w-1/2"></div>
            <div className="flex space-x-4">
              <div className="h-3 bg-dark-600 rounded w-16"></div>
              <div className="h-3 bg-dark-600 rounded w-12"></div>
              <div className="h-3 bg-dark-600 rounded w-10"></div>
            </div>
            <div className="flex space-x-2">
              <div className="h-3 bg-dark-600 rounded w-20"></div>
              <div className="h-3 bg-dark-600 rounded w-16"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default SkeletonLoader;
