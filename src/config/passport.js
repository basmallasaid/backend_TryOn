const passport = require("passport");
const User = require("../models/User");

let verifyGoogleIdToken;

if (process.env.GOOGLE_CLIENT_ID) {
  const GoogleStrategy = require("passport-google-oauth20").Strategy;
  const { OAuth2Client } = require("google-auth-library");

  const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

  verifyGoogleIdToken = async (idToken) => {
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    return ticket.getPayload();
  };

  if (process.env.GOOGLE_CLIENT_SECRET) {
    const googleStrategy = new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: "/api/auth/google/callback",
      },

      async (accessToken, refreshToken, profile, done) => {
        try {
          console.log(`[Google OAuth] Looking up user by google_id: ${profile.id}`);
          console.log(`[Google OAuth] Profile fields available:`, Object.keys(profile));
          console.log(`[Google OAuth] profile.photos:`, JSON.stringify(profile.photos));
          console.log(`[Google OAuth] profile._json.picture:`, profile._json?.picture);

          let user = await User.findOne({
            google_id: profile.id,
          });

          const googleImage = profile.photos?.[0]?.value || profile._json?.picture || "";

          if (!user) {
            console.log(`[Google OAuth] User not found, creating new user for email: ${profile.emails?.[0]?.value}`);

            user = await User.create({
              google_id: profile.id,
              email: profile.emails[0].value,
              auth_provider: "google",
              userImage: googleImage,
              profile: {
                first_name: profile.name?.givenName || "",
                last_name: profile.name?.familyName || "",
              },
            });

            console.log(`[Google OAuth] New user created with _id: ${user._id}, userImage: "${user.userImage}"`);
          } else {
            console.log(`[Google OAuth] Existing user found with _id: ${user._id}, current userImage: "${user.userImage}"`);
            if (googleImage && googleImage !== user.userImage) {
              user.userImage = googleImage;
              user.markModified("userImage");
              await user.save();
              console.log(`[Google OAuth] Updated user image to: "${user.userImage}"`);
            }
          }

          done(null, user);
        } catch (error) {
          console.error(`[Google OAuth] Error: ${error.message}`);
          done(error, null);
        }
      },
    );

    googleStrategy.authorizationParams = function (options) {
      var params = {};

      if (options.accessType) {
        params["access_type"] = options.accessType;
      }
      if (options.prompt) {
        params["prompt"] = options.prompt;
      }
      if (options.loginHint) {
        params["login_hint"] = options.loginHint;
      }
      if (options.includeGrantedScopes) {
        params["include_granted_scopes"] = true;
      }
      if (options.display) {
        params["display"] = options.display;
      }
      if (options.hostedDomain || options.hd) {
        params["hd"] = options.hostedDomain || options.hd;
      }
      if (options.requestVisibleActions) {
        params["request_visible_actions"] = options.requestVisibleActions;
      }
      if (options.openIDRealm) {
        params["openid.realm"] = options.openIDRealm;
      }
      if (options.approvalPrompt) {
        params["approval_prompt"] = options.approvalPrompt;
      }
      if (options.userID) {
        params["user_id"] = options.userID;
      }
      if (options.device_id) {
        params["device_id"] = options.device_id;
      }
      if (options.device_name) {
        params["device_name"] = options.device_name;
      }

      return params;
    };

    passport.use(googleStrategy);
  }
}

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  const user = await User.findById(id);
  done(null, user);
});

module.exports = { verifyGoogleIdToken };
