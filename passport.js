const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;


passport.use(new GoogleStrategy({
    clientID: "1036326714736-oth85k8a05au2put8djckq4i65dchqqc.apps.googleusercontent.com",
    clientSecret: "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",
    callbackURL: 'http://localhost:3000/auth/google/callback'
}, (accessToken, refreshToken, profile, done) => {
    // Handle user data after authentication
    console.log(profile)
    return done(null, profile);
}));

passport.serializeUser((user, done) => {
    done(null, user);
});

passport.deserializeUser((obj, done) => {
    done(null, obj);
});
