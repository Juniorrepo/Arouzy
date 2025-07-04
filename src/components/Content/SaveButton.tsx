import React, { useState, useEffect } from "react";
import { Bookmark, Plus } from "lucide-react";
import { collectionService, Collection } from "../../services/api";
import toast from "react-hot-toast";

interface SaveButtonProps {
  contentId: number;
  className?: string;
}

const SaveButton: React.FC<SaveButtonProps> = ({
  contentId,
  className = "",
}) => {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [showCreateForm, setShowCreateForm] = useState<boolean>(false);
  const [newCollection, setNewCollection] = useState({
    name: "",
    description: "",
    isPublic: false,
  });

  useEffect(() => {
    if (showModal) {
      loadCollections();
    }
  }, [showModal]);

  const loadCollections = async () => {
    try {
      setLoading(true);
      const response = await collectionService.listMyCollections();
      setCollections(response?.data ?? []);
    } catch (error) {
      console.error("Failed to load collections:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToCollection = async (collectionId: number) => {
    try {
      setSaving(true);
      await collectionService.saveToCollection(collectionId, contentId);
      setShowModal(false);
      toast.success("Saved to collection!");
    } catch (error) {
      console.error("Failed to save to collection:", error);
      toast.error("Failed to save to collection");
    } finally {
      setSaving(false);
    }
  };

  const handleCreateCollection = async () => {
    if (!newCollection.name.trim()) return;

    try {
      setSaving(true);
      const response = await collectionService.createCollection(newCollection);
      const createdCollection = response?.data;

      // Add to collections list
      setCollections((prev) => [createdCollection, ...prev]);

      // Save content to the new collection
      await collectionService.saveToCollection(
        createdCollection?.id,
        contentId
      );

      setShowCreateForm(false);
      setNewCollection({ name: "", description: "", isPublic: false });
      setShowModal(false);

      // Show success feedback
      const toast = document.createElement("div");
      toast.className =
        "fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded shadow-lg z-50";
      toast.textContent = "Collection created and content saved!";
      document.body.appendChild(toast);
      setTimeout(() => document.body.removeChild(toast), 3000);
    } catch (error) {
      console.error("Failed to create collection:", error);
      // Show error feedback
      const toast = document.createElement("div");
      toast.className =
        "fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded shadow-lg z-50";
      toast.textContent = "Failed to create collection";
      document.body.appendChild(toast);
      setTimeout(() => document.body.removeChild(toast), 3000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className={`flex items-center space-x-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors ${className}`}
      >
        <Bookmark className="w-5 h-5" />
        <span>Save</span>
      </button>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-lg max-w-md w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-white">
                  Save to Collection
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              {showCreateForm ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Collection Name *
                    </label>
                    <input
                      type="text"
                      value={newCollection?.name}
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
                      value={newCollection?.description}
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
                      checked={newCollection?.isPublic}
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

                  <div className="flex space-x-3 pt-4">
                    <button
                      onClick={handleCreateCollection}
                      disabled={saving || !newCollection?.name?.trim()}
                      className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-600 text-white rounded-lg transition-colors"
                    >
                      {saving ? "Creating..." : "Create & Save"}
                    </button>
                    <button
                      onClick={() => setShowCreateForm(false)}
                      className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Create New Collection Button */}
                  <button
                    onClick={() => setShowCreateForm(true)}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors border border-gray-700"
                  >
                    <Plus className="w-5 h-5" />
                    <span>Create New Collection</span>
                  </button>

                  <div className="border-t border-gray-700 pt-4">
                    <h4 className="text-sm font-medium text-gray-300 mb-3">
                      Your Collections
                    </h4>

                    {loading ? (
                      <div className="text-center py-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500 mx-auto"></div>
                      </div>
                    ) : collections?.length === 0 ? (
                      <div className="text-center py-4 text-gray-400">
                        <p>No collections yet</p>
                        <p className="text-sm">
                          Create your first collection above
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {collections?.map((collection) => (
                          <button
                            key={collection?.id}
                            onClick={() =>
                              handleSaveToCollection(collection?.id)
                            }
                            disabled={saving}
                            className="w-full flex items-center justify-between p-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors text-left"
                          >
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <span className="font-medium text-white">
                                  {collection?.name}
                                </span>
                                {collection?.isPublic && (
                                  <span className="text-xs bg-green-600 text-white px-2 py-1 rounded">
                                    Public
                                  </span>
                                )}
                              </div>
                              {collection?.description && (
                                <p className="text-sm text-gray-400 mt-1">
                                  {collection?.description}
                                </p>
                              )}
                              <p className="text-xs text-gray-500 mt-1">
                                {collection?.contentCount} item
                                {collection?.contentCount !== 1 ? "s" : ""}
                              </p>
                            </div>
                            {saving && (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-500"></div>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SaveButton;
