# Auth Testing Playbook (Emergent-managed Google Auth)

## Overview
- App: TeraPlayer
- Auth is OPTIONAL. Anonymous users continue to use the app with a browser-scoped `session_id` in localStorage. Logged-in users get their history/favorites keyed by `user_id` instead so it syncs across devices.
- Backend uses `session_token` (issued by Emergent Auth after Google OAuth) stored in an httpOnly cookie, also accepted via `Authorization: Bearer <token>` for API tests.

## Step 1: Create Test User & Session in Mongo
```bash
mongosh --eval "
use('test_database');
var userId = 'test-user-' + Date.now();
var sessionToken = 'test_session_' + Date.now();
db.users.insertOne({
  user_id: userId,
  email: 'test.user.' + Date.now() + '@example.com',
  name: 'Test User',
  picture: 'https://via.placeholder.com/150',
  created_at: new Date()
});
db.user_sessions.insertOne({
  user_id: userId,
  session_token: sessionToken,
  expires_at: new Date(Date.now() + 7*24*60*60*1000),
  created_at: new Date()
});
print('Session token: ' + sessionToken);
print('User ID: ' + userId);
"
```

## Step 2: Backend API tests

```bash
# Auth me
curl -H "Authorization: Bearer <session_token>" $BACKEND_URL/api/auth/me

# Add a favorite as an authenticated user
curl -X POST $BACKEND_URL/api/favorites \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <session_token>" \
  -d '{"url":"https://terabox.com/s/1abc","title":"Test"}'

# Should return only the user's favorites (session_id ignored when auth present)
curl -H "Authorization: Bearer <session_token>" $BACKEND_URL/api/favorites
```

## Step 3: Browser test
```js
await page.context.add_cookies([{
  "name":"session_token",
  "value":"<session_token>",
  "domain":"stream-terabox.preview.emergentagent.com",
  "path":"/",
  "httpOnly": true, "secure": true, "sameSite":"None"
}]);
await page.goto("https://stream-terabox.preview.emergentagent.com");
```
Expected: header shows the user's avatar/name; History & Favorites now come from the user's account rather than the anonymous session.

## Cleanup
```bash
mongosh --eval "
use('test_database');
db.users.deleteMany({email: /test\.user\./});
db.user_sessions.deleteMany({session_token: /test_session/});
"
```

## Notes
- `session_id` param on history/favorites is still supported for anonymous users.
- When `Authorization` or `session_token` cookie is present, the backend prefers the authenticated user's `user_id` for scoping.
