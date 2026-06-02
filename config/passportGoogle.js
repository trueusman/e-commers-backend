import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import User from "../models/User.js";
import { isGoogleOAuthConfigured } from "./googleOAuth.js";
import { GOOGLE_CALLBACK_URL } from "./env.js";
import {
  resolveGoogleAvatar,
  deleteCloudinaryAvatar,
  isCloudinaryAvatarUrl,
} from "../utils/avatarUpload.js";

export function configureGooglePassport(app) {
  if (!isGoogleOAuthConfigured()) return false;

  if (!GOOGLE_CALLBACK_URL) {
    console.warn("⚠️  Google OAuth: GOOGLE_CALLBACK_URL / BACKEND_URL not set — callback may fail");
  }

  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: GOOGLE_CALLBACK_URL || "/api/auth/google/callback",
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value?.toLowerCase()?.trim();
          if (!email) {
            return done(new Error("Google account did not provide an email"));
          }

          const googlePhotoUrl = profile.photos?.[0]?.value || "";
          const displayName = profile.displayName?.trim() || email.split("@")[0];

          const avatar = await resolveGoogleAvatar(
            googlePhotoUrl,
            profile.id,
            displayName,
            email
          );

          let user = await User.findOne({ googleId: profile.id });
          if (!user) {
            user = await User.findOne({ email });
          }

          if (user) {
            let changed = false;

            if (!user.googleId) {
              user.googleId = profile.id;
              changed = true;
            }
            if (user.authType !== "google") {
              user.authType = "google";
              changed = true;
            }
            if (displayName && (!user.name || user.name.startsWith("google-"))) {
              user.name = displayName;
              changed = true;
            }
            if (!user.isVerified) {
              user.isVerified = true;
              changed = true;
            }

            const shouldRefreshAvatar =
              avatar &&
              (!user.avatar ||
                user.avatar !== avatar ||
                (!user.avatar.includes("googleusercontent.com") &&
                  avatar.includes("googleusercontent.com")));

            if (shouldRefreshAvatar) {
              if (isCloudinaryAvatarUrl(user.avatar)) {
                await deleteCloudinaryAvatar(user.avatar);
              }
              user.avatar = avatar;
              changed = true;
            }

            if (changed) await user.save();
          } else {
            user = await User.create({
              name: displayName,
              email,
              phone: "",
              googleId: profile.id,
              authType: "google",
              avatar,
              city: "",
              isVerified: true,
            });
          }

          return done(null, user);
        } catch (error) {
          return done(error);
        }
      }
    )
  );

  app.use(passport.initialize());
  return true;
}
