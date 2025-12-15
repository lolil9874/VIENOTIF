# 🔧 Fix Auth Error: ERR_NAME_NOT_RESOLVED

## 🚨 Problem

Login and signup are failing with `ERR_NAME_NOT_RESOLVED` because Vercel is configured with the **wrong Supabase project URL**.

**Wrong URL (currently in Vercel):** `ddxjaxvrgeihkgmrnmqp.supabase.co`  
**Correct URL:** `knbhidpildgpbmzxaaqe.supabase.co`

## ✅ Solution: Update Vercel Environment Variables

### Step 1: Get the Correct Keys

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select project: **knbhidpildgpbmzxaaqe**
3. Go to **Settings** → **API**
4. Copy:
   - **Project URL**: `https://knbhidpildgpbmzxaaqe.supabase.co`
   - **anon public key**: (the long JWT token)
   - **service_role key**: (the long JWT token - keep secret!)

### Step 2: Update Vercel Environment Variables

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your **VIENOTIF** project
3. Go to **Settings** → **Environment Variables**
4. **Update or create** these variables:

   | Variable | Value |
   |----------|-------|
   | `NEXT_PUBLIC_SUPABASE_URL` | `https://knbhidpildgpbmzxaaqe.supabase.co` |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | (Your anon key from Step 1) |
   | `SUPABASE_SERVICE_ROLE_KEY` | (Your service role key from Step 1) |

5. **Important**: Make sure to set them for **Production**, **Preview**, and **Development** environments
6. Click **Save**

### Step 3: Redeploy

1. Go to **Deployments** tab
2. Click the **3 dots** (⋯) on the latest deployment
3. Click **Redeploy**
4. Or push a new commit to trigger automatic deployment

### Step 4: Verify

After redeployment, test:
1. Go to `https://vienotif.vercel.app/login`
2. Try to sign up or log in
3. Check browser console (F12) - should not see DNS errors

## 🔍 How to Verify Current Configuration

Open browser console (F12) and run:
```javascript
console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL || 'NOT SET');
```

If you see `ddxjaxvrgeihkgmrnmqp`, the environment variable is wrong and needs to be updated.

## ⚠️ Common Mistakes

1. **Forgetting to redeploy** - Environment variables only apply to new deployments
2. **Setting only Production** - Make sure to set for all environments
3. **Wrong project** - Double-check the project ID is `knbhidpildgpbmzxaaqe`
4. **Copy-paste errors** - Make sure there are no extra spaces or line breaks

## 📞 Still Having Issues?

1. Check Vercel deployment logs for errors
2. Verify Supabase project is active and not paused
3. Check browser console for detailed error messages
4. Ensure Supabase project has authentication enabled

