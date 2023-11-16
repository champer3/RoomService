const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const dotenv = require("dotenv");

dotenv.config({ path: "./config.env" });


passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENTID,
    clientSecret: process.env.GOOGLE_CLIENTSECRET,
    callbackURL: 'http://localhost:3000/auth/google/callback',
    scope: ['openid', 'profile', 'email'],
    userProfileURL: 'https://www.googleapis.com/oauth2/v3/userinfo'
}, (accessToken, refreshToken, profile, done) => {
    // Handle user data after authentication

    return done(null, profile);
}));



passport.use(new FacebookStrategy({
  clientID: process.env.FACEBOOK_APP_ID,
  clientSecret: process.env.FACEBOOK_APP_SECRET,
  callbackURL: 'http://localhost:3000/auth/facebook/callback',
  profileFields: ['id', 'displayName', 'photos', 'email'],
}, (accessToken, refreshToken, profile, done) => {
  console.log("emails", profile.emails)
  return done(null, profile);
}));

passport.serializeUser((user, done) => {
    done(null, user);
});

passport.deserializeUser((obj, done) => {
    done(null, obj);
});
