
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
  
  // Since subcollections permissions can be tricky without manual rule updates,
  // we are scanning the 'users' collection for the 'scheduled_reminders' field.
  // Note: For large scale apps, this should use a separate collection/subcollection with proper rules.
  const snapshot = await db.collection("users").get();

  if (snapshot.empty) {
    console.log("No users found.");
    return;
  }

  const updates = [];

  for (const userDoc of snapshot.docs) {
      const userData = userDoc.data();
      const reminders = userData.scheduled_reminders || [];
      
      // Filter for due pending reminders
      const dueReminders = reminders.filter(r => r.status === 'pending' && r.remindAt <= now);

      if (dueReminders.length === 0) continue;

      let dirty = false;
      // Clone array to modify
      const updatedReminders = [...reminders];

      for (const reminder of dueReminders) {
          const { fcmToken, content, id } = reminder;

          if (!fcmToken) {
              const idx = updatedReminders.findIndex(r => r.id === id);
              if (idx > -1) {
                  updatedReminders[idx].status = 'failed';
                  updatedReminders[idx].error = 'No Token';
                  dirty = true;
              }
              continue;
          }

          const message = {
            notification: {
                title: "Nhắc nhở từ Gia Hân Converter",
                body: content,
            },
            token: fcmToken,
            webpush: {
                fcmOptions: {
                    link: "https://giahanconverter-ggauth.firebaseapp.com/"
                }
            }
          };

          try {
              const response = await admin.messaging().send(message);
              console.log(`Successfully sent message for note ${id}:`, response);
              
              const idx = updatedReminders.findIndex(r => r.id === id);
              if (idx > -1) {
                  updatedReminders[idx].status = 'sent';
                  updatedReminders[idx].sentAt = Date.now();
                  dirty = true;
              }
          } catch (error) {
              console.log(`Error sending message for note ${id}:`, error);
              const idx = updatedReminders.findIndex(r => r.id === id);
              if (idx > -1) {
                  updatedReminders[idx].status = 'failed';
                  updatedReminders[idx].error = error.message;
                  dirty = true;
              }
          }
      }

      if (dirty) {
          updates.push(userDoc.ref.update({ scheduled_reminders: updatedReminders }));
      }
  }

  await Promise.all(updates);
});
