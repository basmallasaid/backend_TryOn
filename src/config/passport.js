const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../models/User");

const googleStrategy = new GoogleStrategy(
  {
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/api/auth/google/callback",
  },

  async (accessToken, refreshToken, profile, done) => {
    try {
      let user = await User.findOne({
        google_id: profile.id,
      });

      if (!user) {
        user = await User.create({
          google_id: profile.id,
          email: profile.emails[0].value,
          auth_provider: "google",
          profile: {
            first_name: profile.name?.givenName || "",
            last_name: profile.name?.familyName || "",
          },
        });
      }

      done(null, user);
    } catch (error) {
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

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  const user = await User.findById(id);
  done(null, user);
});
