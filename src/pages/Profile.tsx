import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import ContentGrid from "../components/Content/ContentGrid";
import Pagination from "../components/Content/Pagination";
import {
  contentService,
  userService,
  collectionService,
  Collection,
} from "../services/api";
import { useAuth } from "../contexts/AuthContext";

interface ContentItem {
  id: number;
  title: string;
  imageCount: number;
  videoCount: number;
  thumbnail: string;
  createdAt: string;
  upvotes: number;
}

interface UserProfile {
  user: {
    id: number;
    username: string;
    email: string;
  };
  contentCount: number;
  upvotesGiven: number;
  followerCount: number;
}

const Profile: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const { user: currentUser, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [activeTab, setActiveTab] = useState<"content" | "collections">(
    "content"
  );

  const [content, setContent] = useState<ContentItem[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [isLoadingContent, setIsLoadingContent] = useState(false);
  const [isLoadingCollections, setIsLoadingCollections] = useState(false);

  const [pageContent, setPageContent] = useState(1);
  const [totalPagesContent, setTotalPagesContent] = useState(1);

  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      setIsLoadingProfile(true);
      try {
        const response = await userService.getPublicUserProfile(username!);
        setProfile(response.data);

        // Check follow status if user is authenticated and not viewing their own profile
        if (currentUser && currentUser.username !== username) {
          try {
            const followStatus = await userService.checkFollowStatus(username!);
            setIsFollowing(followStatus.data.isFollowing);
          } catch (error) {
            console.error("Error checking follow status:", error);
          }
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setIsLoadingProfile(false);
      }
    };
    fetchProfile();
  }, [username, currentUser]);

  useEffect(() => {
    if (!profile) return;
    const fetchUserContent = async () => {
      setIsLoadingContent(true);
      try {
        const response = await contentService.getContentByUser(
          username!,
          pageContent,
          "hot"
        );
        setContent(response.data.content);
        setTotalPagesContent(response.data.pagination.totalPages);
      } catch (error) {
        console.error("Error fetching user content:", error);
      } finally {
        setIsLoadingContent(false);
      }
    };
    fetchUserContent();
  }, [profile, pageContent, username]);

  useEffect(() => {
    if (!profile) return;
    const fetchUserCollections = async () => {
      setIsLoadingCollections(true);
      try {
        let response;
        // Check if the logged-in user is viewing their own profile
        if (currentUser && currentUser.username === username) {
          response = await collectionService.listMyCollections();
        } else {
          response = await collectionService.listPublicCollections(username!);
        }
        setCollections(response.data);
      } catch (error) {
        console.error("Error fetching user collections:", error);
      } finally {
        setIsLoadingCollections(false);
      }
    };
    fetchUserCollections();
  }, [profile, username, currentUser]);

  const handleFollow = async () => {
    if (!profile) return;
    try {
      if (isFollowing) {
        await userService.unfollowUser(profile.user.username);
        setIsFollowing(false);
        // Update follower count
        setProfile((prev) =>
          prev
            ? {
                ...prev,
                followerCount: prev.followerCount - 1,
              }
            : null
        );
      } else {
        await userService.followUser(profile.user.username);
        setIsFollowing(true);
        // Update follower count
        setProfile((prev) =>
          prev
            ? {
                ...prev,
                followerCount: prev.followerCount + 1,
              }
            : null
        );
      }
    } catch (error) {
      console.error("Error following/unfollowing user:", error);
    }
  };

  const handleMessage = () => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    if (profile) {
      navigate(`/messages/${profile.user.id}`);
    }
  };

  if (isLoadingProfile) {
    return <div className="mt-8 flex justify-center">Loading profile...</div>;
  }

  if (!profile) {
    return <div className="mt-8 text-center">User not found</div>;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex flex-col items-center">
        <div className="w-32 h-32 rounded-full bg-gray-500 mb-4" />
        <h1 className="text-xl font-semibold text-primary-500">
          {profile.user.username}
        </h1>
        <p className="text-gray-400 mt-2">
          <Link
            to={`/profile/${profile.user.username}/followers`}
            className="hover:underline text-primary-400"
          >
            {profile.followerCount} followers
          </Link>
          &nbsp;&middot;&nbsp;
          <Link
            to={`/profile/${profile.user.username}/following`}
            className="hover:underline text-primary-400"
          >
            Following
          </Link>
          &nbsp;&middot;&nbsp;
          {profile.upvotesGiven} likes
        </p>
        {currentUser && currentUser.username !== profile.user.username && (
          <div className="flex space-x-4 mt-4">
            <button
              className="px-4 py-2 bg-primary-500 text-white rounded-full hover:bg-primary-600"
              onClick={handleFollow}
            >
              {isFollowing ? "Unfollow" : "Follow"}
            </button>
            <button
              className="px-4 py-2 bg-primary-500 text-white rounded-full hover:bg-primary-600"
              onClick={handleMessage}
            >
              Message
            </button>
          </div>
        )}
        <div className="flex space-x-8 mt-6 border-b border-gray-700">
          <button
            className={`pb-2 ${
              activeTab === "content"
                ? "border-b-2 border-primary-500 text-primary-500"
                : "text-gray-400"
            }`}
            onClick={() => setActiveTab("content")}
          >
            Content
          </button>
          <button
            className={`pb-2 ${
              activeTab === "collections"
                ? "border-b-2 border-primary-500 text-primary-500"
                : "text-gray-400"
            }`}
            onClick={() => setActiveTab("collections")}
          >
            Collections
          </button>
        </div>
      </div>
      <div className="mt-6">
        {activeTab === "content" ? (
          isLoadingContent ? (
            <div className="mt-8 flex justify-center">Loading content...</div>
          ) : (
            <>
              <ContentGrid content={content} />
              <Pagination
                currentPage={pageContent}
                totalPages={totalPagesContent}
                onPageChange={(p) => {
                  setPageContent(p);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              />
            </>
          )
        ) : isLoadingCollections ? (
          <div className="mt-8 flex justify-center">Loading collections...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {collections?.map((collection) => (
              <div
                key={collection.id}
                className="bg-dark-800 rounded-xl overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="p-6">
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className="text-xl font-semibold text-white truncate">
                      {collection.name}
                    </h3>
                    {collection.isPublic ? (
                      <span className="text-xs bg-green-600 text-white px-2 py-1 rounded">
                        Public
                      </span>
                    ) : (
                      <span className="text-xs bg-gray-600 text-white px-2 py-1 rounded">
                        Private
                      </span>
                    )}
                  </div>
                  {collection.description && (
                    <p className="text-gray-400 text-sm mb-3 line-clamp-2">
                      {collection.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between text-sm text-gray-400 mb-4">
                    <span>
                      {collection.contentCount} item
                      {collection.contentCount !== 1 ? "s" : ""}
                    </span>
                    <span>
                      {new Date(collection.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <Link
                    to={`/collections/${collection.id}`}
                    className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors text-sm"
                  >
                    View Collection
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
