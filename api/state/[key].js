const allowedKeys = new Set([
  "healixFeedStats",
  "healixServices",
  "healixServiceHistory",
  "healixServiceRatings",
  "healixUserProfiles",
  "healixFriendGraph",
  "healixPosts",
  "healixMessages",
  "healixConversations",
  "healixNotifications",
  "healixPrivacySettings"
]);

module.exports = function handler(req, res) {
  if (req.method !== "PUT") {
    res.setHeader("Allow", "PUT");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { key } = req.query || {};
  if (!allowedKeys.has(key)) return res.status(400).json({ error: "Unsupported state key" });
  return res.status(200).json({ ok: true, key, note: "State accepted by Vercel demo API. Persistent storage requires a cloud database." });
};

