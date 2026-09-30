export function logAdminAction(
  action: string,
  details: Record<string, unknown> & { githubLogin: string },
): void {
  console.log(
    JSON.stringify({
      type: "admin_action",
      action,
      timestamp: new Date().toISOString(),
      ...details,
    }),
  );
}
