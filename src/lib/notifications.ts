import { db } from "@/lib/firebase/config";
import {
  addDoc,
  collection,
  serverTimestamp,
  getDoc,
  doc,
} from "firebase/firestore";
import { Notification } from "@/types/notification";

export async function createConnectionNotification(
  userId: string,
  connectingUserId: string
) {
  try {
    const userDoc = await getDoc(doc(db, "users", connectingUserId));
    if (!userDoc.exists()) return;

    const userData = userDoc.data();

    const notification: Omit<Notification, "id"> = {
      userId,
      type: "connect",
      title: "New Connection",
      message: `${userData.username} has connected with you`,
      read: false,
      createdAt: serverTimestamp(),
      actionUrl: `/profile/${connectingUserId}`,
      actionLabel: "View Profile",
      senderId: connectingUserId,
      senderName: userData.username,
      senderImage: userData.profileImage || "",
    };

    await addDoc(collection(db, "notifications"), notification);
  } catch (error) {
    console.error("Error creating connection notification:", error);
  }
}

export async function createChallengeReminderNotification(
  userId: string,
  challengeId: string,
  challengeTitle: string
) {
  try {
    const notification: Omit<Notification, "id"> = {
      userId,
      type: "challenge",
      title: "Challenge Reminder",
      message: `Your challenge "${challengeTitle}" is ending soon`,
      read: false,
      createdAt: serverTimestamp(),
      actionUrl: `/challenges`,
      actionLabel: "View Challenge",
    };

    await addDoc(collection(db, "notifications"), notification);
  } catch (error) {
    console.error("Error creating challenge notification:", error);
  }
}

// export async function createMessageNotification(
//   userId: string,
//   senderId: string,
//   chatId: string,
//   messagePreview: string
// ) {
//   try {
//     const userDoc = await getDoc(doc(db, "users", senderId));
//     if (!userDoc.exists()) return;

//     const userData = userDoc.data();

//     const notification: Omit<Notification, "id"> = {
//       userId,
//       type: "message",
//       title: "New Message",
//       message: `${userData.username}: ${messagePreview.substring(0, 40)}${
//         messagePreview.length > 40 ? "..." : ""
//       }`,
//       read: false,
//       createdAt: serverTimestamp(),
//       actionUrl: `/messages/${chatId}`,
//       actionLabel: "Reply",
//       senderId,
//       senderName: userData.username,
//       senderImage: userData.profileImage || "",
//     };

//     await addDoc(collection(db, "notifications"), notification);
//   } catch (error) {
//     console.error("Error creating message notification:", error);
//   }
// }
