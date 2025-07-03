import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { userService } from "../services/api";
import { useAuth } from "../contexts/AuthContext";

interface User {
  id: number;
  username: string;
  email: string;
}

const Following: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const { user: currentUser } = useAuth();
  const [following, setFollowing] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [followingMap, setFollowingMap] = useState<{ [key: string]: boolean }>(
    {}
  );
  const [loadingMap, setLoadingMap] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    const fetchFollowing = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await userService.getFollowing(username!);
        setFollowing(response.data);
        // Check follow status for each user
        if (currentUser) {
          const statusMap: { [key: string]: boolean } = {};
          await Promise.all(
            response.data.map(async (u: User) => {
              if (u.username !== currentUser.username) {
                try {
                  const res = await userService.checkFollowStatus(u.username);
                  statusMap[u.username] = res.data.isFollowing;
                } catch {
                  statusMap[u.username] = false;
                }
              }
            })
          );
          setFollowingMap(statusMap);
        }
      } catch (err) {
        console.log(err);
        setError("Failed to load following");
      } finally {
        setIsLoading(false);
      }
    };
    fetchFollowing();
    // eslint-disable-next-line
  }, [username, currentUser]);

  const handleFollowToggle = async (
    targetUsername: string,
    isFollowing: boolean
  ) => {
    setLoadingMap((prev) => ({ ...prev, [targetUsername]: true }));
    try {
      if (isFollowing) {
        await userService.unfollowUser(targetUsername);
      } else {
        await userService.followUser(targetUsername);
      }
      setFollowingMap((prev) => ({ ...prev, [targetUsername]: !isFollowing }));
    } catch (err) {
      console.log(err);
      // Optionally show error
    } finally {
      setLoadingMap((prev) => ({ ...prev, [targetUsername]: false }));
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6 text-primary-500">Following</h1>
      {isLoading ? (
        <div>Loading following...</div>
      ) : error ? (
        <div className="text-red-500">{error}</div>
      ) : following.length === 0 ? (
        <div className="text-gray-400">Not following anyone.</div>
      ) : (
        <ul className="space-y-4">
          {following.map((user) => (
            <li
              key={user.id}
              className="flex items-center space-x-4 p-4 bg-dark-800 rounded-lg"
            >
              <div className="w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center text-white font-bold text-lg">
                {user.username[0].toUpperCase()}
              </div>
              <div className="flex-1">
                <Link
                  to={`/profile/${user.username}`}
                  className="text-lg font-medium text-primary-400 hover:underline"
                >
                  {user.username}
                </Link>
                <div className="text-gray-400 text-sm">{user.email}</div>
              </div>
              {currentUser && user.username !== currentUser.username && (
                <button
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors duration-200 ml-2 ${
                    followingMap[user.username]
                      ? "bg-dark-600 text-white hover:bg-red-500 hover:text-white"
                      : "bg-primary-500 text-white hover:bg-primary-600"
                  }`}
                  disabled={loadingMap[user.username]}
                  onClick={() =>
                    handleFollowToggle(
                      user.username,
                      followingMap[user.username]
                    )
                  }
                >
                  {loadingMap[user.username]
                    ? "..."
                    : followingMap[user.username]
                    ? "Unfollow"
                    : "Follow"}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Following;
