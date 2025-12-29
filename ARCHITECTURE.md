# Real-Time Real Estate Application Architecture

## 1. System Overview
This is a Single Page Application (SPA) built with Vanilla JavaScript, HTML, and CSS, powered by Firebase. It uses a serverless architecture where the frontend communicates directly with Firebase services (Auth, Firestore, Storage).

### Key Features
- **Real-time Properties Feed**: Uses Firestore `onSnapshot` to sync property listings instantly across all connected clients.
- **Privacy-First Design**: Users interact via an internal chat system; personal contact info (email/phone) is never exposed to the frontend property data.
- **Like-Gated Chat**: Interaction is gated by a "Like" action, filtering for high-intent buyers.

## 2. Database Schema (Firestore)

### Collection: `users`
Stores user profiles.
- `docId`: `uid` (from Firebase Auth)
- `name` (string): Public display name
- `role` (string): 'user' | 'owner' (For this app, all users can be both)
- `createdAt` (timestamp)

### Collection: `properties`
Stores property listings.
- `docId`: Auto-generated
- `title` (string)
- `description` (string)
- `price` (number)
- `location` (string)
- `type` (string): 'Rent' | 'Sale'
- `image` (string): URL from Firestore Storage (or placeholder)
- `ownerId` (string): `uid` of the creator
- `likesCount` (number): aggregated count of likes
- `timestamp` (timestamp): creation time

### Collection: `likes`
Join table for Users and Properties.
- `docId`: `${propertyId}_${userId}` (Composite key to prevent duplicate likes)
- `propertyId` (string)
- `userId` (string)
- `timestamp` (timestamp)

### Collection: `chats`
Metadata for conversations.
- `docId`: `${participantId1}_${participantId2}_${propertyId}` (Deterministic ID to prevent duplicate threads)
- `propertyId` (string)
- `participants` (array): `[uid1, uid2]`
- `lastMessage` (string): Preview snippet
- `lastMessageTime` (timestamp): For sorting

### Sub-collection: `chats/{chatId}/messages`
Individual messages.
- `docId`: Auto-generated
- `senderId` (string)
- `text` (string)
- `timestamp` (timestamp)

## 3. Security Rules (firestore.rules)
These rules ensure data privacy and integrity.

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // User Profiles: Anyone can read, only owner can write
    match /users/{userId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
    }

    // Properties: Anyone can read, only authenticated can create
    match /properties/{propertyId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && request.auth.uid == resource.data.ownerId;
    }

    // Likes: Authenticated users can read/write their own likes
    // Using a composite ID propertyId_userId ensures 1 like per user per property
    match /likes/{likeId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
                   likeId.matches('.*_' + request.auth.uid);
    }

    // Chats: Only participants can read/write
    match /chats/{chatId} {
      allow read, write: if request.auth != null && 
                         request.auth.uid in resource.data.participants;
    }

    match /chats/{chatId}/messages/{messageId} {
        allow read, write: if request.auth != null && 
                           get(/databases/$(database)/documents/chats/$(chatId)).data.participants.hasAny([request.auth.uid]);
    }
  }
}
```

## 4. Implementation Logic

### Real-Time Feed
- **Function**: `fetchProperties()`
- **Logic**: 
  1. Sets up `onSnapshot` listener on `properties` collection.
  2. On update, clears the grid and re-renders all property cards.
  3. Sorts by `timestamp` descending locally.
  4. Checks `likes` collection to highlight the "Heart" icon if the current user has liked it.

### Like System
- **Function**: `toggleLike(propertyId)`
- **Logic**:
  1. Check if user is logged in.
  2. Construct `docId` = `${propertyId}_${userId}`.
  3. Check if this document exists.
  4. **If Exists (Unlike)**: 
     - Delete document from `likes`.
     - Decrement `likesCount` on `properties/{propertyId}` (using `increment(-1)`).
  5. **If Not Exists (Like)**:
     - Create document in `likes`.
     - Increment `likesCount` on `properties/{propertyId}` (using `increment(1)`).

### Chat System
- **Function**: `initiateChat(ownerId, propertyId)`
- **Logic**:
  1. Check if user has liked the property (Query `likes` collection for `docId`).
  2. If NOT liked -> Show error toast "You must like the property to chat".
  3. If Liked -> Proceed to create/fetch chat thread.
