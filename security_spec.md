# Security Specification for Synced Draw Wheel

## 1. Data Invariants
1. **WheelConfig Invariants**:
   - `id` must match `^[a-zA-Z0-9_\-]+$` and be at most 128 characters.
   - `inputText` must be a string up to 20000 characters.
   - `themeSelection` must be one of `vibrant`, `pastel`, `neon`, `sunset`, `cool`.
   - `removeAfterDraw` must be a boolean.
   - `updatedAt` must be synchronized to the request server timestamp.

2. **DrawResult Invariants**:
   - `id` must be a valid ID.
   - `winnerName` must be a string at most 256 characters.
   - `timestamp` must be synchronized to the request server timestamp or within acceptable bounds.
   - `removedFromList` must be a boolean.

---

## 2. The "Dirty Dozen" Malicious Payloads

1. **Payload 1: Giant field input poisoning in wheel config** — Injecting a 2MB string.
2. **Payload 2: Invalid theme selection injection** — `themeSelection: "malicious_theme"`.
3. **Payload 3: Non-boolean removeAfterDraw** — `removeAfterDraw: "yes"`.
4. **Payload 4: Missing required fields on WheelConfig creation** — Omitting `inputText`.
5. **Payload 5: Overwriting read-only schema fields** — Attempting to write custom non-registered keys.
6. **Payload 6: Client-side fake timestamps** — Sending `createdAt` with a historical client time instead of server timestamp.
7. **Payload 7: Invalid ID pattern** — `id` containing special scripting tags of length > 2000.
8. **Payload 8: DrawResult integer name injection** — `winnerName` sent as a boolean or number type.
9. **Payload 9: Non-boolean values for removedFromList** — `removedFromList` sent as string.
10. **Payload 10: Sibling relation bypassing** — Forcing an arbitrary ID format onto result.
11. **Payload 11: Bulk deletion injection** — Requesting a write/delete with malicious ID target rules.
12. **Payload 12: Extra fields poisoning on DrawResult** — Adding a `hackerGlow: true` field.

---

## 3. Security Tests Outline

```typescript
// firestore.rules.test.ts
// Verifies that invalid shapes and type-violations correctly return PERMISSION_DENIED.
```
