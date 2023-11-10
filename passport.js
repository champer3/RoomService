const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;


passport.use(new GoogleStrategy({
    clientID: "1036326714736-oth85k8a05au2put8djckq4i65dchqqc.apps.googleusercontent.com",
    clientSecret: "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",
    callbackURL: 'http://localhost:3000/auth/google/callback',
    scope: ['openid', 'profile', 'email'],
    userProfileURL: 'https://www.googleapis.com/oauth2/v3/userinfo'
}, (accessToken, refreshToken, profile, done) => {
    // Handle user data after authentication
    // console.log(accessToken)
    // console.log('accessToken ', accessToken)

    return done(null, profile, accessToken);
}));

passport.serializeUser((user, done) => {
    done(null, user);
});

passport.deserializeUser((obj, done) => {
    done(null, obj);
});
