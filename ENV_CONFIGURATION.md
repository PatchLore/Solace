# Environment Configuration

## ✅ Environment Variables Setup

### `.env.local` File
Created at project root with:
```
RUNWARE_API_KEY=runware:100@1
```

### Git Ignore
✅ `.env*.local` is already in `.gitignore` (line 28)
- This ensures environment variables are never committed to GitHub

### API Routes Using Environment Variable

#### `/app/api/generate-room/route.ts`
- ✅ Uses `process.env.RUNWARE_API_KEY`
- ✅ Validates that key exists before making API calls
- ✅ No hardcoded API keys

#### `/app/api/render/route.ts`
- ✅ Does not use Runware API (uses FFmpeg only)
- ✅ No API keys needed

### Verification

A temporary console.log has been added to `/app/api/generate-room/route.ts`:
```typescript
console.log("Runware API:", process.env.RUNWARE_API_KEY ? "Loaded successfully" : "Not found");
```

**To verify:**
1. Restart the dev server (environment variables load on startup)
2. Make a request to `/api/generate-room`
3. Check server console logs for "Runware API: Loaded successfully"
4. Remove the console.log after verification

### Vercel Deployment

**Important:** When deploying to Vercel, add the environment variable:

1. Go to Vercel Dashboard → Your Project
2. Navigate to **Settings** → **Environment Variables**
3. Add:
   - **Name:** `RUNWARE_API_KEY`
   - **Value:** `runware:100@1`
   - **Environment:** Production, Preview, Development (select all)

### Security Notes

- ✅ No API keys are hardcoded in the codebase
- ✅ `.env.local` is gitignored
- ✅ All API routes use `process.env.RUNWARE_API_KEY`
- ✅ Environment variable is validated before use

