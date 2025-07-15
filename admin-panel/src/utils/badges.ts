export const getUsergroupBadge = (usergroup: string): string => {
  const styles = {
    admin: 'bg-red-900 text-red-300',
    moderator: 'bg-blue-900 text-blue-300',
    vip: 'bg-purple-900 text-purple-300',
    member: 'bg-gray-700 text-gray-300'
  };
  return styles[usergroup as keyof typeof styles] || styles.member;
};

export const getStatusBadge = (status: string): string => {
  const styles = {
    active: 'bg-green-900 text-green-300',
    awaiting_moderation: 'bg-yellow-900 text-yellow-300',
    archived: 'bg-gray-700 text-gray-300'
  };
  return styles[status as keyof typeof styles] || styles.active;
};