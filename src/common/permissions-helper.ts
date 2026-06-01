export function getViewableProjects(user: any): string[] | null {
  if (!user) return null;
  const canViewAll =
    user.permissions?.includes('VIEW_ALL_RECORDS') ||
    user.role === 'Admin' ||
    user.role === 'System Admin';
  if (canViewAll) return null; // null = can view all projects
  if (user.projectPermissions?.length > 0) {
    return user.projectPermissions.map((pp: any) => pp.projectId);
  }
  return []; // no projects
}
