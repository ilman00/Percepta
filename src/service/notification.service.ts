import admin from "../config/firebase";
import { User } from "../models/Users";

export const sendPushNotificationToMany = async (
  tokens: string[],
  title: string,
  body: string
) => {
  try {
    if (!tokens || tokens.length === 0) return;

    const message = {
      notification: {
        title,
        body,
      },
      tokens,
    };

    const response = await admin.messaging().sendEachForMulticast(message);

    console.log(
      `Notifications: ${response.successCount} success, ${response.failureCount} failed`
    );

    // Remove invalid tokens
    if (response.failureCount > 0) {
      const invalidTokens: string[] = [];

      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          const errorCode = resp.error?.code;

          if (
            errorCode === "messaging/registration-token-not-registered" ||
            errorCode === "messaging/invalid-registration-token"
          ) {
            invalidTokens.push(tokens[idx]);
          }
        }
      });

      if (invalidTokens.length > 0) {
        await User.updateMany(
          {},
          { $pull: { fcmTokens: { $in: invalidTokens } } }
        );

        console.log("Removed invalid tokens:", invalidTokens.length);
      }
    }

    return response;
  } catch (error) {
    console.error("FCM Notification Error:", error);
  }
};