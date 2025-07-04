import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  Lock,
  Globe,
  Calendar,
  MoreVertical,
} from "lucide-react";
import { collectionService, Collection } from "../services/api";
import Swal from "sweetalert2";

interface CollectionsProps {
  isOwnProfile?: boolean;
}

const Collections: React.FC<CollectionsProps> = ({ isOwnProfile = false }) => {
  const { username } = useParams<{ username: string }>();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCollection, setSelectedCollection] =
    useState<Collection | null>(null);
  const [newCollection, setNewCollection] = useState({
    name: "",
    description: "",
    isPublic: false,
  });
  const [editingCollection, setEditingCollection] = useState({
    name: "",
    description: "",
    isPublic: false,
  });

  useEffect(() => {
    loadCollections();
  }, [username, isOwnProfile]);

  const loadCollections = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log("Loading collections...", { isOwnProfile, username });

      let response;
      if (isOwnProfile) {
        console.log("Calling listMyCollections...");
        response = await collectionService.listMyCollections();
        console.log("My collections response:", response);
      } else {
        if (!username) {
          setError("Username is required");
          return;
        }
        console.log("Calling listPublicCollections for username:", username);
        response = await collectionService.listPublicCollections(username);
      }

      console.log("Setting collections:", response.data);
      console.log("Response structure:", {
        data: response.data,
        type: typeof response.data,
        isArray: Array.isArray(response.data),
      });
      setCollections(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error("Failed to load collections:", err);
      setError("Failed to load collections");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCollection = async () => {
    if (!newCollection.name.trim()) return;

    try {
      const response = await collectionService.createCollection(newCollection);
      console.log("Create collection response:", response);
      console.log("Response data:", response.data);
      setCollections((prev) => [
        response.data,
        ...(Array.isArray(prev) ? prev : []),
      ]);
      setShowCreateModal(false);
      setNewCollection({ name: "", description: "", isPublic: false });
      Swal.fire({
        title: "Success!",
        text: "Collection created successfully!",
        icon: "success",
        timer: 2000,
        showConfirmButton: false,
        position: "center",
      });
    } catch (error) {
      console.error("Failed to create collection:", error);
      setError("Failed to create collection");
    }
  };

  const handleEditCollection = async () => {
    if (!selectedCollection || !editingCollection.name.trim()) return;

    try {
      await collectionService.updateCollection(
        selectedCollection.id,
        editingCollection
      );
      setCollections((prev) =>
        (Array.isArray(prev) ? prev : []).map((c) =>
          c.id === selectedCollection.id ? { ...c, ...editingCollection } : c
        )
      );
      setShowEditModal(false);
      setSelectedCollection(null);
      setEditingCollection({ name: "", description: "", isPublic: false });
      Swal.fire({
        title: "Success!",
        text: "Collection updated successfully!",
        icon: "success",
        timer: 2000,
        showConfirmButton: false,
        position: "center",
      });
    } catch (error) {
      console.error("Failed to update collection:", error);
      setError("Failed to update collection");
    }
  };

  const handleDeleteCollection = async (collection: Collection) => {
    Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await collectionService.deleteCollection(collection.id);
          setCollections((prev) =>
            (Array.isArray(prev) ? prev : []).filter(
              (c) => c.id !== collection.id
            )
          );
          Swal.fire({
            title: "Deleted!",
            text: "Your file has been deleted.",
            icon: "success",
            position: "center",
            timer: 2000,
            showConfirmButton: false,
          });
        } catch (error) {
          console.error("Failed to delete collection:", error);
          setError("Failed to delete collection");
        }
      }
    });
  };

  const openEditModal = (collection: Collection) => {
    setSelectedCollection(collection);
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
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-700 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-dark-700 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Error</h1>
          <p className="text-gray-400 mb-6">{error}</p>
          <button
            onClick={loadCollections}
            className="px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-700">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              {isOwnProfile
                ? "My Collections"
                : `${username || "User"}'s Collections`}
            </h1>
            <p className="text-gray-400">
              {collections?.length} collection
              {collections?.length !== 1 ? "s" : ""}
            </p>
          </div>

          {isOwnProfile && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span>Create Collection</span>
            </button>
          )}
        </div>

        {/* Collections Grid */}
        {collections?.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              {isOwnProfile ? (
                <>
                  <p className="text-lg mb-2">No collections yet</p>
                  <p className="text-sm">
                    Create your first collection to start organizing content
                  </p>
                </>
              ) : (
                <p className="text-lg">No public collections found</p>
              )}
            </div>
            {isOwnProfile && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
              >
                Create Your First Collection
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {collections?.map((collection) => (
              <div
                key={collection.id}
                className="bg-dark-800 rounded-xl overflow-hidden hover:shadow-lg transition-shadow"
              >
                {/* Collection Header */}
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="text-xl font-semibold text-white truncate">
                          {collection.name}
                        </h3>
                        {collection.isPublic ? (
                          <Globe className="w-4 h-4 text-green-500" />
                        ) : (
                          <Lock className="w-4 h-4 text-gray-500" />
                        )}
                      </div>
                      {collection.description && (
                        <p className="text-gray-400 text-sm mb-3 line-clamp-2">
                          {collection.description}
                        </p>
                      )}
                    </div>

                    {isOwnProfile && (
                      <div className="relative">
                        <button
                          onClick={() => openEditModal(collection)}
                          className="p-1 text-gray-400 hover:text-white transition-colors"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Collection Stats */}
                  <div className="flex items-center justify-between text-sm text-gray-400 mb-4">
                    <span>
                      {collection.contentCount} item
                      {collection.contentCount !== 1 ? "s" : ""}
                    </span>
                    <div className="flex items-center">
                      <Calendar className="w-3 h-3 mr-1" />
                      {formatDate(collection.updatedAt)}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex space-x-2">
                    <Link
                      to={`/collections/${collection.id}`}
                      className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors text-sm"
                    >
                      <Eye className="w-4 h-4" />
                      <span>View</span>
                    </Link>

                    {isOwnProfile && (
                      <>
                        <button
                          onClick={() => openEditModal(collection)}
                          className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteCollection(collection)}
                          className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Collection Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-lg max-w-md w-full">
            <div className="p-6">
              <h3 className="text-xl font-semibold text-white mb-4">
                Create New Collection
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Collection Name *
                  </label>
                  <input
                    type="text"
                    value={newCollection.name}
                    onChange={(e) =>
                      setNewCollection((prev) => ({
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
                    value={newCollection.description}
                    onChange={(e) =>
                      setNewCollection((prev) => ({
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
                    id="isPublic"
                    checked={newCollection.isPublic}
                    onChange={(e) =>
                      setNewCollection((prev) => ({
                        ...prev,
                        isPublic: e.target.checked,
                      }))
                    }
                    className="mr-2"
                  />
                  <label htmlFor="isPublic" className="text-sm text-gray-300">
                    Make collection public
                  </label>
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={handleCreateCollection}
                  disabled={!newCollection.name.trim()}
                  className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  Create Collection
                </button>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Collection Modal */}
      {showEditModal && selectedCollection && (
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

export default Collections;
