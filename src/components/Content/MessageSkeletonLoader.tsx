import React from "react";

interface MessageSkeletonLoaderProps {
  count?: number;
  className?: string;
}

const MessageSkeletonLoader: React.FC<MessageSkeletonLoaderProps> = ({
  count = 3,
  className = "",
}) => {
  return (
    <div className={className}>
      {[...Array(count)].map((_, index) => (
        <div
          key={index}
          className={`mb-2 flex ${
            index % 2 === 0 ? "justify-end" : "justify-start"
          }`}
        >
          <div className="px-4 py-2 rounded-lg max-w-xs animate-pulse">
            {/* Skeleton for attachment */}
            {index % 3 === 0 && (
              <div className="mb-2">
                <div className="w-48 h-32 bg-dark-600 rounded-lg"></div>
              </div>
            )}
            {/* Skeleton for message text */}
            <div className="space-y-1">
              <div className="h-4 bg-dark-600 rounded w-32"></div>
              {index % 2 === 0 && (
                <div className="h-3 bg-dark-600 rounded w-24"></div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default MessageSkeletonLoader;
