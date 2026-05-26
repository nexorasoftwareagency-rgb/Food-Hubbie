# Riders Tab — Important Points

1. **Image compression**: Uses canvas `drawImage` + `toBlob('image/jpeg', 0.7)` — reduces ~2MB phone photos to ~200KB
2. **Max canvas size**: 1200px width constraint prevents memory issues on large images
3. **secondaryAuth.createUser()**: Rider Auth account created via secondary Firebase instance
4. **Real-time listener cleanup**: `loadRiders()` attaches `on('value')` — detached on tab switch via `off()`
5. **Delete is permanent**: No soft-delete or archive; rider data is removed completely
6. **Password visible**: Edited password shown in plaintext in modal
7. **No rider edit from rider app**: All rider profile management happens through this SuperAdmin panel
