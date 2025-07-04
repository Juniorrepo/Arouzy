import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Edit,
  Trash2,
  Lock,
  Globe,
  Calendar,
  User,
  Heart,
  Eye,
  Image,
  Video,
} from "lucide-react";
import { collectionService, Collection } from "../services/api";
import {
  getThumbnailUrl,
  isImageUrl,
  getFallbackGradient,
} from "../utils/imageUtils";
import { ContentItem } from "./Home";

const CollectionDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [collection, setCollection] = useState<Collection | null>(null);
  const [content, setContent] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCollection, setEditingCollection] = useState({
    name: "",
    description: "",
    isPublic: false,
  });

  useEffect(() => {
    if (id) {
      loadCollectionDetails();
    }
  }, [id]);

  const loadCollectionDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      // First try to get the collection details
      const collectionResponse = await collectionService.getCollectionById(
        parseInt(id!)
      );
      setCollection(collectionResponse.data);

      // Then try to get the content
      try {
        const contentResponse = await collectionService.getCollectionContent(
          parseInt(id!)
        );
        setContent(contentResponse.data);
      } catch (contentErr) {
        console.error("Failed to load collection content:", contentErr);
        // If content fails to load, we still have the collection info
        setContent([]);
      }
    } catch (err) {
      console.error("Failed to load collection details:", err);
      setError("Collection not found or you don't have permission to view it");
    } finally {
      setLoading(false);
    }
  };

  const handleEditCollection = async () => {
    if (!collection || !editingCollection.name.trim()) return;

    try {
      await collectionService.updateCollection(
        collection.id,
        editingCollection
      );
      setCollection((prev) =>
        prev ? { ...prev, ...editingCollection } : null
      );
      setShowEditModal(false);
      setEditingCollection({ name: "", description: "", isPublic: false });

      // Show success feedback
      const toast = document.createElement("div");
      toast.className =
        "fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded shadow-lg z-50";
      toast.textContent = "Collection updated successfully!";
      document.body.appendChild(toast);
      setTimeout(() => document.body.removeChild(toast), 3000);
    } catch (error) {
      console.error("Failed to update collection:", error);
      setError("Failed to update collection");
    }
  };

  const handleDeleteCollection = async () => {
    if (!collection) return;

    if (
      !confirm(
        `Are you sure you want to delete "${collection.name}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      await collectionService.deleteCollection(collection.id);
      navigate("/profile");

      // Show success feedback
      const toast = document.createElement("div");
      toast.className =
        "fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded shadow-lg z-50";
      toast.textContent = "Collection deleted successfully!";
      document.body.appendChild(toast);
      setTimeout(() => document.body.removeChild(toast), 3000);
    } catch (error) {
      console.error("Failed to delete collection:", error);
      setError("Failed to delete collection");
    }
  };

  const handleRemoveFromCollection = async (contentId: number) => {
    if (!collection) return;

    try {
      await collectionService.removeFromCollection(collection.id, contentId);
      setContent((prev) => prev.filter((item) => item.id !== contentId));

      // Show success feedback
      const toast = document.createElement("div");
      toast.className =
        "fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded shadow-lg z-50";
      toast.textContent = "Content removed from collection!";
      document.body.appendChild(toast);
      setTimeout(() => document.body.removeChild(toast), 3000);
    } catch (error) {
      console.error("Failed to remove from collection:", error);
      setError("Failed to remove from collection");
    }
  };

  const openEditModal = () => {
    if (!collection) return;

    setEditingCollection({
      name: collection.name,
      description: collection.description || "",
      isPublic: collection.isPublic,
    });
    setShowEditModal(true);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
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

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-700 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !collection) {
    return (
      <div className="min-h-screen bg-dark-700 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">
            Collection Not Found
          </h1>
          <p className="text-gray-400 mb-6">
            {error || "The collection you are looking for does not exist."}
          </p>
          <Link
            to="/profile"
            className="inline-flex items-center px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Profile
          </Link>
        </div>
      </div>
    );
  }

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
                onClick={openEditModal}
                className="flex items-center text-gray-400 hover:text-white transition-colors"
              >
                <Edit className="w-5 h-5 mr-2" />
                Edit
              </button>
              <button
                onClick={handleDeleteCollection}
                className="flex items-center text-red-400 hover:text-red-300 transition-colors"
              >
                <Trash2 className="w-5 h-5 mr-2" />
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Collection Info */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-dark-800 rounded-xl p-6 mb-8">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <h1 className="text-3xl font-bold text-white">
                  {collection.name}
                </h1>
                {collection.isPublic ? (
                  <div className="flex items-center space-x-1 text-green-500">
                    <Globe className="w-5 h-5" />
                    <span className="text-sm">Public</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-1 text-gray-500">
                    <Lock className="w-5 h-5" />
                    <span className="text-sm">Private</span>
                  </div>
                )}
              </div>

              {collection.description && (
                <p className="text-gray-300 text-lg mb-4">
                  {collection.description}
                </p>
              )}

              <div className="flex items-center space-x-6 text-sm text-gray-400">
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-2" />
                  Created {formatDate(collection.createdAt)}
                </div>
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-2" />
                  Updated {formatRelativeTime(collection.updatedAt)}
                </div>
                <div className="flex items-center">
                  <Eye className="w-4 h-4 mr-2" />
                  {content?.length} item{content?.length !== 1 ? "s" : ""}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Grid */}
        {content?.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <p className="text-lg mb-2">No content in this collection yet</p>
              <p className="text-sm">
                Start browsing content and save items to this collection
              </p>
            </div>
            <Link
              to="/"
              className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
            >
              Browse Content
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {content?.map((item) => (
              <div
                key={item.id}
                className="bg-dark-800 rounded-xl overflow-hidden hover:shadow-lg transition-shadow group"
              >
                {/* Thumbnail */}
                <div className="relative aspect-video">
                  <Link to={`/content/${item.id}`}>
                    {isImageUrl(item.thumbnail) ? (
                      <img
                        src={getThumbnailUrl(item.thumbnail)}
                        alt={item.title}
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
                        style={{ background: item.thumbnail }}
                      />
                    )}
                  </Link>

                  {/* Media Count Overlay */}
                  <div className="absolute top-2 left-2 flex space-x-1">
                    {item.imageCount > 0 && (
                      <div className="flex items-center bg-black/70 px-2 py-1 rounded-full text-white text-xs">
                        <Image className="w-3 h-3 mr-1" />
                        {item.imageCount}
                      </div>
                    )}
                    {item.videoCount > 0 && (
                      <div className="flex items-center bg-black/70 px-2 py-1 rounded-full text-white text-xs">
                        <Video className="w-3 h-3 mr-1" />
                        {item.videoCount}
                      </div>
                    )}
                  </div>

                  {/* Remove Button */}
                  <button
                    onClick={() => handleRemoveFromCollection(item.id)}
                    className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>

                {/* Content Info */}
                <div className="p-4">
                  <Link to={`/content/${item.id}`}>
                    <h3 className="text-white font-semibold mb-2 line-clamp-2 hover:text-primary-400 transition-colors">
                      {item.title}
                    </h3>
                  </Link>

                  {item.description && (
                    <p className="text-gray-400 text-sm mb-3 line-clamp-2">
                      {item.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <Link
                      to={`/profile/${item.user?.username}`}
                      className="flex items-center hover:text-primary-400 transition-colors"
                    >
                      <User className="w-3 h-3 mr-1" />
                      {item.user?.username}
                    </Link>
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center">
                        <Heart className="w-3 h-3 mr-1" />
                        {item.upvotes}
                      </div>
                      <div className="flex items-center">
                        <Calendar className="w-3 h-3 mr-1" />
                        {formatRelativeTime(item.createdAt)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Collection Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-lg max-w-md w-full">
            <div className="p-6">
              <h3 className="text-xl font-semibold text-white mb-4">
                Edit Collection
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Collection Name *
                  </label>
                  <input
                    type="text"
                    value={editingCollection.name}
                    onChange={(e) =>
                      setEditingCollection((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Enter collection name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea
                    value={editingCollection.description}
                    onChange={(e) =>
                      setEditingCollection((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Enter description (optional)"
                    rows={3}
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="editIsPublic"
                    checked={editingCollection.isPublic}
                    onChange={(e) =>
                      setEditingCollection((prev) => ({
                        ...prev,
                        isPublic: e.target.checked,
                      }))
                    }
                    className="mr-2"
                  />
                  <label
                    htmlFor="editIsPublic"
                    className="text-sm text-gray-300"
                  >
                    Make collection public
                  </label>
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={handleEditCollection}
                  disabled={!editingCollection.name.trim()}
                  className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  Update Collection
                </button>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CollectionDetail;
