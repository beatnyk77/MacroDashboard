# Admin Dashboard Access Guide

## Overview
The Admin Dashboard (`/admin`) provides institutional-grade monitoring for the GraphiQuestor Sovereign Intelligence Console. It displays terminal health, data ingestion logs, and system alerts.

## Authentication Mechanism

### Current Implementation
- **Type:** Simple password-based authentication
- **Storage:** Session-based (survives page refresh, cleared on browser close)
- **Framework:** Custom implementation using `sessionStorage`

### Accessing the Admin Dashboard

1. **Navigate to:** `https://graphiquestor.com/admin` (or `http://localhost:5173/admin` locally)
2. **Enter Access Code:** The password configured in your environment
3. **Click:** "INITIALIZE SESSION"

### Setting the Admin Password

#### Production (Vercel/Netlify)
1. Go to your hosting platform's environment variables settings
2. Add: `VITE_ADMIN_PASSWORD=your_secure_password_here`
3. Redeploy the application

#### Local Development
1. Create a `.env` file in the project root (if it doesn't exist)
2. Add: `VITE_ADMIN_PASSWORD=your_secure_password_here`
3. Restart the dev server: `npm run dev`

**Default Password:** If `VITE_ADMIN_PASSWORD` is not set, the system defaults to `admin123` (⚠️ **NOT recommended for production**)

### Security Best Practices

> [!WARNING]
> **Production Security**
> - Always set a strong, unique password via `VITE_ADMIN_PASSWORD`
> - Never commit `.env` files to version control
> - Rotate passwords regularly (quarterly recommended)
> - Use a password manager to generate/store credentials

#### Recommended Password Criteria
- Minimum 16 characters
- Mix of uppercase, lowercase, numbers, and symbols
- Avoid dictionary words or common patterns
- Example: `Gq$2026!Sv3r3!gn#C0ns0le`

### Password Rotation Procedure

1. **Generate new password** using a password manager
2. **Update environment variable:**
   - Production: Update `VITE_ADMIN_PASSWORD` in hosting platform
   - Local: Update `.env` file
3. **Redeploy** (production) or **restart dev server** (local)
4. **Clear browser session:** Users will need to re-authenticate
5. **Document change** in your internal security log

### Session Management

- **Duration:** Session persists until browser is closed
- **Storage:** `sessionStorage` (not shared across tabs)
- **Logout:** Close the browser tab or clear `sessionStorage` manually

### Troubleshooting

#### "INVALID CREDENTIALS" Error
- Verify `VITE_ADMIN_PASSWORD` is set correctly
- Check for trailing spaces in the password
- Ensure environment variables are loaded (restart dev server)
- Verify deployment includes the updated env var

#### Session Lost After Refresh
- This should NOT happen with current implementation
- If it does, check browser console for errors
- Verify `sessionStorage` is enabled in browser settings

### Future Enhancements (Roadmap)

Potential improvements for consideration:
- **IP Allowlist:** Restrict access to specific IP ranges
- **Supabase RLS:** Role-based access control with proper user management
- **2FA:** Two-factor authentication for enhanced security
- **Audit Logging:** Track all admin access attempts

## Technical Details

### Code Location
- **Component:** `/src/pages/AdminDashboard.tsx`
- **Auth Logic:** Lines 42-54 (AdminLogin component)
- **Session Check:** Lines 121-123 (useState initialization)

### Environment Variable
```bash
# .env or hosting platform environment variables
VITE_ADMIN_PASSWORD=your_secure_password_here
```

### Implementation
```typescript
const adminPass = import.meta.env.VITE_ADMIN_PASSWORD || 'admin123';
if (password === adminPass) {
    sessionStorage.setItem('admin_auth', 'true');
    onAuthenticated();
}
```

## Support

For issues or questions:
1. Check browser console for errors
2. Verify environment variable configuration
3. Review this guide's troubleshooting section
4. Contact system administrator if issues persist
