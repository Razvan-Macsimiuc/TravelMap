# 📸 Photo Storage Guide - HopaHopa

## How Photo Storage Works

### 🌐 **On Web/PWA:**
- Photos are converted to **base64 data URLs**
- Stored in **IndexedDB** (browser's persistent database)
- **Persists** across:
  - ✅ Browser refreshes
  - ✅ App restarts
  - ✅ Phone reboots (when installed as PWA)
- **Storage limit**: Typically 50MB+ per app (varies by browser)

### 📱 **On Native iOS/Android:**
- Photos are saved to the device's **Documents** directory
- Metadata stored in **Capacitor Preferences**
- **Persists** across:
  - ✅ App restarts
  - ✅ Phone reboots
  - ✅ iOS/Android backups
- **Storage limit**: Device storage capacity

---

## Current Implementation

### **PhotoService** (`src/app/services/photo.service.ts`)

```typescript
// On initialization:
- Web: Loads photos from IndexedDB
- Native: Loads photos from Capacitor Preferences

// When saving a photo:
1. Fetches the image data (blob URL)
2. Converts to base64
3. On Web: Saves to IndexedDB with base64 data URL
4. On Native: Saves file to Documents/HopaHopaPhotos/
5. Adds to photosSignal for reactive UI updates

// When deleting a photo:
- Web: Removes from IndexedDB
- Native: Deletes file from filesystem
- Updates photosSignal
```

### **IndexedDbService** (`src/app/services/indexed-db.service.ts`)

```typescript
Database: HopaHopaDB
Object Store: photos
Index: countryCode (for efficient queries)

Methods:
- savePhoto(photo): Save single photo
- getAllPhotos(): Load all photos
- getPhotosForCountry(code): Load photos for a country
- deletePhoto(id): Delete single photo
- clearAllPhotos(): Delete all photos
```

---

## Testing Photo Persistence

### Test on Web/PWA:

1. **Add a photo:**
   - Go to a country (e.g., Mali)
   - Click "Add Photos"
   - Select an image
   - Photo appears in the grid

2. **Verify persistence:**
   - Hard refresh the page (Cmd+Shift+R)
   - Go back to the same country
   - Photo should still be there ✅

3. **Check IndexedDB:**
   - Open browser DevTools (F12)
   - Go to Application → Storage → IndexedDB → HopaHopaDB
   - You should see the photos stored

### Test on Mobile (PWA):

1. Install app on phone via "Add to Home Screen"
2. Add a photo to a country
3. Close the app completely
4. Reopen from home screen
5. Navigate to the same country
6. Photo should still be there ✅

---

## Troubleshooting

### Photos disappear after refresh:

**Check console for errors:**
```javascript
// In browser console:
indexedDB.databases().then(console.log)
// Should show "HopaHopaDB"
```

**Verify IndexedDB storage:**
```javascript
// In browser DevTools:
Application → Storage → IndexedDB → HopaHopaDB → photos
// Should show saved photos
```

### Photo limits:

- **Single photo**: Max ~10MB recommended (base64 overhead)
- **Total storage**: 50-100MB typical browser limit
- **Optimal**: Keep photos < 2MB each for best performance

---

## Photo Optimization (Already Implemented)

✅ **Lazy loading**: Images load only when visible
✅ **Pagination**: Shows 12 photos initially, "Show more" button for large sets
✅ **Error handling**: Broken images show placeholder
✅ **Cleanup**: Blob URLs are properly revoked to prevent memory leaks

---

## Current Status

✅ IndexedDB initialized
✅ Photo service updated to use IndexedDB on web
✅ Native filesystem storage ready
✅ Photos persist across refreshes
✅ Delete functionality works
✅ No storage quota issues for typical usage

The photo storage is now production-ready! 🎉




