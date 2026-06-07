const User = require('./Models/userModel');

async function sendPushToUser(userId, title, body, data = {}) {
  try {
    const user = await User.findById(userId).select('expoPushTokens');
    if (!user || !user.expoPushTokens || user.expoPushTokens.length === 0) {
      return;
    }

    const messages = user.expoPushTokens
      .filter((token) => token && token.startsWith('ExponentPushToken'))
      .map((token) => ({
        to: token,
        sound: 'default',
        title,
        body,
        data,
        channelId: 'order-updates',
      }));

    if (messages.length === 0) return;

    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messages),
    });
  } catch (err) {
    console.error('[PushNotif] Error sending to user', userId, ':', err.message);
  }
}

module.exports = { sendPushToUser };
