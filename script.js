import { db, auth } from "./firebase-config.js";
import { collection, addDoc, getDocs, doc, getDoc, setDoc, updateDoc, deleteDoc, onSnapshot, query, where, orderBy, limit, limitToLast, Timestamp, arrayUnion, increment, runTransaction, writeBatch } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";
import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-storage.js";
import { storage } from "./firebase-config.js";

let properties = [];
let currentUser = null;
let currentUserProfile = {}; // Cache for user profile
let currentChatId = null;
let chatUnsubscribe = null;
let userLikes = new Set(); // Track the IDs of properties liked by the current user

// Currency Formatter
const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
    }).format(amount);
};

// Toast Notification
const showToast = (message, type = 'success') => {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    let icon = type === 'success' ? 'check-circle' : 'alert-circle';

    toast.innerHTML = `<i data-lucide="${icon}"></i> <span>${message}</span>`;
    container.appendChild(toast);
    lucide.createIcons();

    setTimeout(() => {
        toast.remove();
    }, 3500);
};

// --- DATA FETCHING ---

const fetchProperties = () => {
    const propertyGrid = document.getElementById('property-grid');
    // Initial loading state only if empty
    if (properties.length === 0 && propertyGrid) {
        propertyGrid.innerHTML = '<p style="text-align:center; width:100%; grid-column: 1/-1;">Loading properties...</p>';
    }

    // DEBUG: Removed orderBy temporarily to rule out index issues
    const q = query(collection(db, "properties"));

    // Real-time listener
    onSnapshot(q, (snapshot) => {
        properties = [];
        snapshot.forEach((doc) => {
            properties.push({ id: doc.id, ...doc.data() });
        });

        // Client-side sort to replace server-side sort
        properties.sort((a, b) => {
            const tA = a.createdAt?.seconds || 0;
            const tB = b.createdAt?.seconds || 0;
            return tB - tA;
        });

        console.log("Real-time update: ", properties.length, " properties found.");
        renderProperties();
    }, (error) => {
        console.error("Error fetching properties:", error);
        showToast(`Error: ${error.message}`, "error");
        if (propertyGrid) propertyGrid.innerHTML = `<p style="text-align:center; width:100%; grid-column: 1/-1; color:red;">Error loading properties: ${error.message}</p>`;
    });
};

window.seedDB = async () => {
    const defaultProps = [
        {
            title: "Modern Apartment in City Center",
            image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80",
            price: 12500000,
            type: "For Sale",
            address: "45 MG Road, Bangalore",
            beds: 2,
            baths: 2,
            sqft: 1200,
            description: "Beautiful modern apartment with city views and premium amenities.",
            createdAt: Timestamp.now(),
            sellerId: "system",
            sellerEmail: "info@realestate.com",
            sellerName: "Real Estate Official"
        },
        {
            title: "Luxury Villa with Pool",
            image: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=800&q=80",
            price: 45000000,
            type: "For Sale",
            address: "12 Palm Grove, Mumbai",
            beds: 4,
            baths: 5,
            sqft: 4500,
            description: "Exquisite villa featuring a private pool, landscaped gardens, and smart home integration.",
            createdAt: Timestamp.now(),
            sellerId: "system",
            sellerEmail: "info@realestate.com",
            sellerName: "Real Estate Official"
        },
        {
            title: "Cozy Studio Near Metro",
            image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80",
            price: 15000,
            type: "For Rent",
            address: "sector 14, Gurgaon",
            beds: 1,
            baths: 1,
            sqft: 500,
            description: "Perfect for singles or couples, this studio is walking distance from the metro station.",
            createdAt: Timestamp.now(),
            sellerId: "system",
            sellerEmail: "info@realestate.com",
            sellerName: "Real Estate Official"
        }
    ];

    try {
        const batchPromises = defaultProps.map(prop => addDoc(collection(db, "properties"), prop));
        await Promise.all(batchPromises);
        console.log("Seeding complete.");
        // Re-fetch to display
        const querySnapshot = await getDocs(collection(db, "properties"));
        properties = [];
        querySnapshot.forEach((doc) => {
            properties.push({ id: doc.id, ...doc.data() });
        });
        renderProperties();
    } catch (err) {
        console.error("Error seeding defaults:", err);
    }
};

const renderProperties = () => {
    const propertyGrid = document.getElementById('property-grid');
    if (!propertyGrid) return;

    propertyGrid.innerHTML = '';

    // Filter Logic (Buy/Rent/Sold)
    const activeTab = document.querySelector('.search-tabs .tab.active');

    let visibleProps = [...properties];

    if (activeTab) {
        const type = activeTab.textContent.trim();
        if (type === 'All') {
            // Show everything
        } else if (type === 'Buy') {
            visibleProps = visibleProps.filter(p => !p.type || p.type === 'For Sale');
        } else if (type === 'Rent') {
            visibleProps = visibleProps.filter(p => p.type === 'For Rent');
        } else if (type === 'Sold') {
            visibleProps = visibleProps.filter(p => p.type === 'Sold');
        }
    }

    // Search Filters
    const searchLoc = document.getElementById('search-location');
    const searchType = document.getElementById('search-type');
    const searchPrice = document.getElementById('search-price');

    // 1. Location Filter
    if (searchLoc && searchLoc.value.trim()) {
        const term = searchLoc.value.trim().toLowerCase();
        visibleProps = visibleProps.filter(p =>
            (p.address && p.address.toLowerCase().includes(term)) ||
            (p.title && p.title.toLowerCase().includes(term))
        );
    }

    // 2. Type Filter (House, Apartment, Villa) - Checking Title/Description
    if (searchType && searchType.value !== 'Any Type') {
        const term = searchType.value.toLowerCase();
        visibleProps = visibleProps.filter(p =>
            (p.title && p.title.toLowerCase().includes(term)) ||
            (p.description && p.description.toLowerCase().includes(term))
        );
    }

    // 3. Price Filter
    if (searchPrice && searchPrice.value && searchPrice.value !== 'Any Price') {
        const val = searchPrice.value;
        if (val.includes('+')) {
            const min = Number(val.replace('+', ''));
            visibleProps = visibleProps.filter(p => p.price >= min);
        } else if (val.includes('-')) {
            const [min, max] = val.split('-').map(Number);
            visibleProps = visibleProps.filter(p => p.price >= min && p.price <= max);
        }
    }

    // Debug
    console.log("Rendering properties:", visibleProps.length);

    // Sort Newest
    visibleProps.sort((a, b) => {
        const timeA = a.createdAt && a.createdAt.seconds ? a.createdAt.seconds : 0;
        const timeB = b.createdAt && b.createdAt.seconds ? b.createdAt.seconds : 0;
        return timeB - timeA;
    });

    if (visibleProps.length === 0) {
        propertyGrid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 3rem;">
                <p style="margin-bottom: 1rem; color: var(--text-light);">No properties found inside the database.</p>
                <button class="btn-primary" onclick="window.seedDB()">Initialize Sample Data</button>
            </div>
        `;
        return;
    }

    visibleProps.forEach(prop => {
        try {
            const card = document.createElement('div');
            card.className = 'property-card fade-in';
            card.onclick = () => openPropertyDetail(prop.id);

            const safePrice = prop.price ? formatCurrency(prop.price) : 'N/A';
            const safeType = prop.type || 'Property';

            card.innerHTML = `
                <div class="card-image">
                    <img src="${prop.image || 'https://via.placeholder.com/300'}" alt="${prop.title || 'Property'}" onerror="this.src='https://via.placeholder.com/300'">
                    <div class="tag">${safeType}</div>
                    <div class="price">${safePrice}${safeType === 'For Rent' ? '/mo' : ''}</div>
                    <button class="like-btn" onclick="window.toggleLike('${prop.id}', event)" 
                            style="position:absolute; top:1rem; right:1rem; background:white; border:none; border-radius:50%; width:36px; height:36px; display:flex; align-items:center; justify-content:center; cursor:pointer; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                        <i id="heart-${prop.id}" data-lucide="heart" 
                           style="width:20px; height:20px; transition: all 0.2s; ${userLikes.has(prop.id) ? 'fill: #ef4444; stroke: #ef4444;' : 'color:#94a3b8;'}"></i>
                    </button>
                </div>
                <div class="card-content">
                    <div style="display:flex; justify-content:space-between; align-items:start;">
                        <h3>${prop.title || 'Untitled'}</h3>
                        <span style="font-size:0.8rem; color:var(--text-light); display:flex; align-items:center; gap:4px;">
                            <i data-lucide="heart" style="width:12px; height:12px;"></i> <span id="count-${prop.id}">${prop.likesCount || 0}</span>
                        </span>
                    </div>
                    <p class="address"><i data-lucide="map-pin"></i> ${prop.address || 'No Address'}</p>
                    <div class="features">
                        <span><i data-lucide="bed"></i> ${prop.beds || 0} Beds</span>
                        <span><i data-lucide="bath"></i> ${prop.baths || 0} Baths</span>
                        <span><i data-lucide="maximize"></i> ${prop.sqft || 0} sqft</span>
                    </div>
                    
                    <div style="margin-top: 1rem; display: flex; gap: 0.5rem;">
                        ${(currentUser && prop.sellerId === currentUser.uid)
                    ? `<button class="btn-primary" style="flex:1; padding: 0.5rem; font-size: 0.9rem;" onclick="event.stopPropagation(); window.openPropertyDetail('${prop.id}')">Manage Listing</button>`
                    : `<button class="btn-primary" style="flex:1; padding: 0.5rem; font-size: 0.9rem;" onclick="event.stopPropagation(); initiateChat('${prop.sellerId}', '${prop.id}')">
                                ${prop.type === 'For Rent' ? 'Chat to Rent' : (prop.type === 'Sold' ? 'Sold' : 'Chat to Buy')}
                               </button>`
                }
                    </div>
                </div>
            `;
            propertyGrid.appendChild(card);
        } catch (innerErr) {
            console.error("Error rendering card:", innerErr, prop);
        }
    });

    try {
        lucide.createIcons();
    } catch (e) { console.warn("Lucide icons failed:", e); }
};

// --- PROFILE LOGIC ---

const updateProfileUI = async (user, providedData = null) => {

    try {
        let userData = providedData;

        // If no data provided, fetch from Firestore
        if (!userData) {
            // Set placeholders to indicate loading
            const nameInput = document.getElementById('user-name');
            if (nameInput) nameInput.placeholder = "Loading...";

            const userDocRef = doc(db, "users", user.uid);
            const userDocSnap = await getDoc(userDocRef);

            if (userDocSnap.exists()) {
                userData = userDocSnap.data();
                console.log("Firestore Data Fetched:", userData);
            } else {
                console.log("No Firestore document found. Creating default.");
                // Initialize profile if not exists
                userData = {
                    email: user.email,
                    name: user.displayName || '',
                    phone: '',
                    bio: '',
                    createdAt: Timestamp.now()
                };
                // Create the document
                await setDoc(userDocRef, userData, { merge: true });
            }
        }

        // Update Global Cache
        currentUserProfile = userData;

        // Update UI Fields (Safely)
        const setText = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
        const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };

        setText('profile-name', userData.name || "User");
        setText('profile-email', user.email);

        setVal('user-name', userData.name || "");
        setVal('user-phone', userData.phone || "");
        setVal('user-bio', userData.bio || "");

        // Restore placeholder
        const nameInput = document.getElementById('user-name');
        if (nameInput) nameInput.placeholder = "John Doe";

        // Update Avatar
        const avatarEl = document.querySelector('.profile-avatar');
        if (avatarEl) {
            if (userData.photoURL) {
                avatarEl.innerHTML = `<img src="${userData.photoURL}" alt="Profile" style="width:100%; height:100%; object-fit:cover; border-radius:50%;">`;
            } else {
                avatarEl.innerHTML = `<i data-lucide="user"></i>`;
                lucide.createIcons();
            }
        }

        // Calculate Completion
        let filled = 0;
        let total = 4; // Name, Phone, Bio, Email
        if (userData.name) filled++;
        if (userData.phone) filled++;
        if (userData.bio) filled++;
        if (user.email) filled++;

        const percent = Math.round((filled / total) * 100);
        setText('completion-text', percent + "%");
        const fillBar = document.getElementById('completion-fill');
        if (fillBar) fillBar.style.width = percent + "%";

        fetchMyChats();

    } catch (error) {
        if (error.code === 'unavailable' || error.message.includes('offline')) {
            console.log("Offline mode: Using cached data.");
            showToast("You are offline. Showing cached profile.", "info");

            // Fallback to Auth Data if Firestore fails
            if (user) {
                const setText = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
                const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };

                setText('profile-name', user.displayName || "User (Offline)");
                setText('profile-email', user.email);
                setVal('user-name', user.displayName || "");

                // Photo
                const avatarEl = document.querySelector('.profile-avatar');
                if (avatarEl && user.photoURL) {
                    avatarEl.innerHTML = `<img src="${user.photoURL}" alt="Profile" style="width:100%; height:100%; object-fit:cover; border-radius:50%;">`;
                }
            }
        } else {
            console.error("Error in updateProfileUI:", error);
            showToast("Error loading profile. Check console.", "error");
        }
    }
};

const handleProfileUpdate = async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    if (!btn) return;

    const originalText = "Save Changes";
    btn.textContent = "Saving...";
    btn.disabled = true;
    let success = false;

    try {
        console.log("Updating profile...");

        const name = document.getElementById('user-name').value.trim();
        const phone = document.getElementById('user-phone').value.trim();
        const bio = document.getElementById('user-bio').value.trim();

        // Validation
        if (!name) throw new Error("Name is required");

        // India Phone Validation (starts with 6-9, 10 digits total, optional +91)
        if (phone) {
            const phoneRegex = /^(\+91[\-\s]?)?[6789]\d{9}$/;
            if (!phoneRegex.test(phone)) {
                throw new Error("Invalid phone number. usage: 9876543210 or +91 9876543210");
            }
        }

        let newData = {
            name: name,
            phone: phone,
            bio: bio,
            email: currentUser.email
        };

        // File Upload
        // File Upload Removed

        // Save to Firestore
        await setDoc(doc(db, "users", currentUser.uid), newData, { merge: true });
        console.log("Profile saved to Firestore");

        // Update local cache and UI
        if (!currentUserProfile) currentUserProfile = {};
        const mergedData = { ...currentUserProfile, ...newData };
        currentUserProfile = mergedData;

        await updateProfileUI(currentUser, mergedData);

        showToast("Profile updated successfully!");
        success = true;
        btn.textContent = "Saved";
        btn.style.backgroundColor = "#22c55e";
        btn.style.borderColor = "#22c55e";

        // Reset button when user types again
        const inputs = e.target.querySelectorAll('input, textarea');
        const resetBtn = () => {
            btn.textContent = originalText;
            btn.style.backgroundColor = "";
            btn.style.borderColor = "";
            inputs.forEach(i => i.removeEventListener('input', resetBtn));
        };
        inputs.forEach(i => i.addEventListener('input', resetBtn));

    } catch (err) {
        console.error("Error updating profile:", err);
        showToast(err.message, "error");

        // Revert UI if needed (re-fetch)
        await updateProfileUI(currentUser);
    } finally {
        btn.disabled = false;
        if (!success) {
            btn.textContent = originalText;
        }
    }
};

// --- CHAT LOGIC ---

const sendMessage = async (e) => {
    e.preventDefault();
    const input = document.getElementById('chat-input');
    const text = input.value.trim();
    if (!text || !currentChatId) return;

    try {
        input.value = '';
        await addDoc(collection(db, "chats", currentChatId, "messages"), {
            text: text,
            senderId: currentUser.uid,
            createdAt: Timestamp.now()
        });

        await updateDoc(doc(db, "chats", currentChatId), {
            lastMessage: text,
            lastMessageTime: Timestamp.now(),
            lastSenderId: currentUser.uid // Track who sent the last message for notifications
        });

    } catch (err) {
        console.error("Error sending message:", err);
    }
};

const initiateChat = async (sellerId, propertyId) => {

    if (!currentUser) {
        showToast("Please login to chat.", "error");
        window.openModal('auth-modal');
        return;
    }

    if (!sellerId || !propertyId) {
        console.error("Missing sellerId or propertyId");
        showToast("Cannot start chat: Missing property details.", "error");
        return;
    }

    if (!userLikes.has(propertyId)) {
        showToast("You must 'Like' the property before you can chat with the owner.", "error");
        // Highlight the heart button
        const heartBtn = document.querySelector(`button[onclick*="${propertyId}"]`);
        if (heartBtn) {
            heartBtn.style.transform = "scale(1.5)";
            setTimeout(() => heartBtn.style.transform = "scale(1)", 300);
        }
        return;
    }

    const btn = document.querySelector('#detail-modal .btn-primary');
    const originalText = btn ? btn.textContent : "Chat with Seller";
    if (btn) {
        btn.textContent = "Starting Chat...";
        btn.disabled = true;
    }

    try {
        const participants = [currentUser.uid, sellerId].sort();
        // Sanitize Chat ID to ensure it is a valid path
        const chatDocId = `${participants[0]}_${participants[1]}_${propertyId}`;
        console.log("Generated ChatDocId:", chatDocId);

        const chatRef = doc(db, "chats", chatDocId);
        const chatSnap = await getDoc(chatRef);

        let isNewChat = false;

        if (!chatSnap.exists()) {
            console.log("Chat doesn't exist. Creating new chat session in Firestore...");
            await setDoc(chatRef, {
                participants: [currentUser.uid, sellerId],
                propertyId: propertyId,
                createdAt: Timestamp.now(),
                lastMessage: 'Started a new conversation',
                lastMessageTime: Timestamp.now(),
                lastSenderId: currentUser.uid
            });
            isNewChat = true;
            console.log("New chat created.");
        } else {
            console.log("Chat session exists. Loading...");
        }

        window.closeModal('detail-modal');
        // Force switch to messages section
        document.getElementById('nav-messages').click();
        openChat(chatDocId, "Seller");

        // If new, pre-fill or send a hello message
        if (isNewChat) {
            const input = document.getElementById('chat-input');
            input.value = "Hi, I am interested in this property.";
            input.focus();
        }

    } catch (error) {
        console.error("Error in initiateChat:", error);
        showToast(`Chat Error: ${error.message}`, "error");
    } finally {
        if (btn) {
            btn.textContent = originalText;
            btn.disabled = false;
        }
    }
};

let chatsListUnsubscribe = null;

const fetchMyChats = () => {
    // Target the new large list
    const list = document.getElementById('messages-list-large');
    const badge = document.getElementById('msg-badge');

    if (!list) return;

    if (!currentUser) {
        console.error("fetchMyChats called but no currentUser");
        list.innerHTML = '<p style="padding:2rem; text-align:center;">Please login to view messages.</p>';
        return;
    }

    console.log("Starting fetchMyChats for:", currentUser.uid);

    // Only show loading if empty to prevent flickering
    if (list.children.length === 0) {
        list.innerHTML = '<p style="padding:2rem; text-align:center; color:var(--text-light)">Loading conversations...</p>';
    }

    if (chatsListUnsubscribe) chatsListUnsubscribe(); // Clean up previous listener

    // TIMEOUT FALLBACK: If Firestore doesn't respond in 5s
    const loadTimeout = setTimeout(() => {
        if (list.innerHTML.includes('Loading conversations')) {
            list.innerHTML = `
                <div style="text-align:center; padding:2rem;">
                    <p style="color:orange;">Taking longer than expected...</p>
                    <p style="font-size:0.9rem; color:#666">Check your internet connection.</p>
                    <button onclick="window.location.reload()" style="margin-top:1rem; padding:0.5rem 1rem; cursor:pointer;">Reload Page</button>
                    <p style="font-size:0.8rem; margin-top:2rem; color:#999">Debug: User ${currentUser.uid.slice(0, 5)}...</p>
                </div>
            `;
        }
    }, 5000);

    // Use client-side sorting to avoid "Missing Index" errors on the composite query
    const q = query(collection(db, "chats"), where("participants", "array-contains", currentUser.uid));

    chatsListUnsubscribe = onSnapshot(q, (snapshot) => {
        clearTimeout(loadTimeout); // We got data!
        console.log("Chat snapshot received. Docs:", snapshot.size);

        // Handle Notifications using docChanges
        snapshot.docChanges().forEach((change) => {
            if (change.type === "modified" || change.type === "added") {
                const data = change.doc.data();
                // If message is NOT from me, and it is recent
                if (data.lastSenderId && data.lastSenderId !== currentUser.uid) {
                    // Only notify if we are NOT currently looking at this chat
                    if (currentChatId !== change.doc.id) {
                        const timeDiff = Timestamp.now().seconds - (data.lastMessageTime?.seconds || 0);
                        // only notify if within last 10 seconds to avoid spam on load
                        if (timeDiff < 10) {
                            showToast(`New Message: ${data.lastMessage}`, "info");
                        }
                    }
                }
            }
        });

        // Don't wipe if we have data and just updating (optimized rendering would be better, but full re-render is safer for sort)
        list.innerHTML = '';
        if (snapshot.empty) {
            list.innerHTML = '<p style="padding:2rem; text-align:center; color: var(--text-light)">No active conversations.</p>';
            if (badge) { badge.style.display = 'none'; badge.textContent = '0'; }
            return;
        }

        // Convert to array and sort client-side
        let chats = [];
        let unreadCount = 0;

        snapshot.forEach(docSnap => {
            const d = docSnap.data();
            chats.push({ id: docSnap.id, ...d });
            // Simple unread logic: if last sender is not me, count it
            if (d.lastSenderId && d.lastSenderId !== currentUser.uid) {
                unreadCount++;
            }
        });

        // Update Badge
        if (badge) {
            if (unreadCount > 0) {
                badge.style.display = 'block';
                badge.textContent = unreadCount > 9 ? '9+' : unreadCount;
            } else {
                badge.style.display = 'none';
            }
        }

        chats.sort((a, b) => {
            const timeA = a.lastMessageTime ? a.lastMessageTime.seconds : 0;
            const timeB = b.lastMessageTime ? b.lastMessageTime.seconds : 0;
            return timeB - timeA; // Descending
        });

        chats.forEach(chat => {
            const timeAgo = chat.lastMessageTime ? new Date(chat.lastMessageTime.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
            const isUnread = chat.lastSenderId && chat.lastSenderId !== currentUser.uid;

            const item = document.createElement('div');
            item.className = `message-item-large ${isUnread ? 'active' : ''}`;

            // Try to find helper name (other participant)
            // Ideally we fetch user profiles, but for now we use generic
            const title = "Inquiry Chat";

            item.innerHTML = `
                <div class="message-avatar">
                    <i data-lucide="user"></i>
                </div>
                <div class="message-info">
                    <div class="message-header-row">
                        <span class="message-name">${title}</span>
                        <span class="message-time">${timeAgo}</span>
                    </div>
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <span class="message-preview" style="${isUnread ? 'font-weight:600; color:var(--text-dark)' : ''}">
                            ${chat.lastMessage || 'No messages yet'}
                        </span>
                        ${isUnread ? '<div class="unread-indicator"></div>' : ''}
                    </div>
                </div>
            `;
            item.onclick = () => {
                openChat(chat.id, "User");
                // Optimistically mark read (update badge could be handled by real refresh, but clear for now)
                item.classList.remove('active');
                item.querySelector('.unread-indicator')?.remove();
                item.querySelector('.message-preview').style.fontWeight = 'normal';
            };
            list.appendChild(item);
        });

        // Re-init icons for new elements
        try { lucide.createIcons(); } catch (e) { }

    }, (error) => {
        clearTimeout(loadTimeout);
        console.error("Error fetching chats:", error);
        // Show detailed error to user for debugging
        list.innerHTML = `<div style="text-align:center; padding:2rem;">
            <p style="color:red; font-weight:bold;">Unable to load conversations</p>
            <p style="color:var(--text-light); font-size:0.9rem;">${error.message}</p>
            <p style="color:var(--text-light); font-size:0.8rem; font-family:monospace;">Code: ${error.code}</p>
        </div>`;
    });
};

const openChat = async (chatId, partnerName) => {
    document.getElementById('chat-widget').style.display = 'flex';
    document.getElementById('chat-partner-name').textContent = partnerName;
    const list = document.getElementById('chat-message-list');

    // safe check
    if (!list) return;

    list.innerHTML = '<p style="text-align:center; padding:1rem; color:#ccc">Loading messages...</p>';

    currentChatId = chatId;

    try {
        // Listen to messages
        // OPTIMIZATION: Use 'desc' + 'limit' which is often more robust/faster than 'limitToLast'
        const q = query(
            collection(db, "chats", chatId, "messages"),
            orderBy("createdAt", "desc"),
            limit(50)
        );

        if (chatUnsubscribe) chatUnsubscribe();

        chatUnsubscribe = onSnapshot(q, (snapshot) => {
            list.innerHTML = '';

            if (snapshot.empty) {
                list.innerHTML = '<p style="text-align:center; padding:1rem; color:#ccc; font-size:0.8rem;">No messages yet. Say hello!</p>';
                return;
            }

            const messages = [];
            snapshot.forEach(doc => {
                messages.push(doc.data());
            });

            // Reverse to show oldest first (bottom up)
            messages.reverse();

            messages.forEach(msg => {
                const div = document.createElement('div');
                div.className = `message ${msg.senderId === currentUser.uid ? 'sent' : 'received'}`;
                div.textContent = msg.text;
                list.appendChild(div);
            });

            // Scroll to bottom
            list.scrollTop = list.scrollHeight;
        }, (error) => {
            console.error("Error loading messages:", error);
            list.innerHTML = `<div style="color:red; text-align:center; padding:1rem;">
                <p>Error loading messages</p>
                <small>${error.message}</small>
            </div>`;
        });
    } catch (e) {
        console.error("Setup Error:", e);
        list.innerHTML = `<p style="color:red; text-align:center;">Setup Error: ${e.message}</p>`;
    }
};

window.closeChat = () => {
    document.getElementById('chat-widget').style.display = 'none';
    if (chatUnsubscribe) chatUnsubscribe();
    currentChatId = null;
};

// --- AUTH & MAIN ---

// --- AUTH & MAIN ---

const initAuth = () => {
    const isMessagesPage = window.location.pathname.includes('messages.html');
    console.log("Initializing Auth. Page:", isMessagesPage ? "Messages" : "Home");

    const authBtn = document.getElementById('auth-btn');
    const navProfile = document.getElementById('nav-profile-link');

    // New Messages Elements
    const navMessages = document.getElementById('nav-messages');
    const messagesSection = document.getElementById('messages-section');

    const profileSection = document.getElementById('profile-section');
    const heroSection = document.querySelector('.hero');
    const featuredSection = document.querySelector('.featured');

    onAuthStateChanged(auth, (user) => {
        console.log("Auth State Changed:", user ? "Logged In" : "Logged Out");
        currentUser = user;
        if (user) {
            authBtn.textContent = 'Logout';
            navProfile.style.display = 'block';
            if (navMessages) {
                navMessages.style.display = 'block';
                // Fix active state if on messages page
                if (isMessagesPage) {
                    navMessages.href = "#"; // Disable redundant link navigation
                    navMessages.classList.add('active'); // Style it
                } else {
                    navMessages.href = "messages.html";
                }
            }

            authBtn.onclick = (e) => {
                e.preventDefault();
                signOut(auth).then(() => {
                    // Redirect to home on logout
                    window.location.href = "index.html";
                });
            };

            updateProfileUI(user);
            fetchUserLikes(user.uid);
            fetchMyChats(); // Start listening for messages/notifications
        } else {
            // Not logged in
            userLikes = new Set();
            if (!isMessagesPage && typeof renderProperties === 'function') renderProperties(); // Re-render to remove hearts (only if on home)

            authBtn.textContent = 'Login';
            navProfile.style.display = 'none';
            if (navMessages) navMessages.style.display = 'none';

            authBtn.onclick = (e) => {
                e.preventDefault();
                window.openModal('auth-modal');
            };

            if (profileSection) profileSection.style.display = 'none';
            if (messagesSection && !isMessagesPage) messagesSection.style.display = 'none';

            // CRITICAL: If on messages page and not logged in, force Login or Redirect
            if (isMessagesPage) {
                console.warn("User not logged in on Messages page. Redirecting...");
                showToast("Please login to view messages.", "error");
                setTimeout(() => {
                    window.location.href = "index.html";
                }, 1500);
            }
        }
    });

    // Handle Profile Link (Universal)
    if (navProfile) {
        navProfile.addEventListener('click', (e) => {
            e.preventDefault();

            if (isMessagesPage) {
                // On message page, just toggle profile visibility over message list
                // Or we could redirect home? For now, let's just toggle view
                if (profileSection.style.display === 'block') {
                    profileSection.style.display = 'none';
                    if (messagesSection) messagesSection.style.display = 'block';
                } else {
                    profileSection.style.display = 'block';
                    if (messagesSection) messagesSection.style.display = 'none';
                }
            } else {
                // On Home Page
                profileSection.style.display = 'block';
                // Hide others
                if (messagesSection) messagesSection.style.display = 'none';
                if (heroSection) heroSection.style.display = 'none';
                if (featuredSection) featuredSection.style.display = 'none';
            }
        });
    }

    // Refresh Btn logic only needed on Home
    if (!isMessagesPage) {
        // Add Refresh Button to Navbar
        const navContainer = document.querySelector('.nav-links');
        if (navContainer && !document.getElementById('refresh-btn')) {
            const refreshLink = document.createElement('a');
            refreshLink.id = "refresh-btn";
            refreshLink.href = "#";
            refreshLink.innerHTML = '<i data-lucide="refresh-cw"></i>';
            refreshLink.title = "Refresh Properties";
            refreshLink.style.display = "flex";
            refreshLink.style.alignItems = "center";
            refreshLink.onclick = (e) => {
                e.preventDefault();
                refreshLink.querySelector('i').style.animation = "spin 1s linear infinite";
                if (typeof fetchProperties === 'function') fetchProperties(); // Re-trigger fetch
                setTimeout(() => refreshLink.querySelector('i').style.animation = "", 1000);
            };
            // Insert before the profile link or at the end
            navContainer.insertBefore(refreshLink, navContainer.firstChild);
        }
    }

    document.getElementById('profile-form').addEventListener('submit', handleProfileUpdate);
    document.getElementById('chat-form').addEventListener('submit', sendMessage);

    const logoutProf = document.getElementById('logout-btn-profile');
    if (logoutProf) {
        logoutProf.onclick = () => signOut(auth).then(() => window.location.href = "index.html");
    }

    const authForm = document.getElementById('auth-form');
    if (authForm) {
        let isLogin = true;
        const tabLogin = document.getElementById('tab-login');
        const tabRegister = document.getElementById('tab-register');
        const authMessage = document.getElementById('auth-message');

        if (tabLogin && tabRegister) {
            tabLogin.addEventListener('click', () => {
                isLogin = true;
                tabLogin.classList.add('active');
                tabRegister.classList.remove('active');
                authForm.querySelector('button[type="submit"]').textContent = 'Login';
                authMessage.textContent = '';
            });

            tabRegister.addEventListener('click', () => {
                isLogin = false;
                tabRegister.classList.add('active');
                tabLogin.classList.remove('active');
                authForm.querySelector('button[type="submit"]').textContent = 'Register';
                authMessage.textContent = '';
            });
        }

        authForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('auth-email').value;
            const password = document.getElementById('auth-password').value;
            authMessage.className = '';
            authMessage.textContent = 'Processing...';

            try {
                if (isLogin) {
                    await signInWithEmailAndPassword(auth, email, password);
                } else {
                    await createUserWithEmailAndPassword(auth, email, password);
                }
                authMessage.className = 'message-success';
                authMessage.textContent = 'Success!';
                setTimeout(() => {
                    window.closeModal('auth-modal');
                    authForm.reset();
                    authMessage.textContent = '';
                }, 1000);
            } catch (error) {
                authMessage.className = 'message-error';
                authMessage.textContent = error.message.replace('Firebase: ', '');
            }
        });
    }
};


// --- LIKE SYSTEM ---

const fetchUserLikes = (uid) => {
    if (!uid) return;

    // Listen to user likes in real-time
    const q = query(collection(db, "likes"), where("userId", "==", uid));

    onSnapshot(q, (snapshot) => {
        userLikes = new Set();
        snapshot.forEach(doc => {
            userLikes.add(doc.data().propertyId);
        });
        console.log("User likes updated:", userLikes);
        renderProperties(); // Refresh UI to show hearts
    }, (error) => {
        // Suppress permission errors if they happen during logout/initial load
        if (error.code !== 'permission-denied') {
            console.error("Error fetching likes:", error);
        } else {
            console.warn("Permission denied for likes fetch (User might not be authenticated yet or Rules not updated).");
        }
    });
};

window.toggleLike = async (propertyId, event) => {
    if (event) event.stopPropagation();

    if (!currentUser) {
        showToast("Please login to like properties", "error");
        window.openModal('auth-modal');
        return;
    }

    const likeId = `${propertyId}_${currentUser.uid}`;
    const likeRef = doc(db, "likes", likeId);
    const propRef = doc(db, "properties", propertyId);

    const isLiked = userLikes.has(propertyId);

    // Optimistic UI Update
    const heartIcon = document.getElementById(`heart-${propertyId}`);
    const countSpan = document.getElementById(`count-${propertyId}`);
    let currentCount = parseInt(countSpan ? countSpan.textContent : "0") || 0;

    if (heartIcon) {
        if (isLiked) {
            heartIcon.classList.remove('fill-red');
            heartIcon.setAttribute('stroke', 'currentColor');
            heartIcon.style.fill = 'none';
            if (countSpan) countSpan.textContent = Math.max(0, currentCount - 1);
        } else {
            heartIcon.classList.add('fill-red');
            heartIcon.style.fill = '#ef4444';
            heartIcon.style.stroke = '#ef4444';
            if (countSpan) countSpan.textContent = currentCount + 1;
        }
    }

    try {
        if (isLiked) {
            // Unlike
            await deleteDoc(likeRef);
            await updateDoc(propRef, {
                likesCount: increment(-1)
            });
            showToast("Property unliked");
        } else {
            // Like
            await setDoc(likeRef, {
                propertyId: propertyId,
                userId: currentUser.uid,
                timestamp: Timestamp.now()
            });
            await updateDoc(propRef, {
                likesCount: increment(1)
            });
            showToast("Property liked!", "success");
        }
    } catch (error) {
        console.error("Error toggling like:", error);
        showToast("Error update like: " + error.message, "error");
        // Revert UI on error (fetchUserLikes will eventually fix it too)
        fetchUserLikes(currentUser.uid);
    }
};



// Delete Property Logic
window.deleteProperty = async (id) => {
    if (!confirm("Are you sure you want to delete this property permanently?")) return;

    const btn = document.querySelector('#detail-modal .btn-primary');
    if (btn) btn.textContent = "Deleting...";

    try {
        await deleteDoc(doc(db, "properties", id));
        showToast("Property deleted successfully.");
        window.closeModal('detail-modal');
    } catch (error) {
        console.error("Error deleting property:", error);
        showToast("Failed to delete property: " + error.message, "error");
        if (btn) btn.textContent = "Delete Listing";
    }
};

// Mark as Sold Logic
window.markAsSold = async (id) => {
    if (!confirm("Mark this property as SOLD?")) return;

    try {
        await updateDoc(doc(db, "properties", id), {
            type: 'Sold'
        });
        showToast("Property marked as Sold!");
        window.closeModal('detail-modal');
    } catch (error) {
        console.error("Error marking as sold:", error);
        showToast("Error: " + error.message, "error");
    }
};

// Open Detail View
window.openPropertyDetail = (id) => {
    const prop = properties.find(p => p.id === id);
    if (!prop) return;

    // Populate Modal
    document.getElementById('detail-img').src = prop.image;
    document.getElementById('detail-tag').textContent = prop.type;
    document.getElementById('detail-title').textContent = prop.title;
    document.getElementById('detail-address').textContent = prop.address;
    document.getElementById('detail-price').textContent = formatCurrency(prop.price) + (prop.type === 'For Rent' ? '/mo' : '');
    document.getElementById('detail-beds').textContent = prop.beds;
    document.getElementById('detail-baths').textContent = prop.baths;
    document.getElementById('detail-area').textContent = prop.sqft;

    // Additional Fields
    let description = prop.description || "No description provided.";
    if (prop.category) description = `Category: ${prop.category}\n` + description;
    if (prop.sellerName) description += `\n\nListed by: ${prop.sellerName}`;

    document.getElementById('detail-desc').innerText = description;

    // Handle Buttons
    const btnContainer = document.querySelector('#detail-modal .modal-content .detail-info');

    // Check if wrapper exists, if not create from the old button
    let btnWrapper = document.getElementById('action-buttons-wrapper');
    if (!btnWrapper) {
        const oldBtn = btnContainer.querySelector('.btn-primary');
        if (oldBtn) {
            btnWrapper = document.createElement('div');
            btnWrapper.id = 'action-buttons-wrapper';
            btnWrapper.style.display = 'flex';
            btnWrapper.style.gap = '10px';
            btnWrapper.style.marginTop = '1rem';
            oldBtn.replaceWith(btnWrapper);
        }
    }

    if (btnWrapper) {
        btnWrapper.innerHTML = ''; // Clear previous

        if (currentUser && prop.sellerId === currentUser.uid) {
            // Owner Actions

            if (prop.type !== 'Sold') {
                const soldBtn = document.createElement('button');
                soldBtn.className = 'btn-primary';
                soldBtn.textContent = "Mark as Sold";
                soldBtn.style.background = "#ca8a04"; // Yellow/Gold
                soldBtn.onclick = () => window.markAsSold(prop.id);
                btnWrapper.appendChild(soldBtn);
            }

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'btn-primary';
            deleteBtn.textContent = "Delete Listing";
            deleteBtn.style.background = "#ef4444"; // Red
            deleteBtn.onclick = () => window.deleteProperty(prop.id);
            btnWrapper.appendChild(deleteBtn);

        } else {
            // Buyer Actions
            if (prop.type === 'Sold') {
                const soldLabel = document.createElement('button');
                soldLabel.className = 'btn-primary';
                soldLabel.textContent = "Property Sold";
                soldLabel.disabled = true;
                soldLabel.style.background = "#94a3b8";
                soldLabel.style.cursor = "not-allowed";
                btnWrapper.appendChild(soldLabel);
            } else {
                const chatBtn = document.createElement('button');
                chatBtn.className = 'btn-primary';
                chatBtn.textContent = prop.type === 'For Rent' ? "Chat to Rent" : "Chat to Buy";
                chatBtn.onclick = () => initiateChat(prop.sellerId, prop.id);
                btnWrapper.appendChild(chatBtn);
            }
        }
    }

    window.openModal('detail-modal');
};

// Modal Logic
window.openModal = (modalId) => {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    modal.style.display = 'flex';
    setTimeout(() => modal.classList.add('show'), 10);
};

window.closeModal = (modalId) => {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    modal.classList.remove('show');
    setTimeout(() => {
        modal.style.display = 'none';
        if (modalId === 'add-modal') {
            document.getElementById('add-property-form').reset();
        }
    }, 300);
};

window.onclick = (event) => {
    if (event.target.classList.contains('modal')) {
        window.closeModal(event.target.id);
    }
};

// Handle Add Property
const addForm = document.getElementById('add-property-form');
if (addForm) {
    addForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (!currentUser) {
            showToast("You must be logged in to list a property.", "error");
            return;
        }

        const submitBtn = addForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerText;
        submitBtn.textContent = 'Saving to Database...';
        submitBtn.disabled = true;

        try {
            const newProperty = {
                title: document.getElementById('prop-title').value.trim(),
                image: document.getElementById('prop-image').value.trim(),
                price: Number(document.getElementById('prop-price').value),
                type: document.getElementById('prop-type').value,
                category: document.getElementById('prop-category').value,
                city: document.getElementById('prop-city').value,
                address: document.getElementById('prop-address').value.trim() + ", " + document.getElementById('prop-city').value,
                beds: Number(document.getElementById('prop-beds').value),
                baths: Number(document.getElementById('prop-baths').value),
                sqft: Number(document.getElementById('prop-area').value),
                description: document.getElementById('prop-desc').value.trim(),
                createdAt: Timestamp.now(),
                sellerId: currentUser.uid,
                sellerName: (currentUserProfile && currentUserProfile.name) ? currentUserProfile.name : "Private Seller",
                likesCount: 0
            };

            console.log("Sending to Firestore...", newProperty);

            // Send to backend
            const docRef = await addDoc(collection(db, "properties"), newProperty);
            console.log("Document written successfully with ID", docRef.id);

            // Success!
            // Success!
            window.closeModal('add-modal');
            showToast("Property SAVED permanently!", "success");
            addForm.reset();

            // CLEAR SEARCH FILTERS so the new property is visible!
            document.getElementById('search-location').value = '';
            document.getElementById('search-type').value = 'Any Type';
            document.getElementById('search-price').value = 'Any Price';

            // Reset Tabs to All
            const tabs = document.querySelectorAll('.search-tabs .tab');
            tabs.forEach(t => t.classList.remove('active'));
            if (tabs.length > 0) tabs[0].classList.add('active'); // Assuming first is All

            // Force re-render to reflect cleared filters
            renderProperties();

        } catch (e) {
            console.error("Error adding document: ", e);
            showToast(`SAVE FAILED: ${e.message}`, "error");
            alert(`Failed to save property. Error: ${e.message}\nPlease check your internet connection.`);
        } finally {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    fetchProperties();
    initAuth();
    lucide.createIcons();

    // Sell Button Hook (Fix)
    // We attach listener to document to handle potential issues with element selection timing
    document.addEventListener('click', (e) => {
        const link = e.target.closest('a[href="#sell"]');
        if (link) {
            e.preventDefault();
            if (currentUser) {
                window.openModal('add-modal');
            } else {
                showToast("Please login to list your property", "error");
                window.openModal('auth-modal');
            }
        }
    });

    // Home Button Hook
    const homeLink = document.getElementById('nav-home');
    if (homeLink) {
        homeLink.addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('profile-section').style.display = 'none';
            document.querySelector('.hero').style.display = 'flex';
            document.querySelector('.featured').style.display = 'block';
            document.querySelector('.services').style.display = 'block'; // Make sure services are visible too
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // Search Button
    const searchBtn = document.getElementById('search-submit-btn');
    if (searchBtn) {
        searchBtn.addEventListener('click', renderProperties);
    }

    // Search Tabs Logic
    const tabs = document.querySelectorAll('.search-tabs .tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            // Remove active from all
            tabs.forEach(t => t.classList.remove('active'));
            // Add active to clicked
            e.target.classList.add('active');
            // Re-render properties based on new filter
            renderProperties();
        });
    });

    // Tools Logic - EMI Calculator
    window.calculateEMI = () => {
        const p = parseFloat(document.getElementById('emi-amount').value);
        const r = parseFloat(document.getElementById('emi-rate').value);
        const n = parseFloat(document.getElementById('emi-years').value);

        if (!p || !r || !n) {
            showToast("Please enter all details", "error");
            return;
        }

        const monthlyRate = r / 12 / 100;
        const months = n * 12;

        const emi = p * monthlyRate * Math.pow(1 + monthlyRate, months) / (Math.pow(1 + monthlyRate, months) - 1);

        document.getElementById('emi-result').style.display = 'block';
        document.getElementById('emi-value').innerText = Math.round(emi).toLocaleString('en-IN');
    };

    // Tools Logic - Area Converter
    const unitMap = {
        'sqft': 1,
        'sqm': 10.764,
        'acre': 43560,
        'guntha': 1089
    };

    const convertArea = () => {
        const val = parseFloat(document.getElementById('conv-input').value);
        const from = document.getElementById('conv-from').value;
        const to = document.getElementById('conv-to').value;

        if (!val) {
            document.getElementById('conv-result').innerText = "Result: 0";
            return;
        }

        // Convert to sqft first
        const inSqft = val * unitMap[from];
        // Convert to target
        const result = inSqft / unitMap[to];

        document.getElementById('conv-result').innerText = `Result: ${result.toFixed(2)} ${to}`;
    };

    // Attach listeners for converter
    const convElements = ['conv-input', 'conv-from', 'conv-to'];
    convElements.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('input', convertArea);
    });

    // Dummy Property button removed for production

});
