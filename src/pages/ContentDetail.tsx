import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  Heart,
  Share2,
  Calendar,
  User,
  Tag,
  Image,
  Video,
  Clock,
  Eye,
  MessageCircle,
  LayoutGrid,
  List as ListIcon,
} from "lucide-react";
import { contentService } from "../services/api";
import {
  getThumbnailUrl,
  isImageUrl,
  getFallbackGradient,
} from "../utils/imageUtils";
import SaveButton from "../components/Content/SaveButton";

interface ContentDetail {
  id: number;
  title: string;
  description: string;
  imageCount: number;
  videoCount: number;
  thumbnail: string;
  createdAt: string;
  upvotes: number;
  user: {
    id: number;
    username: string;
    email: string;
  };
  tags: Array<{
    id: number;
    name: string;
  }>;
  images?: Array<{
    id: number;
    imageUrl: string;
    imageOrder: number;
  }>;
}

const ContentDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [content, setContent] = useState<ContentDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpvoted, setIsUpvoted] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");

  useEffect(() => {
    if (id) {
      fetchContentDetail();
    }
  }, [id]);

  useEffect(() => {
    if (content && content.images && content.images.length > 1) {
      setViewMode("grid");
    } else {
      setViewMode("list");
    }
  }, [content]);

  const fetchContentDetail = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await contentService.getContentById(id!);
      setContent(response.data);
    } catch (err) {
      console.error("Error fetching content:", err);
      setError("Content not found or failed to load");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpvote = async () => {
    if (!content) return;

    try {
      // TODO: Implement upvote API call
      setIsUpvoted(!isUpvoted);
      setContent((prev) =>
        prev
          ? {
              ...prev,
              upvotes: prev.upvotes + (isUpvoted ? -1 : 1),
            }
          : null
      );
    } catch (error) {
      console.error("Error upvoting:", error);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: content?.title,
        text: content?.description,
        url: window.location.href,
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      // You could add a toast notification here
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 2592000)
      return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return `${Math.floor(diffInSeconds / 2592000)}mo ago`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark-700 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !content) {
    return (
      <div className="min-h-screen bg-dark-700 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">
            Content Not Found
          </h1>
          <p className="text-gray-400 mb-6">
            {error || "The content you are looking for does not exist."}
          </p>
          <Link
            to="/"
            className="inline-flex items-center px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  const thumbnailUrl = getThumbnailUrl(content.thumbnail);
  const isImage = isImageUrl(content.thumbnail);

  return (
    <div className="min-h-screen bg-dark-700">
      {/* Header */}
      <div className="bg-dark-800 border-b border-dark-600 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back
            </button>

            <div className="flex items-center space-x-4">
              <button
                onClick={handleShare}
                className="flex items-center text-gray-400 hover:text-white transition-colors"
              >
                <Share2 className="w-5 h-5 mr-2" />
                Share
              </button>
              {content && <SaveButton contentId={content.id} />}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Media */}
          <div className="lg:col-span-2">
            {/* Grid/List Toggle */}
            <div className="flex justify-end mb-2">
              <button
                className={`p-2 rounded-full mr-2 ${
                  viewMode === "list"
                    ? "bg-dark-600 text-primary-400"
                    : "bg-dark-700 text-gray-400 hover:bg-dark-600"
                }`}
                onClick={() => setViewMode("list")}
                title="List view"
              >
                <ListIcon className="w-5 h-5" />
              </button>
              <button
                className={`p-2 rounded-full ${
                  viewMode === "grid"
                    ? "bg-dark-600 text-primary-400"
                    : "bg-dark-700 text-gray-400 hover:bg-dark-600"
                }`}
                onClick={() => setViewMode("grid")}
                title="Grid view"
              >
                <LayoutGrid className="w-5 h-5" />
              </button>
            </div>
            {/* Media Section */}
            {content.images &&
            content.images.length > 0 &&
            viewMode === "grid" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {content.images.map((img) => (
                  <div
                    key={img.id}
                    className="aspect-square bg-dark-800 rounded-xl overflow-hidden flex items-center justify-center"
                  >
                    <img
                      src={getThumbnailUrl(img.imageUrl)}
                      alt={content.title}
                      className="w-full h-full object-cover transition-transform duration-200 hover:scale-105 rounded-xl cursor-pointer"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = "none";
                        target.parentElement!.style.background =
                          getFallbackGradient();
                      }}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-dark-800 rounded-xl overflow-hidden mb-6">
                <div className="relative aspect-video">
                  {isImage ? (
                    <img
                      src={thumbnailUrl}
                      alt={content.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = "none";
                        target.parentElement!.style.background =
                          getFallbackGradient();
                      }}
                    />
                  ) : (
                    <div
                      className="w-full h-full"
                      style={{ background: content.thumbnail }}
                    />
                  )}
                  {/* Media Count Overlay */}
                  <div className="absolute top-4 left-4 flex space-x-2">
                    {content.imageCount > 0 && (
                      <div className="flex items-center bg-black/70 px-3 py-1.5 rounded-full text-white text-sm">
                        <Image className="w-4 h-4 mr-1" />
                        {content.imageCount} images
                      </div>
                    )}
                    {content.videoCount > 0 && (
                      <div className="flex items-center bg-black/70 px-3 py-1.5 rounded-full text-white text-sm">
                        <Video className="w-4 h-4 mr-1" />
                        {content.videoCount} videos
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
            {/* Action Buttons */}
            <div className="flex items-center justify-between mb-6 mt-3">
              <div className="flex items-center space-x-4">
                <button
                  onClick={handleUpvote}
                  className={`flex items-center px-4 py-2 rounded-full transition-colors ${
                    isUpvoted
                      ? "bg-red-500 text-white"
                      : "bg-dark-600 text-gray-300 hover:bg-dark-500"
                  }`}
                >
                  <Heart
                    className={`w-5 h-5 mr-2 ${
                      isUpvoted ? "fill-current" : ""
                    }`}
                  />
                  {content.upvotes}
                </button>

                <button className="flex items-center px-4 py-2 bg-dark-600 text-gray-300 rounded-full hover:bg-dark-500 transition-colors">
                  <MessageCircle className="w-5 h-5 mr-2" />
                  Comment
                </button>
              </div>
            </div>
          </div>

          {/* Right Column - Info */}
          <div className="lg:col-span-1">
            <div className="bg-dark-800 rounded-xl p-6 sticky top-24">
              {/* Title */}
              <h1 className="text-2xl font-bold text-white mb-4 leading-tight">
                {content.title}
              </h1>

              {/* Description */}
              {content.description && (
                <p className="text-gray-300 mb-6 leading-relaxed">
                  {content.description}
                </p>
              )}

              {/* Meta Information */}
              <div className="space-y-4 mb-6">
                {/* Author */}
                <div className="flex items-center text-gray-400">
                  <User className="w-4 h-4 mr-2" />
                  <span className="text-sm">
                    by{" "}
                    <Link
                      to={`/profile/${content.user.username}`}
                      className="text-primary-400 hover:text-primary-300 transition-colors"
                    >
                      {content.user.username}
                    </Link>
                  </span>
                </div>

                {/* Date */}
                <div className="flex items-center text-gray-400">
                  <Calendar className="w-4 h-4 mr-2" />
                  <span className="text-sm">
                    {formatDate(content.createdAt)}
                  </span>
                </div>

                {/* Relative Time */}
                <div className="flex items-center text-gray-400">
                  <Clock className="w-4 h-4 mr-2" />
                  <span className="text-sm">
                    {formatRelativeTime(content.createdAt)}
                  </span>
                </div>

                {/* Views (placeholder) */}
                <div className="flex items-center text-gray-400">
                  <Eye className="w-4 h-4 mr-2" />
                  <span className="text-sm">1.2k views</span>
                </div>
              </div>

              {/* Tags */}
              {content.tags && content.tags.length > 0 && (
                <div className="mb-6">
                  <div className="flex items-center text-gray-400 mb-3">
                    <Tag className="w-4 h-4 mr-2" />
                    <span className="text-sm font-medium">Tags</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {content.tags.map((tag) => (
                      <Link
                        key={tag.id}
                        to={`/?tags=${tag.name}`}
                        className="px-3 py-1 bg-dark-600 text-gray-300 rounded-full text-sm hover:bg-dark-500 transition-colors"
                      >
                        #{tag.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Stats */}
              <div className="border-t border-dark-600 pt-4">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-white">
                      {content.upvotes}
                    </div>
                    <div className="text-xs text-gray-400">Upvotes</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-white">
                      {content.imageCount + content.videoCount}
                    </div>
                    <div className="text-xs text-gray-400">Media Files</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContentDetail;
