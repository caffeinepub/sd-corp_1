# SD Corp

## Current State

Full construction management app with authentication (register/login/PIN), site management, transactions, labour tracking, work progress, and a Cloud/Google Drive tab. The backend uses Motoko with `Map.add()` for user storage and a chained `.values().find()` call for email duplicate detection.

## Requested Changes (Diff)

### Add
- Nothing new to add.

### Modify
- Fix `registerUser` backend function:
  - Replace `users.values().find(func(u) { u.email == email })` with an explicit `for` loop over `users.values()` to check email duplicates (the chained `.find()` may not work reliably).
  - Replace `users.add(userId, newUser)` with `users.set(userId, newUser)` so it never traps on duplicate key (the duplicate check above already handles that case).
  - Use early `return` pattern for clarity and correctness.
- Fix `loginUser` similarly: use `sessions.set(token, session)` instead of `sessions.add(token, session)` to avoid any potential trap.

### Remove
- Nothing to remove.

## Implementation Plan

1. Regenerate backend Motoko with corrected `registerUser` (explicit for-loop email check, `Map.set` instead of `Map.add`) and `loginUser` (use `Map.set` for sessions).
2. Keep all existing data types, CRUD operations, auth functions, and access control logic identical -- only fix the two methods above.
3. No frontend changes needed.
