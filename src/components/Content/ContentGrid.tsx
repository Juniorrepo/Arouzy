import React from "react";
import { Link } from "react-router-dom";
import Masonry from "react-masonry-css";
import { ContentItem } from "../../pages/Home";
import { Image, Film } from "lucide-react";
import {
  getThumbnailUrl,
  isImageUrl,
  // getFallbackGradient,
} from "../../utils/imageUtils";

interface ContentGridProps {
  content: ContentItem[];
}

const ContentGrid: React.FC<ContentGridProps> = ({ content }) => {
  const breakpointColumns = {
    default: 4,
    1280: 3,
    1024: 3,
    768: 2,
    640: 1,
  };

  // Helper function to get a random height for masonry effect
  const getRandomHeight = () => {
    const heights = [220, 280, 340, 400];
    return heights[Math.floor(Math.random() * heights.length)];
  };

  return (
    <Masonry
      breakpointCols={breakpointColumns}
      className="masonry-grid mt-6"
      columnClassName="masonry-grid-column"
    >
      {content.map((item) => {
        const height = getRandomHeight();
        const thumbnailUrl = getThumbnailUrl(item.thumbnail);
        const isImage = isImageUrl(item.thumbnail);

        return (
          <div key={item.id} className="mb-4 animate-fade-in">
            <Link
              to={`/content/${item.id}`}
              onClick={() => window.scrollTo(0, 0)}
            >
              <div className="group content-card overflow-hidden">
                {/* Content Preview */}
                <div
                  className="w-full relative overflow-hidden transition-transform duration-300 group-hover:scale-105"
                  style={{
                    height: `${height}px`,
                    background: isImage ? "none" : item.thumbnail, // Use gradient as background if not image
                  }}
                >
                  {/* Image Thumbnail */}
                  {isImage && (
                    <img
                      src={thumbnailUrl}
                      alt={item.title}
                      className="w-full h-full object-cover"
                      // onError={(e) => {
                      //   const target = e.target as HTMLImageElement;
                      //   target.style.display = "none";
                      //   target.parentElement!.style.background =
                      //     getFallbackGradient();
                      // }}
                    />
                  )}

                  {/* Media Count Indicator */}
                  <div className="absolute top-2 left-2 flex space-x-2 text-white">
                    {item.imageCount > 0 && (
                      <div className="flex items-center bg-black/50 px-1.5 py-0.5 rounded-md text-xs">
                        <span>{item.imageCount}</span>
                        <Image className="h-4 w-4 ml-1" />
                      </div>
                    )}
                    {item.videoCount > 0 && (
                      <div className="flex items-center bg-black/50 px-1.5 py-0.5 rounded-md text-xs">
                        <span>{item.videoCount}</span>
                        <Film className="h-4 w-4 ml-1" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Content Info */}
                <div className="p-3 bg-dark-600">
                  <p className="text-sm line-clamp-2 font-medium">
                    {item.title}
                  </p>
                </div>
              </div>
            </Link>
          </div>
        );
      })}
    </Masonry>
  );
};

export default ContentGrid;
