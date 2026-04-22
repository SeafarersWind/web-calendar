# How to Verify & Demonstrate JWT Security

Follow these steps to confirm that your administrative routes are properly protected by JSON Web Tokens.

### 1. Verification: Where is the Token?
When you log in, the server issues a secret token. You can see it yourself:
1. Open your browser **Developer Tools** (Right-click anywhere -> **Inspect**, or press `F12`).
2. Go to the **Application** tab.
3. On the left side, expand **Local Storage** and select `http://localhost:3000`.
4. You will see a key named `admin_token`. This long string is your JWT!

### 2. Demonstration: Try to Bypass Security
You can demonstrate that the security works by trying to perform an action without that token.

#### Test A: Unauthorized Delete (Should FAIL)
1. Open the [Admin Dashboard](http://localhost:3000/admin/dashboard.html).
2. Open the **Console** tab in Developer Tools.
3. Paste and run this command (replace `1` with any event ID):
   ```javascript
   fetch('/admin/delete/1', { method: 'POST' })
     .then(res => console.log('Response Status:', res.status));
   ```
4. **Expected Result**: You should see `Response Status: 401`. This means the server blocked the request because no token was provided.

#### Test B: Authorized Delete (Should PASS)
1. Now run this command, which includes your token:
   ```javascript
   fetch('/admin/delete/1', { 
     method: 'POST',
     headers: { 'Authorization': 'Bearer ' + localStorage.getItem('admin_token') }
   })
     .then(res => console.log('Response Status:', res.status));
   ```
2. **Expected Result**: You should see `Response Status: 200` (or `404` if the ID doesn't exist). The server allowed the request because the token was valid!

---

### Summary
- **401 Unauthorized**: No token was sent.
- **403 Forbidden**: An invalid or expired token was sent.
- **200 OK**: A valid token was sent and the action was performed.
