import { headers } from "next/headers";

export type CloudflareAccessUser = {
  displayName: string;
  email: string;
};

const USER_EMAIL_HEADER = "cf-access-authenticated-user-email";

export async function getCloudflareAccessUser(): Promise<CloudflareAccessUser | null> {
  const requestHeaders = await headers();
  const email = requestHeaders.get(USER_EMAIL_HEADER)?.trim().toLowerCase();
  if (!email) return null;

  return {
    displayName: email.split("@")[0] || email,
    email,
  };
}
