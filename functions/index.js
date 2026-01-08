
/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const { onSchedule } = require("firebase-functions/v2/scheduler");
const admin = require("firebase-admin");

admin.initializeApp();

// Checks every minute for notifications that are due
// Requires deploying to Firebase: `firebase deploy --only functions`
exports.checkScheduledNotifications = onSchedule("every 1 minutes", async (event) => {
  const now = Date.now();
  const db = admin.firestore();
  
  // Use collectionGroup to query all 'scheduled_notifications' collections across all users.
  // NOTE: This requires a composite index on `status` and `remindAt`.
  // Check Firebase Console logs for the index creation link if this query fails.
  const snapshot = await db.collectionGroup("scheduled_notifications")
    .where("status", "==", "pending")
    .where("remindAt", "<=", now)
    .get();

  if (snapshot.empty) {
    console.log("No pending notifications.");
    return;
  }

  const promises = [];

  snapshot.forEach((doc) => {
    const data = doc.data();
    const { fcmToken, content, noteId } = data;

    if (!fcmToken) {
        // Mark as failed if no token
        promises.push(doc.ref.update({ status: "failed", error: "No Token" }));
        return;
    }

    const message = {
      notification: {
        title: "Nhắc nhở từ Gia Hân Converter",
        body: content,
      },
      token: fcmToken,
      webpush: {
        fcmOptions: {
            link: "https://giahanconverter-ggauth.firebaseapp.com/" // Replace with your domain
        }
      }
    };

    // Send the message
    const sendPromise = admin.messaging().send(message)
      .then((response) => {
        console.log("Successfully sent message:", response);
        // Mark as sent to avoid duplicates
        return doc.ref.update({ status: "sent", sentAt: Date.now() });
      })
      .catch((error) => {
        console.log("Error sending message:", error);
        // Mark as failed or retry depending on logic
        return doc.ref.update({ status: "failed", error: error.message });
      });

    promises.push(sendPromise);
  });

  await Promise.all(promises);
});
