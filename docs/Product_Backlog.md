# Product Backlog

---

## 🧩 EPIC 1 — User Management

### 🔴 US1 — User Registration
**User Story:**
As a user, I want to create an account so that I can access platform features.

**Acceptance Criteria:**
- User provides name, email, password
- Email must be unique
- Password is securely stored (hashed)
- User is assigned default role = `student`

**Priority:** High

---

### 🔴 US2 — User Login
**User Story:**
As a user, I want to log in so that I can interact with the platform.

**Acceptance Criteria:**
- User enters email + password
- System validates credentials
- On success → redirect to dashboard
- On failure → error message

**Priority:** High

---

### 🟠 US3 — User Profile View
**User Story:**
As a user, I want to view my profile so that I can track my activity and points.

**Acceptance Criteria:**
- Display:
  - Username
  - Role
  - Points
  - Badge (if teacher)
- List user contributions *(optional MVP+)*

**Priority:** Medium

---

### 🟠 US4 — Teacher Verification
**User Story:**
As an admin, I want to verify teachers so that only legitimate teachers get a badge.

**Acceptance Criteria:**
- Admin can mark user as "teacher"
- Verified badge appears on profile
- Only admin can assign this role

**Priority:** Medium

---

## 🧩 EPIC 2 — Exercise Management

### 🔴 US5 — Browse Exercises
**User Story:**
As a user, I want to browse exercises so that I can find relevant practice material.

**Acceptance Criteria:**
- Filter by:
  - Subject
  - Topic
  - Subtopic
- Display list of exercises
- Pagination or infinite scroll

**Priority:** High

---

### 🔴 US6 — View Exercise Details
**User Story:**
As a user, I want to view exercise details so that I understand the problem.

**Acceptance Criteria:**
- Show:
  - Title
  - Description
  - Attachments (image/pdf)
  - Author
- Display solutions below

**Priority:** High

---

### 🔴 US7 — Post Exercise
**User Story:**
As a user, I want to post an exercise so that I can share problems.

**Acceptance Criteria:**
- Input:
  - Title
  - Description
  - Difficulty
  - Category (from predefined list)
- Upload attachments
- Exercise is visible immediately

**Priority:** High

---

## 🧩 EPIC 3 — Solution System

### 🔴 US8 — Submit Solution
**User Story:**
As a user, I want to submit a solution so that I can help others.

**Acceptance Criteria:**
- Input text explanation
- Attach images
- Link solution to exercise
- Visible immediately

**Priority:** High

---

### 🔴 US9 — View Solutions
**User Story:**
As a user, I want to view solutions so that I can learn different approaches.

**Acceptance Criteria:**
- Display all solutions
- Sorted by most liked (default)

**Priority:** High

---

### 🔴 US10 — Like Solution
**User Story:**
As a user, I want to like a solution so that I can highlight helpful answers.

**Acceptance Criteria:**
- User can like once per solution
- Like count updates instantly
- Prevent duplicate likes

**Priority:** High

---

### 🟠 US11 — Comment on Solution
**User Story:**
As a user, I want to comment on a solution so that I can discuss it.

**Acceptance Criteria:**
- Add comment to solution
- Display list of comments
- Timestamp + author shown

**Priority:** Medium

---

## 🧩 EPIC 4 — Moderation System

### 🔴 US12 — Delete Content
**User Story:**
As an admin, I want to delete inappropriate content so that the platform stays clean.

**Acceptance Criteria:**
- Admin can delete:
  - Exercises
  - Solutions
  - Comments
- Deleted content no longer visible

**Priority:** High

---

### 🟠 US13 — Report User
**User Story:**
As an admin, I want to report or flag users so that I can track misuse.

**Acceptance Criteria:**
- Admin can flag user
- Store report reason
- *(Optional MVP+)* track reports

**Priority:** Medium

---

## 🧩 EPIC 5 — Reputation System

### 🟠 US14 — Gain Points
**User Story:**
As a user, I want to gain points so that I can build credibility.

**Acceptance Criteria:**
- Points increase when:
  - Posting a solution
  - Receiving likes
- Points displayed in profile

**Priority:** Medium

---

### 🟡 US15 — Display Badge
**User Story:**
As a user, I want to see badges so that I can identify trusted contributors.

**Acceptance Criteria:**
- Teacher badge visible
- Display next to username

**Priority:** Low

---

## 🧩 EPIC 6 — AI Features (Experimental)

### 🟠 US16 — Request Hint
**User Story:**
As a student, I want to get a hint so that I can progress without seeing the solution.

**Acceptance Criteria:**
- Button "Get Hint"
- AI returns:
  - Guidance only
  - No full solution
- Display disclaimer: *"Experimental feature"*

**Priority:** Medium

---

### 🟡 US17 — Suggest Similar Exercises
**User Story:**
As a user, I want similar exercises so that I can practice more.

**Acceptance Criteria:**
- Suggest from:
  - Database (primary)
  - AI (fallback)
- Display list of related exercises

**Priority:** Low

---

## 🧩 EPIC 7 — Localisation *(Added)*

> This epic was identified as missing from the original backlog and must be incorporated.

### 🔴 US18 — Language Switcher
**User Story:**
As a user, I want to switch the platform language so that I can use it in my preferred language.

**Acceptance Criteria:**
- Language switcher accessible from the navbar on every page
- Supports: English (`en`), French (`fr`), Arabic (`ar`)
- Switching language preserves the current page/context
- Selected language persists across sessions (stored in cookie or localStorage)

**Priority:** High

---

### 🔴 US19 — RTL Layout for Arabic
**User Story:**
As an Arabic-speaking user, I want the interface to display right-to-left so that it is natural to read.

**Acceptance Criteria:**
- When locale is `ar`, `dir="rtl"` is set on the root element
- All layout components mirror correctly (nav, cards, forms, buttons)
- Text alignment adapts automatically

**Priority:** High

---

### 🟠 US20 — Translated Content
**User Story:**
As a user, I want all interface text to appear in my chosen language so that I can fully understand the platform.

**Acceptance Criteria:**
- All user-facing strings translated in `en`, `fr`, and `ar`
- No hardcoded text in any UI component
- Missing translation keys fall back to English

**Priority:** Medium

---

## 📊 Priority Summary

### 🔴 MUST HAVE (Sprint 1–2)
- Auth — US1, US2
- Browse + view exercises — US5, US6
- Post exercise — US7
- Submit/view solutions — US8, US9
- Like system — US10
- Admin delete — US12
- Language switcher — US18
- RTL layout — US19

### 🟠 SHOULD HAVE (Sprint 2–3)
- Comments — US11
- Profile — US3
- Points system — US14
- Teacher verification — US4
- AI hint — US16
- Translated content — US20

### 🟡 COULD HAVE (Later)
- Similar exercises — US17
- Badges UI — US15
- Reporting system — US13