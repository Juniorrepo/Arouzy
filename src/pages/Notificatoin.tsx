import React from "react";
import { useNavigate } from "react-router-dom";
import { MessageCircle, Users, Heart, UserPlus, Bell, Eye, ShoppingBag } from "lucide-react";

interface NotificationItem {
  id: string;
  type: 'message' | 'follow' | 'like' | 'friend_request' | 'post' | 'view' | 'purchase';
  title: string;
  description: string;
  count: number;
  icon: React.ReactNode;
  route: string;
  color: string;
}

const Notification: React.FC = () => {
  const navigate = useNavigate();

  // Mock notification data - in a real app, this would come from your API/context
  const notifications: NotificationItem[] = [
    {
      id: '1',
      type: 'message',
      title: 'New Messages',
      description: 'You have unread direct messages',
      count: 5,
      icon: <MessageCircle className="h-6 w-6" />,
      route: '/messages',
      color: 'text-blue-400'
    },
    {
      id: '2',
      type: 'post',
      title: 'New Posts',
      description: 'New posts from users you follow',
      count: 12,
      icon: <Bell className="h-6 w-6" />,
      route: '/following',
      color: 'text-green-400'
    },
    {
      id: '3',
      type: 'friend_request',
      title: 'Friend Requests',
      description: 'People want to connect with you',
      count: 3,
      icon: <UserPlus className="h-6 w-6" />,
      route: '/friends/requests',
      color: 'text-purple-400'
    },
    {
      id: '4',
      type: 'like',
      title: 'Likes & Reactions',
      description: 'Your content received new likes',
      count: 8,
      icon: <Heart className="h-6 w-6" />,
      route: '/activity/likes',
      color: 'text-red-400'
    },
    {
      id: '5',
      type: 'follow',
      title: 'New Followers',
      description: 'New people started following you',
      count: 2,
      icon: <Users className="h-6 w-6" />,
      route: '/profile/followers',
      color: 'text-yellow-400'
    },
    {
      id: '6',
      type: 'view',
      title: 'Profile Views',
      description: 'People viewed your profile',
      count: 15,
      icon: <Eye className="h-6 w-6" />,
      route: '/activity/views',
      color: 'text-indigo-400'
    },
    {
      id: '7',
      type: 'purchase',
      title: 'Purchase Updates',
      description: 'Updates on your orders and purchases',
      count: 1,
      icon: <ShoppingBag className="h-6 w-6" />,
      route: '/orders',
      color: 'text-orange-400'
    }
  ];

  const handleNotificationClick = (route: string) => {
    navigate(route);
  };

  const formatCount = (count: number): string => {
    if (count > 99) return '99+';
    if (count > 9) return '9+';
    return count.toString();
  };

  const getTotalNotifications = (): number => {
    return notifications.reduce((total, notification) => total + notification.count, 0);
  };

  return (
    <div className="min-h-screen bg-dark-900 text-white">
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Notifications</h1>
          <p className="text-gray-400">
            You have {getTotalNotifications()} total notifications
          </p>
        </div>

        {/* Notification Categories */}
        <div className="space-y-4">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              onClick={() => handleNotificationClick(notification.route)}
              className="bg-dark-800 rounded-lg p-6 border border-dark-600 hover:border-primary-500 hover:bg-dark-700 transition-all duration-200 cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  {/* Icon */}
                  <div className={`${notification.color} group-hover:scale-110 transition-transform duration-200`}>
                    {notification.icon}
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white group-hover:text-primary-300 transition-colors">
                      {notification.title}
                    </h3>
                    <p className="text-gray-400 text-sm mt-1">
                      {notification.description}
                    </p>
                  </div>
                </div>

                {/* Count Badge */}
                {notification.count > 0 && (
                  <div className="flex items-center space-x-3">
                    <span className="bg-primary-500 text-white text-sm font-bold rounded-full px-3 py-1 min-w-[2rem] text-center group-hover:bg-primary-400 transition-colors">
                      {formatCount(notification.count)}
                    </span>
                    <div className="text-gray-400 group-hover:text-primary-300 transition-colors">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Empty State (when no notifications) */}
        {notifications.every(n => n.count === 0) && (
          <div className="text-center py-16">
            <Bell className="h-16 w-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-400 mb-2">All caught up!</h3>
            <p className="text-gray-500">You don't have any new notifications right now.</p>
          </div>
        )}

        {/* Quick Actions */}
        <div className="mt-12 pt-8 border-t border-dark-600">
          <h2 className="text-xl font-semibold text-white mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <button
              onClick={() => navigate('/messages')}
              className="bg-dark-800 hover:bg-dark-700 border border-dark-600 hover:border-primary-500 rounded-lg p-4 text-left transition-all duration-200 group"
            >
              <MessageCircle className="h-6 w-6 text-blue-400 mb-2 group-hover:scale-110 transition-transform" />
              <h3 className="font-semibold text-white group-hover:text-primary-300 transition-colors">Messages</h3>
              <p className="text-gray-400 text-sm">Check your conversations</p>
            </button>

            <button
              onClick={() => navigate('/friends/requests')}
              className="bg-dark-800 hover:bg-dark-700 border border-dark-600 hover:border-primary-500 rounded-lg p-4 text-left transition-all duration-200 group"
            >
              <UserPlus className="h-6 w-6 text-purple-400 mb-2 group-hover:scale-110 transition-transform" />
              <h3 className="font-semibold text-white group-hover:text-primary-300 transition-colors">Friend Requests</h3>
              <p className="text-gray-400 text-sm">Manage your connections</p>
            </button>

            <button
              onClick={() => navigate('/settings/notifications')}
              className="bg-dark-800 hover:bg-dark-700 border border-dark-600 hover:border-primary-500 rounded-lg p-4 text-left transition-all duration-200 group"
            >
              <Bell className="h-6 w-6 text-gray-400 mb-2 group-hover:scale-110 transition-transform" />
              <h3 className="font-semibold text-white group-hover:text-primary-300 transition-colors">Settings</h3>
              <p className="text-gray-400 text-sm">Manage notification preferences</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Notification;