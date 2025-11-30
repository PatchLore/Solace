# Runware API Fixes Summary

## Overview
This document summarizes all changes made to fix Runware API authentication and request format issues when migrating from `/v1/image` to `/v1/inference` endpoint.

---

## Initial Problem
- **Error**: `401 - missingApiKey`
- **Issue**: Runware API was not recognizing the API key
- **Endpoint Change**: Migrated from `https://api.runware.ai/v1/image` to `https://api.runware.ai/v1/inference`

---

## Changes Made

### 1. Environment Variable Loading (Lines 7-24)
**Problem**: API key might not be loading from `.env.local`

**Solution**: Added fallback loader to manually read `.env.local` if Next.js didn't load it automatically

```typescript
// Fallback: Load .env.local if Next.js didn't load it automatically
if (!process.env.RUNWARE_API_KEY) {
  try {
    const envPath = path.join(process.cwd(), ".env.local");
    const envContent = readFileSync(envPath, "utf-8");
    const envLines = envContent.split("\n");
    for (const line of envLines) {
      const [key, ...valueParts] = line.split("=");
      if (key?.trim() === "RUNWARE_API_KEY") {
        process.env.RUNWARE_API_KEY = valueParts.join("=").trim();
        console.log("✅ Loaded RUNWARE_API_KEY from .env.local fallback");
        break;
      }
    }
  } catch (error) {
    console.warn("⚠️ Could not load .env.local fallback:", error);
  }
}
```

**Status**: ✅ Implemented

---

### 2. Next.js Config Update (`next.config.js`)
**Problem**: Environment variables might not be exposed to API routes

**Solution**: Explicitly exposed `RUNWARE_API_KEY` in Next.js config

```javascript
env: {
  RUNWARE_API_KEY: process.env.RUNWARE_API_KEY,
}
```

**Status**: ✅ Implemented

---

### 3. Debug Logging (Lines 98, 140-143)
**Problem**: Needed visibility into what was being sent to Runware

**Solution**: Added comprehensive debug logging

```typescript
console.log("RUNWARE KEY CHECK:", process.env.RUNWARE_API_KEY);
console.log("RUNWARE API HEADERS:", JSON.stringify(headers, null, 2));
console.log("RUNWARE API KEY VALUE:", apiKey ? `${apiKey.substring(0, 10)}...` : "NULL");
console.log("RUNWARE API URL:", RUNWARE_API_URL);
console.log("RUNWARE PAYLOAD:", JSON.stringify([payload], null, 2));
```

**Status**: ✅ Implemented (should be removed after fixing)

---

### 4. API Endpoint Update (Line 26)
**Problem**: Old endpoint `/v1/image` was deprecated

**Solution**: Updated to new inference endpoint

```typescript
// Before:
const RUNWARE_API_URL = "https://api.runware.ai/v1/image";

// After:
const RUNWARE_API_URL = "https://api.runware.ai/v1/inference";
```

**Status**: ✅ Implemented

---

### 5. Authentication Header Changes (Lines 135-139)
**Problem**: `/v1/inference` endpoint requires different authentication format

**Attempts Made**:
1. **First attempt**: Multiple headers (`X-Runware-Api-Key`, `X-API-Key`, `Authorization`)
2. **Second attempt**: Added `apiKey` to request payload body
3. **Third attempt**: Removed `apiKey` from payload, used only `Authorization: Bearer` header

**Current Implementation**:
```typescript
const headers: Record<string, string> = {
  "Content-Type": "application/json",
  // v1/inference requires Bearer token format
  "Authorization": `Bearer ${apiKey}`,
};
```

**Status**: ✅ Current implementation (Bearer token only)

---

### 6. Payload Structure Changes (Lines 112-131)
**Problem**: `/v1/inference` endpoint requires `taskType` parameter

**Attempts Made**:
1. **First attempt**: Added `apiKey` to payload (didn't work)
2. **Second attempt**: Removed `apiKey` from payload
3. **Third attempt**: Added `taskType: "imageInference"` parameter

**Current Implementation**:
```typescript
const basePayload = {
  taskType: "imageInference", // Required for v1/inference endpoint
  model: modelId,
  prompt,
  negative_prompt: negativePrompt || "",
  width: 1920,
  height: 1080,
};
```

**Status**: ✅ Current implementation (includes `taskType`)

---

### 7. Request Body Format (Line 150)
**Problem**: Runware API requires array format

**Solution**: Wrapped payload in array

```typescript
body: JSON.stringify([payload])
```

**Status**: ✅ Maintained (unchanged)

---

## Current Error Status

### Last Known Error (from terminal logs):
```
Error: Runware API error: 400 - {
    "code": "invalidTaskType",
    "message": "Invalid value for 'taskType' parameter...",
    "taskType": "Missing taskType in request data"
}
```

### Fix Applied:
- ✅ Added `taskType: "imageInference"` to payload

### Next Steps:
1. **Test again** - The `taskType` parameter should now be included
2. **Check terminal logs** - Verify the payload includes `taskType`
3. **If still failing** - Check Runware API documentation for exact payload format

---

## File Changes Summary

### Modified Files:
1. **`app/api/generate-room/route.ts`**
   - Added environment variable fallback loader
   - Updated API endpoint URL
   - Changed authentication to Bearer token
   - Added `taskType` parameter to payload
   - Added debug logging

2. **`next.config.js`**
   - Added explicit `RUNWARE_API_KEY` environment variable exposure

---

## Debug Information

### Current API Key Format:
- **Location**: `.env.local`
- **Value**: `kpCFZEreDWishrQ4H6YtT4KJZUuK6UbA`
- **Status**: ✅ Loaded successfully (confirmed in logs)

### Current Request Format:
```json
Headers: {
  "Content-Type": "application/json",
  "Authorization": "Bearer kpCFZEreDWishrQ4H6YtT4KJZUuK6UbA"
}

Body: [{
  "taskType": "imageInference",
  "model": "runware:101@1",
  "prompt": "...",
  "negative_prompt": "...",
  "width": 1920,
  "height": 1080,
  "num_inference_steps": 28,
  "guidance_scale": 5
}]
```

---

## Troubleshooting Checklist

If errors persist, check:

- [ ] **API Key is valid** - Verify at https://my.runware.ai
- [ ] **Endpoint is correct** - `/v1/inference` is the current endpoint
- [ ] **Payload format** - Must be array `[{...}]`
- [ ] **taskType value** - Must be exactly `"imageInference"` (case-sensitive)
- [ ] **Authorization header** - Must be `Bearer {key}` format
- [ ] **Model ID** - Verify `runware:101@1` is correct for Flux
- [ ] **Parameter names** - Check Runware docs for exact parameter names
- [ ] **Server restart** - Environment variables load on server start

---

## References

- Runware API Documentation: https://runware.ai/docs/en/getting-started/introduction
- Error message indicates supported `taskType` values include: `imageInference`, `videoInference`, `imageUpscale`, etc.

---

## Notes

- Debug logs should be removed once API is working
- Environment variable fallback can be kept as safety net
- All authentication attempts (headers + payload) have been tried
- Current implementation follows standard Bearer token pattern

