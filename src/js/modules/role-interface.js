const APP_CITY = "Delhi";
const FEED_STATS_STORAGE_KEY = "healixFeedStats";
const SERVICE_STORAGE_KEY = "healixServices";
const SERVICE_HISTORY_KEY = "healixServiceHistory";
const SERVICE_RATINGS_KEY = "healixServiceRatings";
const PROFILE_STORAGE_KEY = "healixUserProfiles";
const FRIENDS_STORAGE_KEY = "healixFriendGraph";
const POSTS_STORAGE_KEY = "healixPosts";
const MESSAGES_STORAGE_KEY = "healixMessages";
const CONVERSATIONS_STORAGE_KEY = "healixConversations";
const NOTIFICATIONS_STORAGE_KEY = "healixNotifications";
const PRIVACY_STORAGE_KEY = "healixPrivacySettings";

const doctors = [
  { id: 1, name: "Dr. A. Mehra", specialization: "General Physician", locality: "Dwarka", phone: "9876543210", verified: true },
  { id: 2, name: "Dr. N. Bhatia", specialization: "Nutrition", locality: "Rohini", phone: "9988776655", verified: true },
  { id: 3, name: "Dr. S. Gupta", specialization: "Child Specialist", locality: "Saket", phone: "9911002200", verified: true }
];

const vendors = [
  { id: 1, business: "Fresh Basket", category: "Fruits & Vegetables", locality: "Janakpuri", phone: "9001002003", verified: true },
  { id: 2, business: "Fit Fuel Store", category: "Supplements", locality: "Dwarka", phone: "9001002004", verified: true },
  { id: 3, business: "GreenMart Delhi", category: "Organic Foods", locality: "Rohini", phone: "9001002099", verified: true }
];

const root = document.getElementById("role-interface");
const activeRole = root?.dataset.role || "public";
const currentUserId = localStorage.getItem("prototypeEmail") || `${activeRole}:guest`;
const cityNode = document.getElementById("city-label");
const roleNode = document.getElementById("role-label");
const bottomButtons = document.querySelectorAll(".bottom-nav button");
const sections = document.querySelectorAll("[data-section]");
const BACKEND_AVAILABLE = window.location.protocol === "http:" || window.location.protocol === "https:";
const backendState = loadBackendState();

const defaultPosts = [
  { id: 1, author: "Doug Out", subtitle: "wonder-ful day!", body: "Sharing a light evening walk and hydration reminder for everyone.", media: "post-media-large" },
  { id: 2, author: "Dr. A. Mehra", subtitle: "Delhi Health Tip", body: "Mild headache? Rest, hydrate, and avoid screen strain for an hour.", media: "post-media-small" },
  { id: 3, author: "Fresh Basket", subtitle: "Vendor Update", body: "Fresh apples, mangoes, and spinach stocked today in Janakpuri.", media: "post-media-small" }
];

let dummyPosts = loadPosts();

const conversations = loadJson(CONVERSATIONS_STORAGE_KEY, ["HARI", "Animesh", "Hitesh", "Riya", "Kunal", "Neha", "Aarav", "Meera", "Kabir", "Tanya", "Ishaan", "Priya"]);
const messagesByConversation = loadJson(MESSAGES_STORAGE_KEY, {
  HARI: [
    { from: "HARI", body: "hey whats up" },
    { from: "You", body: "good, what about you?" },
    { from: "HARI", body: "I am having high headache since morning. what should I do?" }
  ],
  Animesh: [
    { from: "Animesh", body: "Can you share the doctor list near Dwarka?" },
    { from: "You", body: "Sure, I found a few verified options." }
  ],
  Hitesh: [
    { from: "Hitesh", body: "Is the evening walk plan still on?" },
    { from: "You", body: "Yes, 6 PM works for me." }
  ],
  Riya: [{ from: "Riya", body: "Do you know a good nutrition vendor nearby?" }],
  Kunal: [{ from: "Kunal", body: "I saved the hydration post. It was useful." }],
  Neha: [{ from: "Neha", body: "Please remind me about the appointment booking." }],
  Aarav: [{ from: "Aarav", body: "Can you check if the service section has vendors?" }],
  Meera: [{ from: "Meera", body: "The chatbot gave me a simple diet table." }],
  Kabir: [{ from: "Kabir", body: "I need a general physician recommendation." }],
  Tanya: [{ from: "Tanya", body: "Does green flag mean doctor approved?" }],
  Ishaan: [{ from: "Ishaan", body: "Can I message a vendor from here?" }],
  Priya: [{ from: "Priya", body: "Adding more fruits helped my routine." }]
});

let feedStats = loadJson(FEED_STATS_STORAGE_KEY, {});
let services = loadServices();
let serviceHistory = loadJson(SERVICE_HISTORY_KEY, []);
let serviceRatings = loadJson(SERVICE_RATINGS_KEY, {});
let friendGraph = loadJson(FRIENDS_STORAGE_KEY, {});
let notifications = loadJson(NOTIFICATIONS_STORAGE_KEY, []);
let privacySettings = loadJson(PRIVACY_STORAGE_KEY, {});
let activeConversation = conversations[0];
let userProfile = loadUserProfile();
let activeServiceTab = activeRole === "doctor" ? "doctors" : activeRole === "vendor" ? "vendors" : "vendors";
let expandedServiceId = null;

const chatbotMessages = [
  { from: "You", body: "good, what about you? im having a very high headache since morning, what should i do ?" },
  {
    from: "Bot",
    body:
      "this is normal, just follow the given table:<br />" +
      "fruits and vegetables: apple, mango, potato<br />" +
      "exercise: pranayam<br />" +
      "doctors: dr abc contact, dr dse contact<br />" +
      "vendors: zxc contact, bbd contact<br /><br />" +
      "immediate: lay down and drink some water with lemon essence"
  }
];

if (cityNode) cityNode.textContent = `Serving: ${APP_CITY}`;
if (roleNode) roleNode.textContent = activeRole.charAt(0).toUpperCase() + activeRole.slice(1);

function loadBackendState() {
  if (!BACKEND_AVAILABLE) return null;
  try {
    const request = new XMLHttpRequest();
    request.open("GET", "/api/state", false);
    request.send(null);
    if (request.status >= 200 && request.status < 300) return JSON.parse(request.responseText);
  } catch {
    return null;
  }
  return null;
}

function loadJson(key, fallback) {
  try {
    if (backendState && Object.prototype.hasOwnProperty.call(backendState, key)) {
      const backendValue = backendState[key];
      if (backendValue !== undefined && backendValue !== null) return backendValue;
    }
    return JSON.parse(localStorage.getItem(key)) || fallback;
  } catch {
    return fallback;
  }
}

function saveJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
  if (!BACKEND_AVAILABLE) return;
  fetch(`/api/state/${encodeURIComponent(key)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ value })
  }).catch(() => {});
}
function loadUserProfile() {
  const profiles = loadJson(PROFILE_STORAGE_KEY, {});
  if (!profiles[currentUserId]) {
    profiles[currentUserId] = {
      username: titleCase((currentUserId.split("@")[0] || activeRole).replaceAll(".", " ")),
      password: "",
      mobile: "Not provided",
      email: localStorage.getItem("prototypeEmail") || "Not registered",
      aboutMe: "Tell people about your health journey."
    };
  }
  if (!profiles[currentUserId].profileId) profiles[currentUserId].profileId = createProfileId(currentUserId);
  profiles[currentUserId].role = profiles[currentUserId].role || activeRole;
  if (!profiles[currentUserId].aboutMe) profiles[currentUserId].aboutMe = "Tell people about your health journey.";
  saveJson(PROFILE_STORAGE_KEY, profiles);
  return profiles[currentUserId];
}
function saveUserProfile(nextProfile) {
  const profiles = loadJson(PROFILE_STORAGE_KEY, {});
  profiles[currentUserId] = nextProfile;
  saveJson(PROFILE_STORAGE_KEY, profiles);
  userProfile = nextProfile;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function moneyLabel(value, fallback = "On request") {
  const cleanValue = String(value || "").trim();
  if (!cleanValue) return fallback;
  if (/request|fee/i.test(cleanValue) || cleanValue.startsWith("Rs")) return cleanValue;
  return `Rs ${cleanValue}`;
}

function normalizePost(post, index = 0) {
  const ownerProfileId = post.profileId || createProfileId(post.author || post.ownerId || `post-${index}`);
  return {
    id: post.id || Date.now() + index,
    ownerId: post.ownerId || post.email || ownerProfileId,
    profileId: ownerProfileId,
    author: post.author || "Healix User",
    subtitle: post.subtitle || "Health update",
    body: post.body || "",
    media: post.media || "post-media-small",
    kind: post.kind || "Post",
    visibility: post.visibility || "public",
    createdAt: post.createdAt || new Date().toISOString()
  };
}

function loadPosts() {
  const seeded = defaultPosts.map((post, index) => normalizePost({ ...post, ownerId: ["doug@healix.demo", "doctor@healthsocial.demo", "vendor@healthsocial.demo"][index], profileId: ["doug-out", "doctor-demo", "vendor-demo"][index] }, index));
  const saved = loadJson(POSTS_STORAGE_KEY, null);
  if (Array.isArray(saved) && saved.length) return saved.map(normalizePost);
  saveJson(POSTS_STORAGE_KEY, seeded);
  return seeded;
}

function savePosts() {
  saveJson(POSTS_STORAGE_KEY, dummyPosts);
}

function saveConversations() {
  saveJson(CONVERSATIONS_STORAGE_KEY, conversations);
  saveJson(MESSAGES_STORAGE_KEY, messagesByConversation);
}

function saveNotifications() {
  saveJson(NOTIFICATIONS_STORAGE_KEY, notifications);
}

function addNotification(text, profileId = "") {
  notifications.unshift({ id: Date.now(), text, profileId, at: new Date().toISOString(), read: false });
  notifications = notifications.slice(0, 30);
  saveNotifications();
}

function savePrivacySettings() {
  saveJson(PRIVACY_STORAGE_KEY, privacySettings);
}

function getPrivacyForCurrentUser() {
  if (!privacySettings[currentUserId]) privacySettings[currentUserId] = { showEmail: false, showMobile: false, blockedProfileIds: [] };
  return privacySettings[currentUserId];
}

function getBlockedIds() {
  return getPrivacyForCurrentUser().blockedProfileIds || [];
}

function isBlocked(profileId) {
  return getBlockedIds().includes(profileId);
}

function blockProfile(profileId) {
  const profile = findProfileById(profileId);
  if (!profile || profile.userId === currentUserId) return;
  const privacy = getPrivacyForCurrentUser();
  privacy.blockedProfileIds = Array.from(new Set([...(privacy.blockedProfileIds || []), profile.profileId]));
  friendGraph[currentUserId] = getMyFriendIds().filter((id) => id !== profile.profileId);
  saveFriendGraph(friendGraph);
  savePrivacySettings();
  addNotification(`Blocked @${profile.profileId}`, profile.profileId);
  closeOverlay();
}
function loadServices() {
  const saved = loadJson(SERVICE_STORAGE_KEY, null);
  if (Array.isArray(saved) && saved.length) return saved;
  const seeded = seedServices();
  saveJson(SERVICE_STORAGE_KEY, seeded);
  return seeded;
}

function seedServices() {
  return [
    ...vendors.map((vendor) => ({
      id: `vendor-seed-${vendor.id}`,
      type: "vendor",
      ownerId: `seed-vendor-${vendor.id}`,
      providerName: vendor.business,
      title: vendor.category,
      category: vendor.category,
      description: `Verified ${vendor.category.toLowerCase()} supplier serving ${vendor.locality}, ${APP_CITY}. Contact directly for availability and delivery decisions.`,
      mrp: "On request",
      phone: vendor.phone,
      address: `${vendor.locality}, ${APP_CITY}`,
      images: [],
      createdAt: new Date().toISOString()
    })),
    ...doctors.map((doctor) => ({
      id: `doctor-seed-${doctor.id}`,
      type: "doctor",
      ownerId: `seed-doctor-${doctor.id}`,
      providerName: doctor.name,
      title: doctor.specialization,
      category: doctor.specialization,
      description: `Verified ${doctor.specialization.toLowerCase()} consultation in ${doctor.locality}, ${APP_CITY}. Patients can call and coordinate appointments directly.`,
      mrp: "Consultation fee on request",
      phone: doctor.phone,
      address: `${doctor.locality}, ${APP_CITY}`,
      images: [],
      createdAt: new Date().toISOString()
    }))
  ];
}

function setSection(tab) {
  sections.forEach((section) => {
    section.hidden = section.dataset.section !== tab;
  });
  bottomButtons.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.tab === tab);
  });
}

function saveFeedStats() {
  saveJson(FEED_STATS_STORAGE_KEY, feedStats);
}

function ensurePostStats(postId) {
  const key = String(postId);
  if (!feedStats[key]) feedStats[key] = { likedBy: [], dislikedBy: [], savedBy: [], greenFlaggedBy: [], shares: [] };
  return feedStats[key];
}

function hasValue(list, value) {
  return Array.isArray(list) && list.includes(value);
}

function toggleValue(list, value) {
  if (hasValue(list, value)) return list.filter((item) => item !== value);
  return [...list, value];
}

function getPostState(postId) {
  const stats = ensurePostStats(postId);
  return {
    likes: stats.likedBy.length,
    dislikes: stats.dislikedBy.length,
    shares: stats.shares.length,
    flagged: stats.greenFlaggedBy.length > 0,
    liked: hasValue(stats.likedBy, currentUserId),
    disliked: hasValue(stats.dislikedBy, currentUserId),
    saved: hasValue(stats.savedBy, currentUserId)
  };
}

function actionLabel(action, state) {
  if (action === "like") return `Like${state.likes ? ` ${state.likes}` : ""}`;
  if (action === "dislike") return `Dislike${state.dislikes ? ` ${state.dislikes}` : ""}`;
  if (action === "share") return `Share${state.shares ? ` ${state.shares}` : ""}`;
  if (action === "save") return state.saved ? "Saved" : "Save";
  if (action === "flag") return state.flagged ? "Green Flagged" : "Green Flag";
  return action;
}

function renderPostActions(postId) {
  const state = getPostState(postId);
  const flagLocked = activeRole !== "doctor";
  return `
    <button class="post-action ${state.liked ? "active" : ""}" type="button" data-post-id="${postId}" data-action="like">${actionLabel("like", state)}</button>
    <button class="post-action ${state.disliked ? "active" : ""}" type="button" data-post-id="${postId}" data-action="dislike">${actionLabel("dislike", state)}</button>
    <button class="post-action green-flag ${state.flagged ? "active" : ""}" type="button" data-post-id="${postId}" data-action="flag" ${flagLocked ? "disabled title=\"Only doctor users can green flag posts\"" : ""}>${actionLabel("flag", state)}</button>
    <button class="post-action" type="button" data-post-id="${postId}" data-action="share">${actionLabel("share", state)}</button>
    <button class="post-action ${state.saved ? "active" : ""}" type="button" data-post-id="${postId}" data-action="save">${actionLabel("save", state)}</button>
  `;
}

function renderShareMenu(post) {
  return `
    <div class="share-menu" data-share-menu="${post.id}">
      <p>Share this post</p>
      <button type="button" data-share-target="whatsapp" data-post-id="${post.id}">WhatsApp</button>
      <button type="button" data-share-target="facebook" data-post-id="${post.id}">Facebook</button>
      <label>Message friend <select data-share-friend="${post.id}">${(getMyFriendIds().map(findProfileById).filter(Boolean).map((friend) => friend.username).concat(conversations)).filter((name, index, list) => list.indexOf(name) === index).map((name) => `<option value="${escapeHtml(name)}">${escapeHtml(name)}</option>`).join("")}</select></label>
      <button type="button" data-share-target="friend" data-post-id="${post.id}">Send</button>
    </div>`;
}

function getPostById(postId) {
  return dummyPosts.find((post) => post.id === postId);
}

function postShareText(post) {
  return `${post.author}: ${post.body}`;
}

function recordShare(postId, channel, target = "") {
  const stats = ensurePostStats(postId);
  const shareKey = `${currentUserId}:${channel}:${target}`;
  if (!stats.shares.includes(shareKey)) {
    stats.shares.push(shareKey);
    saveFeedStats();
  }
  renderFeed();
}

function openExternalShare(post, channel) {
  const text = encodeURIComponent(postShareText(post));
  const url = encodeURIComponent(window.location.href);
  const shareUrl = channel === "whatsapp" ? `https://wa.me/?text=${text}` : `https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${text}`;
  window.open(shareUrl, "_blank", "noopener,noreferrer");
  recordShare(post.id, channel);
}

function shareToFriend(post, friendName) {
  if (!messagesByConversation[friendName]) messagesByConversation[friendName] = [];
  messagesByConversation[friendName].push({ from: "You", body: `Shared post - ${escapeHtml(postShareText(post))}` });
  saveConversations();
  recordShare(post.id, "friend", friendName);
}

function handlePostAction(event) {
  const button = event.target.closest("[data-action][data-post-id]");
  if (!button) return;
  const postId = Number(button.dataset.postId);
  const action = button.dataset.action;
  const stats = ensurePostStats(postId);

  if (action === "like") {
    stats.likedBy = toggleValue(stats.likedBy, currentUserId);
    if (hasValue(stats.likedBy, currentUserId)) stats.dislikedBy = stats.dislikedBy.filter((userId) => userId !== currentUserId);
  }
  if (action === "dislike") {
    stats.dislikedBy = toggleValue(stats.dislikedBy, currentUserId);
    if (hasValue(stats.dislikedBy, currentUserId)) stats.likedBy = stats.likedBy.filter((userId) => userId !== currentUserId);
  }
  if (action === "share") {
    renderFeed(postId);
    return;
  }
  if (action === "save") stats.savedBy = toggleValue(stats.savedBy, currentUserId);
  if (action === "flag" && activeRole === "doctor") stats.greenFlaggedBy = toggleValue(stats.greenFlaggedBy, currentUserId);
  saveFeedStats();
  renderFeed();
}

function handleShareChoice(event) {
  const button = event.target.closest("[data-share-target][data-post-id]");
  if (!button) return;
  const postId = Number(button.dataset.postId);
  const post = getPostById(postId);
  if (!post) return;
  const target = button.dataset.shareTarget;
  if (target === "whatsapp" || target === "facebook") openExternalShare(post, target);
  if (target === "friend") {
    const friendSelect = document.querySelector(`[data-share-friend="${postId}"]`);
    shareToFriend(post, friendSelect?.value || activeConversation);
  }
}

function createProfileId(value) {
  return String(value || "healix-user")
    .toLowerCase()
    .replace(/@.*$/, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "healix-user";
}

function seedProfileDirectory() {
  const profiles = loadJson(PROFILE_STORAGE_KEY, {});
  const seeds = [
    { id: "public-demo", userId: "public@healthsocial.demo", username: "Public User", role: "public", email: "public@healthsocial.demo", mobile: "Not provided", aboutMe: "Exploring trusted health posts and local services." },
    { id: "doctor-demo", userId: "doctor@healthsocial.demo", username: "Doctor", role: "doctor", email: "doctor@healthsocial.demo", mobile: "Not provided", aboutMe: "General health guidance and fact-checking for the community." },
    { id: "vendor-demo", userId: "vendor@healthsocial.demo", username: "Vendor", role: "vendor", email: "vendor@healthsocial.demo", mobile: "Not provided", aboutMe: "Listing health products and local service details." },
    { id: "riya-health", userId: "riya@healix.demo", username: "Riya Health", role: "public", email: "riya@healix.demo", mobile: "Not provided", aboutMe: "Saves health tips and shares local service experiences." },
    { id: "doug-out", userId: "doug@healix.demo", username: "Doug Out", role: "public", email: "doug@healix.demo", mobile: "Not provided", aboutMe: "Shares simple everyday wellness moments." },
    { id: "dr-mehra", userId: "dr.mehra@healix.demo", username: "Dr. A. Mehra", role: "doctor", email: "dr.mehra@healix.demo", mobile: "9876543210", aboutMe: "General physician focused on simple, verified advice." },
    { id: "fresh-basket", userId: "fresh.basket@healix.demo", username: "Fresh Basket", role: "vendor", email: "fresh.basket@healix.demo", mobile: "9001002003", aboutMe: "Fresh fruits and vegetables supplier for Delhi users." }
  ];
  seeds.forEach((profile) => {
    if (!profiles[profile.userId]) {
      profiles[profile.userId] = {
        username: profile.username,
        password: "",
        mobile: profile.mobile,
        email: profile.email,
        profileId: profile.id,
        aboutMe: profile.aboutMe,
        role: profile.role
      };
    }
  });
  saveJson(PROFILE_STORAGE_KEY, profiles);
  return profiles;
}

function getProfileDirectory() {
  const profiles = seedProfileDirectory();
  return Object.entries(profiles).map(([userId, profile]) => ({
    userId,
    profileId: profile.profileId || createProfileId(userId),
    username: profile.username || titleCase(createProfileId(userId).replaceAll("-", " ")),
    role: profile.role || (userId.includes("doctor") || userId.includes("dr.") ? "doctor" : userId.includes("vendor") || userId.includes("basket") ? "vendor" : "public"),
    email: profile.email || userId,
    mobile: profile.mobile || "Not provided",
    aboutMe: profile.aboutMe || "No bio added yet."
  }));
}

function findProfileById(profileId) {
  const cleanId = String(profileId || "").trim().toLowerCase().replace(/^@/, "");
  return getProfileDirectory().find((profile) => profile.profileId.toLowerCase() === cleanId || profile.email.toLowerCase() === cleanId);
}

function getMyFriendIds() {
  return Array.isArray(friendGraph[currentUserId]) ? friendGraph[currentUserId] : [];
}

function isFriend(profileId) {
  return getMyFriendIds().includes(profileId);
}

function saveFriendGraph(nextGraph = friendGraph) {
  friendGraph = nextGraph;
  saveJson(FRIENDS_STORAGE_KEY, friendGraph);
}

function conversationNameForProfile(profile) {
  return profile.username;
}

function addFriend(profileId) {
  const profile = findProfileById(profileId);
  if (!profile || profile.userId === currentUserId || isBlocked(profile.profileId)) return;
  const friendIds = getMyFriendIds();
  if (!friendIds.includes(profile.profileId)) {
    const myProfileId = userProfile.profileId || createProfileId(currentUserId);
    const theirIds = Array.isArray(friendGraph[profile.userId]) ? friendGraph[profile.userId] : [];
    saveFriendGraph({
      ...friendGraph,
      [currentUserId]: [...friendIds, profile.profileId],
      [profile.userId]: Array.from(new Set([...theirIds, myProfileId]))
    });
    addNotification(`Added @${profile.profileId} as a friend.`, profile.profileId);
  }
  const conversationName = conversationNameForProfile(profile);
  if (!conversations.includes(conversationName)) conversations.push(conversationName);
  document.getElementById("profile-search-form")?.remove();
  if (!messagesByConversation[conversationName]) messagesByConversation[conversationName] = [{ from: profile.username, body: "Profile connected. You can start a conversation here." }];
  activeConversation = conversationName;
  saveConversations();
  renderMessages();
}
function renderFriendSearchResult(profile) {
  if (!profile) return `<p class="friend-search-empty">No profile found. Try doctor-demo, vendor-demo, public-demo, dr-mehra, fresh-basket, or riya-health.</p>`;
  if (isBlocked(profile.profileId)) return `<p class="friend-search-empty">This profile is blocked from your account.</p>`;
  const mine = profile.userId === currentUserId;
  const alreadyFriend = isFriend(profile.profileId);
  return `
    <article class="friend-result-card">
      <span class="avatar">${escapeHtml(profile.username.charAt(0).toUpperCase())}</span>
      <div>
        <strong>${escapeHtml(profile.username)}</strong>
        <p>${escapeHtml(profile.role)} | @${escapeHtml(profile.profileId)}</p>
      </div>
      <div class="friend-result-actions">
        <button type="button" data-view-profile-id="${escapeHtml(profile.profileId)}">View</button>
        ${mine ? "" : `<button type="button" data-add-friend-id="${escapeHtml(profile.profileId)}">${alreadyFriend ? "Friend" : "Add Friend"}</button><button type="button" data-block-profile-id="${escapeHtml(profile.profileId)}">Block</button>`}
      </div>
    </article>`;
}

function renderFriendSearchPanel() {
  const friends = getMyFriendIds().map(findProfileById).filter(Boolean);
  return `
    <form id="profile-search-form" class="profile-search-form">
      <label for="profile-search-input">Find profile</label>
      <div class="profile-search-row">
        <input id="profile-search-input" name="profileId" placeholder="Enter profile ID" autocomplete="off" />
        <button type="submit">Search</button>
      </div>
      <p class="profile-search-hint">Your ID: @${escapeHtml(userProfile.profileId || createProfileId(currentUserId))}</p>
      <div id="profile-search-result" class="profile-search-result"></div>
      <div class="friend-list-mini">
        <strong>Friends</strong>
        ${friends.length ? friends.map((friend) => `<button type="button" data-view-profile-id="${escapeHtml(friend.profileId)}">${escapeHtml(friend.username)}</button>`).join("") : `<p>No friends added yet.</p>`}
      </div>
    </form>`;
}

function ensureFriendSearchPanel() {
  const list = document.getElementById("conversation-list");
  if (!list || document.getElementById("profile-search-form")) return;
  list.insertAdjacentHTML("beforebegin", renderFriendSearchPanel());
}

function showProfileSearchResult(profile) {
  const result = document.getElementById("profile-search-result");
  if (result) result.innerHTML = renderFriendSearchResult(profile);
}

function renderExternalProfilePanel(profileId) {
  const profile = findProfileById(profileId);
  if (!profile || isBlocked(profile.profileId)) return;
  const friend = isFriend(profile.profileId);
  const targetPrivacy = privacySettings[profile.userId] || { showEmail: false, showMobile: false };
  const profilePosts = dummyPosts.filter((post) => post.profileId === profile.profileId && post.visibility !== "friends");
  overlayShell(
    `
    <section class="profile-mock-shell public-profile-shell">
      <header class="overlay-main-head profile-mock-close">
        <h2>${escapeHtml(profile.username)}</h2>
        <button class="overlay-close-btn" type="button" data-close-overlay aria-label="Close overlay">&times;</button>
      </header>
      <header class="profile-insta-head">
        <div class="profile-insta-avatar-wrap"><img src="../../../log_page_resource/user_circle.png" alt="User" /></div>
        <section class="profile-insta-meta">
          <div class="profile-insta-name-row"><h3>${escapeHtml(profile.username)}</h3><span class="profile-role-chip">${escapeHtml(profile.role)}</span></div>
          <div class="profile-insta-stats"><p><strong>@${escapeHtml(profile.profileId)}</strong> profile id</p><p><strong>${profilePosts.length}</strong> posts</p><p><strong>${friend ? "Added" : "Not added"}</strong> friend</p></div>
          <p class="profile-insta-bio">${escapeHtml(profile.aboutMe)}</p>
          <p class="muted">${targetPrivacy.showEmail ? escapeHtml(profile.email) : "Email private"} · ${targetPrivacy.showMobile ? escapeHtml(profile.mobile) : "Mobile private"}</p>
          <div class="public-profile-actions">
            ${profile.userId === currentUserId ? "" : `<button type="button" data-add-friend-id="${escapeHtml(profile.profileId)}">${friend ? "Friend" : "Add Friend"}</button><button type="button" data-block-profile-id="${escapeHtml(profile.profileId)}">Block</button>`}
            <button type="button" data-message-profile-id="${escapeHtml(profile.profileId)}">Message</button>
          </div>
        </section>
      </header>
      <section class="profile-insta-grid-wrap">
        ${profilePosts.length ? `<section class="profile-insta-grid">${profilePosts.map((post, index) => `<article class="profile-insta-tile tone-${(index % 5) + 1}"><span class="media-kind">${escapeHtml(post.kind || "Post")}</span><p>${escapeHtml(post.body.replace(/<[^>]+>/g, "").slice(0, 28))}</p></article>`).join("")}</section>` : `<p class="muted">No public posts yet.</p>`}
      </section>
    </section>`,
    "overlay-profile"
  );
}
function renderPostComposer() {
  return `
    <form id="post-composer-form" class="post-composer">
      <div class="post-composer-head"><span class="avatar">${escapeHtml((userProfile.username || "U").charAt(0).toUpperCase())}</span><strong>Create post</strong><span>@${escapeHtml(userProfile.profileId || createProfileId(currentUserId))}</span></div>
      <textarea name="body" rows="3" placeholder="Share a health update, question, service note, or useful tip" required></textarea>
      <div class="post-composer-actions">
        <select name="kind" aria-label="Post type"><option>Post</option><option>Photo</option><option>Blog</option><option>Reel</option></select>
        <select name="visibility" aria-label="Visibility"><option value="public">Public</option><option value="friends">Friends</option></select>
        <button type="submit">Post</button>
      </div>
    </form>`;
}

function createPostFromForm(form) {
  const body = form.elements.body.value.trim();
  if (!body) return;
  const kind = form.elements.kind.value;
  const post = normalizePost({
    id: Date.now(),
    ownerId: currentUserId,
    profileId: userProfile.profileId || createProfileId(currentUserId),
    author: userProfile.username || titleCase(activeRole),
    subtitle: `${titleCase(activeRole)} update`,
    body: escapeHtml(body),
    media: kind === "Reel" ? "post-media-large tone-1" : "post-media-small tone-2",
    kind,
    visibility: form.elements.visibility.value,
    createdAt: new Date().toISOString()
  });
  dummyPosts.unshift(post);
  savePosts();
  addNotification("Your post is live on the feed.", post.profileId);
  form.reset();
  renderFeed();
}

function canViewPost(post) {
  if (post.ownerId === currentUserId) return true;
  if (post.visibility !== "friends") return true;
  return isFriend(post.profileId);
}
function renderFeed(openSharePostId = null) {
  const list = document.getElementById("feed-posts");
  if (!list) return;
  const visiblePosts = dummyPosts.filter(canViewPost);
  list.innerHTML = renderPostComposer() + visiblePosts
    .map(
      (post) => `
      <article class="post-card-ui">
        <header class="post-head-ui">
          <button class="avatar avatar-button" type="button" data-view-profile-id="${escapeHtml(post.profileId || createProfileId(post.author))}">${escapeHtml((post.author || "U").charAt(0).toUpperCase())}</button>
          <div><strong>${escapeHtml(post.author)}</strong><p class="muted">${escapeHtml(post.subtitle)} · ${escapeHtml(post.kind || "Post")} · ${escapeHtml(post.visibility || "public")}</p></div>
        </header>
        <div class="${escapeHtml(post.media)}"></div>
        <p>${post.body}</p>
        <footer class="post-actions-ui">${renderPostActions(post.id)}</footer>
        ${openSharePostId === post.id ? renderShareMenu(post) : ""}
      </article>`
    )
    .join("");
}

function renderMessages() {
  ensureFriendSearchPanel();
  const list = document.getElementById("conversation-list");
  const thread = document.getElementById("message-thread");
  if (list) {
    list.innerHTML = conversations
      .map((name) => `<button class="conversation-item ${name === activeConversation ? "active" : ""}" type="button" data-conversation="${name}"><span class="avatar">${name.charAt(0)}</span>${name}</button>`)
      .join("");
  }
  if (thread) {
    const messages = messagesByConversation[activeConversation] || [];
    thread.innerHTML = messages
      .map((message) => {
        const isSelf = message.from === "You";
        return `<div class="bubble-row ${isSelf ? "self" : ""}">${isSelf ? "" : `<span class="avatar">${activeConversation.charAt(0)}</span>`}<div class="chat-bubble">${message.body}</div>${isSelf ? `<span class="avatar">U</span>` : ""}</div>`;
      })
      .join("");
    thread.scrollTop = thread.scrollHeight;
  }
}

function setActiveConversation(name) {
  if (!messagesByConversation[name]) messagesByConversation[name] = [];
  activeConversation = name;
  renderMessages();
}

function sendMessage(body) {
  const cleanBody = body.trim();
  if (!cleanBody) return;
  messagesByConversation[activeConversation].push({ from: "You", body: escapeHtml(cleanBody) });
  saveConversations();
  renderMessages();
}

function renderChatbot() {
  const out = document.getElementById("chatbot-output");
  if (!out) return;
  out.innerHTML = chatbotMessages
    .map((message) => {
      const isSelf = message.from === "You";
      return `<div class="bubble-row ${isSelf ? "self" : ""}">${isSelf ? "" : `<span class="avatar">AI</span>`}<div class="chat-bubble ${isSelf ? "" : "bot"}">${message.body}</div>${isSelf ? `<span class="avatar">U</span>` : ""}</div>`;
    })
    .join("");
  out.scrollTop = out.scrollHeight;
}

function sendChatbotMessage(query) {
  const cleanQuery = query.trim();
  if (!cleanQuery) return;
  chatbotMessages.push({ from: "You", body: escapeHtml(cleanQuery) });
  chatbotMessages.push({ from: "Bot", body: "I noted your message. For health concerns, hydrate, rest, and check the services tab for verified doctors if symptoms continue." });
  renderChatbot();
}

function setServiceButtons() {
  const labels = [
    { tab: "doctors", label: "Doctors" },
    { tab: "vendors", label: "Vendors" },
    { tab: "history", label: "History" }
  ];
  document.querySelectorAll(".mini-options button").forEach((button, index) => {
    const item = labels[index];
    if (!item) return;
    button.dataset.serviceTab = item.tab;
    button.textContent = item.label;
    button.classList.toggle("active", item.tab === activeServiceTab);
  });
}

function serviceTypeFromTab(tab) {
  return tab === "doctors" ? "doctor" : "vendor";
}

function roleCanManage(type) {
  return (activeRole === "vendor" && type === "vendor") || (activeRole === "doctor" && type === "doctor");
}

function serviceRoleCopy(type) {
  if (type === "vendor") {
    return {
      heading: "Add product or service",
      title: "Product or service name",
      category: "Category",
      price: "MRP",
      provider: "Shop name",
      address: "Shop address",
      phone: "Mobile number",
      photos: "Workplace, vendor, and staff photos"
    };
  }
  return {
    heading: "Add doctor service",
    title: "Consultation or treatment name",
    category: "Specialization",
    price: "Consultation fee",
    provider: "Doctor or clinic name",
    address: "Clinic address",
    phone: "Mobile number",
    photos: "Clinic, doctor, and staff photos"
  };
}

function currentProviderName(type) {
  const emailName = currentUserId.split("@")[0]?.replaceAll(".", " ") || "My profile";
  if (type === "vendor") return activeRole === "vendor" ? titleCase(emailName) : "Vendor";
  return activeRole === "doctor" ? `Dr. ${titleCase(emailName).replace(/^Dr\.?\s*/i, "")}` : "Doctor";
}

function titleCase(value) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function renderServiceForm(type) {
  if (!roleCanManage(type)) return "";
  const copy = serviceRoleCopy(type);
  return `
    <form id="service-form" class="service-form" data-service-type="${type}">
      <h3>${copy.heading}</h3>
      <div class="grid two">
        <div><label>${copy.provider}</label><input name="providerName" value="${escapeHtml(currentProviderName(type))}" required /></div>
        <div><label>${copy.title}</label><input name="title" required /></div>
        <div><label>${copy.category}</label><input name="category" required /></div>
        <div><label>${copy.price}</label><input name="mrp" placeholder="499" required /></div>
        <div><label>${copy.phone}</label><input name="phone" inputmode="tel" required /></div>
        <div><label>${copy.address}</label><input name="address" required /></div>
      </div>
      <div><label>Description</label><textarea name="description" required></textarea></div>
      <div><label>${copy.photos}</label><input name="images" type="file" accept="image/*" multiple /></div>
      <button class="btn" type="submit">Publish</button>
    </form>`;
}

function renderServiceImages(service) {
  if (!service.images?.length) return `<div class="service-image-placeholder">No photos uploaded yet</div>`;
  return `<div class="service-gallery">${service.images.map((image) => `<img src="${image}" alt="${escapeHtml(service.providerName)} profile" />`).join("")}</div>`;
}

function getServiceRating(serviceId) {
  const ratings = serviceRatings[serviceId] || {};
  const values = Object.values(ratings)
    .map(Number)
    .filter((value) => Number.isFinite(value) && value >= 1 && value <= 5);
  const total = values.reduce((sum, value) => sum + value, 0);
  return {
    average: values.length ? total / values.length : 0,
    count: values.length,
    mine: Number(ratings[currentUserId] || 0)
  };
}

function ratingSummary(rating) {
  if (!rating.count) return "No ratings yet";
  return `${rating.average.toFixed(1)} / 5 from ${rating.count} ${rating.count === 1 ? "rating" : "ratings"}`;
}

function renderServiceRating(service, compact = false) {
  const rating = getServiceRating(service.id);
  const isOwner = service.ownerId === currentUserId;
  const stars = [1, 2, 3, 4, 5]
    .map(
      (value) =>
        `<button type="button" class="${value <= rating.mine ? "selected" : ""}" data-service-rating="${service.id}" data-rating-value="${value}" ${isOwner ? "disabled" : ""} aria-label="Rate ${value} out of 5">&#9733;</button>`
    )
    .join("");
  return `
    <section class="service-rating ${compact ? "compact" : ""}">
      <div class="service-rating-line"><strong>Rating:</strong> <span>${ratingSummary(rating)}</span></div>
      ${compact ? "" : `<div class="service-stars">${stars}</div><p>${isOwner ? "Your own listing" : rating.mine ? `You rated ${rating.mine} / 5` : "Tap a star to rate this service"}</p>`}
    </section>`;
}

function rateService(serviceId, ratingValue) {
  const service = findServiceById(serviceId);
  const cleanRating = Number(ratingValue);
  if (!service || service.ownerId === currentUserId || !Number.isFinite(cleanRating) || cleanRating < 1 || cleanRating > 5) return;
  serviceRatings[serviceId] = { ...(serviceRatings[serviceId] || {}), [currentUserId]: cleanRating };
  saveJson(SERVICE_RATINGS_KEY, serviceRatings);
  renderServices();
}
function renderServiceCard(service) {
  const expanded = expandedServiceId === service.id;
  const isOwner = service.ownerId === currentUserId;
  const copy = serviceRoleCopy(service.type);
  const rating = getServiceRating(service.id);
  return `
    <article class="service-card service-listing">
      <div class="service-identity">
        <span class="avatar big">${service.type === "doctor" ? "Dr" : "V"}</span>
        <h4>${escapeHtml(service.providerName)}</h4>
        <p>${escapeHtml(service.category)}</p>
        <p class="service-rating-summary">${escapeHtml(ratingSummary(rating))}</p>
      </div>
      <div class="service-details">
        <h3>${escapeHtml(service.title)}</h3>
        <p>${escapeHtml(service.description)}</p>
        <p><strong>${copy.price}:</strong> ${escapeHtml(moneyLabel(service.mrp))}</p>
        ${renderServiceRating(service)}
        <div class="service-actions">
          <button type="button" data-service-detail="${service.id}">${expanded ? "hide details" : "view details"}</button>
          <button type="button" data-service-take="${service.id}">take service</button>
          ${isOwner ? `<button type="button" data-service-remove="${service.id}">remove</button>` : ""}
        </div>
        ${expanded ? `<div class="service-profile"><p><strong>Mobile:</strong> ${escapeHtml(service.phone)}</p><p><strong>${copy.address}:</strong> ${escapeHtml(service.address)}</p>${renderServiceImages(service)}</div>` : ""}
      </div>
    </article>`;
}

function renderHistory() {
  const mine = serviceHistory.filter((entry) => entry.userId === currentUserId || entry.providerOwnerId === currentUserId || findServiceById(entry.serviceId)?.ownerId === currentUserId);
  if (!mine.length) return `<section class="service-empty"><h3>No history yet</h3><p>Services you take or provide will appear here with contact details.</p></section>`;
  return mine
    .map((entry) => {
      const service = findServiceById(entry.serviceId);
      const providerOwnerId = entry.providerOwnerId || service?.ownerId;
      const provided = providerOwnerId === currentUserId && entry.userId !== currentUserId;
      return `
      <article class="service-card service-listing history-entry ${provided ? "provided" : "taken"}">
        <div class="service-identity"><span class="avatar big">${entry.type === "doctor" ? "Dr" : "V"}</span><h4>${escapeHtml(entry.providerName)}</h4><p>${escapeHtml(new Date(entry.takenAt).toLocaleString())}</p></div>
        <div class="service-details"><span class="history-pill">${provided ? "Provided" : "Taken"}</span><h3>${escapeHtml(entry.title)}</h3><p>${escapeHtml(entry.description)}</p>${service ? renderServiceRating(service, true) : ""}<p><strong>Mobile:</strong> ${escapeHtml(entry.phone)}</p><p><strong>Address:</strong> ${escapeHtml(entry.address)}</p></div>
      </article>`;
    })
    .join("");
}

function renderServices() {
  const target = document.getElementById("services-cards");
  if (!target) return;
  setServiceButtons();
  if (activeServiceTab === "history") {
    target.innerHTML = renderHistory();
    return;
  }
  const type = serviceTypeFromTab(activeServiceTab);
  const visibleServices = services.filter((service) => service.type === type);
  target.innerHTML = `
    ${renderServiceForm(type)}
    <section class="service-results">
      <h3>${type === "doctor" ? "Doctor services nearby" : "Vendor products and services nearby"}</h3>
      ${visibleServices.map(renderServiceCard).join("") || `<div class="service-empty">No ${type} services listed yet.</div>`}
    </section>`;
}

function readServiceImages(files) {
  const selected = Array.from(files || []).slice(0, 4);
  return Promise.all(
    selected.map(
      (file) =>
        new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = () => resolve(null);
          reader.readAsDataURL(file);
        })
    )
  ).then((images) => images.filter(Boolean));
}

async function handleServiceSubmit(event) {
  const form = event.target.closest("#service-form");
  if (!form) return;
  event.preventDefault();
  const type = form.dataset.serviceType;
  const images = await readServiceImages(form.elements.images.files);
  services.unshift({
    id: `${type}-${Date.now()}`,
    type,
    ownerId: currentUserId,
    providerName: form.elements.providerName.value.trim(),
    title: form.elements.title.value.trim(),
    category: form.elements.category.value.trim(),
    description: form.elements.description.value.trim(),
    mrp: form.elements.mrp.value.trim(),
    phone: form.elements.phone.value.trim(),
    address: form.elements.address.value.trim(),
    images,
    createdAt: new Date().toISOString()
  });
  saveJson(SERVICE_STORAGE_KEY, services);
  form.reset();
  renderServices();
}

function findServiceById(serviceId) {
  return services.find((service) => service.id === serviceId);
}

function recordServiceHistory(service) {
  serviceHistory.unshift({
    id: `history-${Date.now()}`,
    serviceId: service.id,
    userId: currentUserId,
    providerOwnerId: service.ownerId,
    type: service.type,
    providerName: service.providerName,
    title: service.title,
    description: service.description,
    phone: service.phone,
    address: service.address,
    takenAt: new Date().toISOString()
  });
  saveJson(SERVICE_HISTORY_KEY, serviceHistory);
}

function handleServiceClick(event) {
  const ratingButton = event.target.closest("[data-service-rating]");
  if (ratingButton) {
    rateService(ratingButton.dataset.serviceRating, ratingButton.dataset.ratingValue);
    return;
  }
  const tabButton = event.target.closest("[data-service-tab]");
  if (tabButton) {
    activeServiceTab = tabButton.dataset.serviceTab;
    expandedServiceId = null;
    renderServices();
    return;
  }
  const detailButton = event.target.closest("[data-service-detail]");
  if (detailButton) {
    expandedServiceId = expandedServiceId === detailButton.dataset.serviceDetail ? null : detailButton.dataset.serviceDetail;
    renderServices();
    return;
  }
  const takeButton = event.target.closest("[data-service-take]");
  if (takeButton) {
    const service = services.find((item) => item.id === takeButton.dataset.serviceTake);
    if (service) recordServiceHistory(service);
    activeServiceTab = "history";
    renderServices();
    return;
  }
  const removeButton = event.target.closest("[data-service-remove]");
  if (removeButton) {
    services = services.filter((service) => service.id !== removeButton.dataset.serviceRemove || service.ownerId !== currentUserId);
    saveJson(SERVICE_STORAGE_KEY, services);
    expandedServiceId = null;
    renderServices();
  }
}

function setupHeaderActions() {
  const headerAvatar = document.querySelector(".app-top-strip .avatar");
  if (headerAvatar) {
    const menuButton = document.createElement("button");
    menuButton.id = "account-menu-btn";
    menuButton.className = "icon-ghost-btn";
    menuButton.type = "button";
    menuButton.innerHTML = `<img src="../../../log_page_resource/menu_lines.png" alt="Menu" />`;
    menuButton.title = "Account menu";
    headerAvatar.replaceWith(menuButton);
  }

  const profileButton = document.getElementById("logout-btn");
  if (profileButton) {
    profileButton.id = "profile-open-btn";
    profileButton.className = "icon-ghost-btn";
    profileButton.innerHTML = `<img src="../../../log_page_resource/user_circle.png" alt="Profile" />`;
    profileButton.title = "Profile";
  }
}

function overlayShell(body, panelClass = "") {
  let overlay = document.getElementById("profile-overlay");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "profile-overlay";
    overlay.className = "profile-overlay";
    document.body.appendChild(overlay);
  }
  overlay.innerHTML = `
    <section class="profile-panel ${panelClass}" role="dialog" aria-modal="true">
      ${body}
    </section>`;
  overlay.hidden = false;
}

function closeOverlay() {
  const overlay = document.getElementById("profile-overlay");
  if (overlay) overlay.hidden = true;
}

function renderAccountRail(activeView) {
  return `
    <aside class="overlay-rail">
      <button type="button" class="${activeView === "user" ? "active" : ""}" data-account-view="user">USER</button>
      <button type="button" class="${activeView === "class" ? "active" : ""}" data-account-view="class">CLASS</button>
      <button type="button" class="${activeView === "privacy" ? "active" : ""}" data-account-view="privacy">PRIVACY</button>
      <button type="button" class="${activeView === "notifications" ? "active" : ""}" data-account-view="notifications">NOTIFICATIONS</button>
      <button type="button" data-logout>LOG OUT</button>
      <span class="rail-brand">HEALIX</span>
    </aside>`;
}

function renderAccountPanel(view = "menu") {
  if (view === "user") {
    overlayShell(
      `
      <section class="split-overlay">
        ${renderAccountRail("user")}
        <section class="overlay-main">
          <header class="overlay-main-head">
            <h2>User Settings</h2>
            <button class="overlay-close-btn" type="button" data-close-overlay aria-label="Close overlay">&times;</button>
          </header>
          <form id="account-user-form" class="profile-form">
            <div><label>Username</label><input name="username" value="${escapeHtml(userProfile.username)}" required /></div>
            <div><label>Change password</label><input name="password" type="password" placeholder="New password" /></div>
            <div><label>Mobile number</label><input value="${escapeHtml(userProfile.mobile)}" readonly /></div>
            <div><label>Registered mail</label><input value="${escapeHtml(userProfile.email)}" readonly /></div>
            <div><label>About me</label><textarea name="aboutMe" rows="3" placeholder="Write a short bio">${escapeHtml(userProfile.aboutMe || "")}</textarea></div>
            <button class="btn" type="submit">Save user</button>
          </form>
        </section>
      </section>`,
      "overlay-account"
    );
    return;
  }
  if (view === "class") {
    overlayShell(
      `
      <section class="split-overlay">
        ${renderAccountRail("class")}
        <section class="overlay-main">
          <header class="overlay-main-head">
            <h2>User Class</h2>
            <button class="overlay-close-btn" type="button" data-close-overlay aria-label="Close overlay">&times;</button>
          </header>
          <form id="account-class-form" class="profile-form">
            <label>Class</label>
            <select name="role">
              <option value="public" ${activeRole === "public" ? "selected" : ""}>Public</option>
              <option value="doctor" ${activeRole === "doctor" ? "selected" : ""}>Doctor</option>
              <option value="vendor" ${activeRole === "vendor" ? "selected" : ""}>Vendor</option>
            </select>
            <button class="btn" type="submit">Switch class</button>
          </form>
        </section>
      </section>`,
      "overlay-account"
    );
    return;
  }
  if (view === "privacy") {
    const privacy = getPrivacyForCurrentUser();
    const blocked = getBlockedIds().map(findProfileById).filter(Boolean);
    overlayShell(
      `
      <section class="split-overlay">
        ${renderAccountRail("privacy")}
        <section class="overlay-main">
          <header class="overlay-main-head">
            <h2>Privacy</h2>
            <button class="overlay-close-btn" type="button" data-close-overlay aria-label="Close overlay">&times;</button>
          </header>
          <form id="privacy-form" class="profile-form">
            <label><input type="checkbox" name="showEmail" ${privacy.showEmail ? "checked" : ""} /> Show email on public profile</label>
            <label><input type="checkbox" name="showMobile" ${privacy.showMobile ? "checked" : ""} /> Show mobile number on public profile</label>
            <button class="btn" type="submit">Save privacy</button>
          </form>
          <section class="notification-list">
            <h3>Blocked profiles</h3>
            ${blocked.length ? blocked.map((profile) => `<p>@${escapeHtml(profile.profileId)} - ${escapeHtml(profile.username)}</p>`).join("") : `<p>No blocked profiles.</p>`}
          </section>
        </section>
      </section>`,
      "overlay-account"
    );
    return;
  }
  if (view === "notifications") {
    overlayShell(
      `
      <section class="split-overlay">
        ${renderAccountRail("notifications")}
        <section class="overlay-main">
          <header class="overlay-main-head">
            <h2>Notifications</h2>
            <button class="overlay-close-btn" type="button" data-close-overlay aria-label="Close overlay">&times;</button>
          </header>
          <section class="notification-list">
            ${notifications.length ? notifications.map((note) => `<article><strong>${escapeHtml(note.text)}</strong><p>${new Date(note.at).toLocaleString()}</p></article>`).join("") : `<p>No notifications yet.</p>`}
          </section>
        </section>
      </section>`,
      "overlay-account"
    );
    return;
  }
  renderAccountPanel("user");
}

function getProfileStatCards() {
  const posts = dummyPosts.length;
  const saves = dummyPosts.filter((post) => hasValue(ensurePostStats(post.id).savedBy, currentUserId)).length;
  const flags = dummyPosts.filter((post) => hasValue(ensurePostStats(post.id).greenFlaggedBy, currentUserId)).length;
  return { posts, saves, flags };
}

function getProfileTiles(view) {
  if (view === "saves") {
    return dummyPosts
      .filter((post) => hasValue(ensurePostStats(post.id).savedBy, currentUserId))
      .map((post, index) => ({ kind: "Saved", label: `${post.author}`, tone: `tone-${(index % 5) + 1}` }));
  }
  if (view === "fact") {
    return dummyPosts
      .filter((post) => hasValue(ensurePostStats(post.id).greenFlaggedBy, currentUserId))
      .map((post, index) => ({ kind: "Checked", label: `${post.author}`, tone: `tone-${(index % 5) + 1}` }));
  }
  return dummyPosts
    .filter((post) => post.ownerId === currentUserId || post.profileId === userProfile.profileId)
    .map((post, index) => ({ kind: post.kind || "Post", label: post.body.replace(/<[^>]+>/g, "").slice(0, 28) || post.subtitle, tone: `tone-${(index % 5) + 1}` }));
}

function renderProfileTop(view) {
  const stats = getProfileStatCards();
  return `
    <header class="profile-insta-head">
      <div class="profile-insta-avatar-wrap">
        <img src="../../../log_page_resource/user_circle.png" alt="User" />
      </div>
      <section class="profile-insta-meta">
        <div class="profile-insta-name-row">
          <h3>${escapeHtml(userProfile.username).slice(0, 30)}</h3>
          <span class="profile-role-chip">${escapeHtml(activeRole)}</span>
        </div>
        <div class="profile-insta-stats">
          <p><strong>${stats.posts}</strong> posts</p>
          <p><strong>${stats.saves}</strong> saves</p>
          <p><strong>${stats.flags}</strong> checks</p>
        </div>
        <p class="profile-insta-bio">${escapeHtml(userProfile.aboutMe || "Tell people about your health journey.")}</p>
      </section>
    </header>
    <nav class="profile-insta-tabs">
      <button type="button" class="${view === "profile" ? "active" : ""}" data-profile-view="profile">Posts</button>
      <button type="button" class="${view === "saves" ? "active" : ""}" data-profile-view="saves">Saved</button>
      ${activeRole === "doctor" ? `<button type="button" class="${view === "fact" ? "active" : ""}" data-profile-view="fact">Fact Checked</button>` : ""}
    </nav>`;
}

function renderProfileTileGrid(view) {
  const tiles = getProfileTiles(view);
  if (!tiles.length) return `<section class="profile-insta-grid-wrap"><p class="muted">No items yet.</p></section>`;
  return `
    <section class="profile-insta-grid-wrap">
      <section class="profile-insta-grid">
        ${tiles
          .map(
            (item) => `
          <article class="profile-insta-tile ${item.tone}">
            <span class="media-kind">${escapeHtml(item.kind)}</span>
            <p>${escapeHtml(item.label)}</p>
          </article>`
          )
          .join("")}
      </section>
    </section>`;
}

function renderProfilePanel(view = "profile") {
  if (view === "fact" && activeRole !== "doctor") view = "profile";
  overlayShell(
    `
    <section class="profile-mock-shell">
      <header class="overlay-main-head profile-mock-close">
        <h2>Profile</h2>
        <button class="overlay-close-btn" type="button" data-close-overlay aria-label="Close overlay">&times;</button>
      </header>
      ${renderProfileTop(view)}
      ${renderProfileTileGrid(view)}
    </section>`,
    "overlay-profile"
  );
}
function handleOverlayClick(event) {
  if (event.target.matches("[data-close-overlay]")) closeOverlay();
  const accountView = event.target.closest("[data-account-view]");
  if (accountView) renderAccountPanel(accountView.dataset.accountView);
  const profileView = event.target.closest("[data-profile-view]");
  if (profileView) renderProfilePanel(profileView.dataset.profileView);
  const externalProfile = event.target.closest("[data-view-profile-id]");
  if (externalProfile) renderExternalProfilePanel(externalProfile.dataset.viewProfileId);
  const addFriendButton = event.target.closest("[data-add-friend-id]");
  if (addFriendButton) addFriend(addFriendButton.dataset.addFriendId);
  const messageProfileButton = event.target.closest("[data-message-profile-id]");
  if (messageProfileButton) {
    addFriend(messageProfileButton.dataset.messageProfileId);
    closeOverlay();
    setSection("messages");
  }
  const blockProfileButton = event.target.closest("[data-block-profile-id]");
  if (blockProfileButton) blockProfile(blockProfileButton.dataset.blockProfileId);
  if (event.target.matches("[data-logout]")) {
    localStorage.removeItem("prototypeRole");
    localStorage.removeItem("prototypeEmail");
    window.location.href = "./login.html";
  }
}

function handleOverlaySubmit(event) {
  if (event.target.id === "account-user-form") {
    event.preventDefault();
    saveUserProfile({ ...userProfile, username: event.target.elements.username.value.trim(), password: event.target.elements.password.value || userProfile.password, aboutMe: event.target.elements.aboutMe.value.trim(), role: activeRole, profileId: userProfile.profileId || createProfileId(currentUserId) });
    addNotification("Profile details updated.");
    renderAccountPanel("user");
  }
  if (event.target.id === "privacy-form") {
    event.preventDefault();
    const privacy = getPrivacyForCurrentUser();
    privacy.showEmail = event.target.elements.showEmail.checked;
    privacy.showMobile = event.target.elements.showMobile.checked;
    savePrivacySettings();
    addNotification("Privacy settings updated.");
    renderAccountPanel("privacy");
  }
  if (event.target.id === "account-class-form") {
    event.preventDefault();
    const role = event.target.elements.role.value;
    localStorage.setItem("prototypeRole", role);
    window.location.href = `./${role}-interface.html`;
  }
}
const chatForm = document.getElementById("chatbot-form");
if (chatForm) {
  chatForm.addEventListener("submit", (event) => {
    event.preventDefault();
    sendChatbotMessage(chatForm.elements.query.value);
    chatForm.reset();
  });
}

bottomButtons.forEach((btn) => {
  btn.addEventListener("click", () => setSection(btn.dataset.tab));
});

const feedPosts = document.getElementById("feed-posts");
feedPosts?.addEventListener("click", handlePostAction);
feedPosts?.addEventListener("click", handleShareChoice);
feedPosts?.addEventListener("submit", (event) => {
  if (event.target.id !== "post-composer-form") return;
  event.preventDefault();
  createPostFromForm(event.target);
});

document.getElementById("conversation-list")?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-conversation]");
  if (!button) return;
  setActiveConversation(button.dataset.conversation);
});

document.addEventListener("submit", (event) => {
  if (event.target.id === "profile-search-form") {
    event.preventDefault();
    showProfileSearchResult(findProfileById(event.target.elements.profileId.value));
  }
});

document.getElementById("message-form")?.addEventListener("submit", (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  sendMessage(form.elements.body.value);
  form.reset();
});

document.querySelector('[data-section="services"]')?.addEventListener("click", handleServiceClick);
document.querySelector('[data-section="services"]')?.addEventListener("submit", handleServiceSubmit);

setupHeaderActions();
document.getElementById("account-menu-btn")?.addEventListener("click", () => renderAccountPanel());
document.getElementById("profile-open-btn")?.addEventListener("click", () => renderProfilePanel());
document.addEventListener("click", handleOverlayClick);
document.addEventListener("submit", handleOverlaySubmit);

renderFeed();
renderMessages();
renderChatbot();
renderServices();
setSection("feed");































