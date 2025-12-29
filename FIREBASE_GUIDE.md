# Firebase Data Guide

Your application data is stored in **Google Cloud Firestore**, which is a NoSQL, document-based database.

## 📍 Where to Find Your Data

1.  **Go to the Firebase Console**: [https://console.firebase.google.com/](https://console.firebase.google.com/)
2.  **Select Your Project**: Click on the project named **`real-estate-81765`** (matches your config).
3.  **Navigate to Database**:
    *   On the left sidebar, click **Build**.
    *   Select **Firestore Database**.
4.  **View Data**: Click the **Data** tab to see your collections.

---

## 🗂️ Data Structure (Collections)

You will see the following "Collections" create automatically as you use the app:

### 1. `users`
Stores user profiles.
*   **Document ID**: The User ID (UID) from Authentication.
*   **Fields**: `name`, `email`, `phone`, `bio`, `role`.

### 2. `properties`
Stores all the real estate listings.
*   **Document ID**: Auto-generated random ID.
*   **Fields**: `title`, `price`, `address`, `type` (Rent/Sale), `image`, `ownerId`, `likesCount`.

### 3. `likes`
Tracks which user liked which property.
*   **Document ID**: A combined string: `propertyId_userId`.
*   **Fields**: `propertyId`, `userId`, `timestamp`.
*   *Why?* This unique ID prevents a user from liking the same property twice.

### 4. `chats`
Stores the list of active conversations.
*   **Document ID**: A combined string: `user1_user2_propertyId`.
*   **Fields**: `participants` (array of UIDs), `lastMessage`, `propertyId`.

#### ↳ `messages` (Sub-collection)
Inside each `chat` document, there is a sub-collection called `messages`.
*   **Fields**: `text`, `senderId`, `timestamp`.

---

## 🖼️ What about Images?
Currently, your app stores images as **URLs** (text links) inside Firestore.
*   If you implement file uploads later, the actual image files will be stored in **Storage** (Build -> Storage), and the *link* to that file will be saved in Firestore.
