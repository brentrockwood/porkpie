export type AuthContext = {
  userId: string;
  roles: string[];
};

export const demoAuthContext: AuthContext = {
  userId: "demo-user",
  roles: ["user"],
};
