import jwt from "jsonwebtoken";
import ErrorHandler from "./utility-class.js";

const CERTS_URL =
  "https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com";

let certCache: { certs: Record<string, string>; expiresAt: number } | undefined;

const getFirebaseCerts = async () => {
  if (certCache && certCache.expiresAt > Date.now()) return certCache.certs;

  const res = await fetch(CERTS_URL);
  if (!res.ok) throw new Error("Could not fetch Firebase signing certificates");

  const maxAge = Number(
    res.headers.get("cache-control")?.match(/max-age=(\d+)/)?.[1] ?? 3600
  );
  certCache = {
    certs: (await res.json()) as Record<string, string>,
    expiresAt: Date.now() + maxAge * 1000,
  };
  return certCache.certs;
};

export type FirebaseIdentity = {
  uid: string;
  email: string;
  name?: string;
  picture?: string;
};

export const verifyFirebaseToken = async (
  idToken: string
): Promise<FirebaseIdentity> => {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  if (!projectId)
    throw new Error("FIREBASE_PROJECT_ID is not defined in the environment variables");

  const kid = jwt.decode(idToken, { complete: true })?.header.kid;
  const certs = await getFirebaseCerts();
  if (!kid || !certs[kid])
    throw new ErrorHandler("Invalid Google sign-in token", 401);

  let payload: jwt.JwtPayload;
  try {
    payload = jwt.verify(idToken, certs[kid], {
      algorithms: ["RS256"],
      audience: projectId,
      issuer: `https://securetoken.google.com/${projectId}`,
    }) as jwt.JwtPayload;
  } catch {
    throw new ErrorHandler("Invalid or expired Google sign-in token", 401);
  }

  if (!payload.sub || typeof payload.email !== "string")
    throw new ErrorHandler("Google account has no email address", 400);

  return {
    uid: payload.sub,
    email: payload.email,
    name: payload.name,
    picture: payload.picture,
  };
};
