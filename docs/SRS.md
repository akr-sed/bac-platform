# Software Requirements Specification (SRS)

## 1. Introduction

### 1.1 Purpose
This document defines the requirements for a **Collaborative BAC Exercise Practice and Learning Platform**, designed to support students preparing for the Baccalaureate exam through interactive and collaborative learning.

### 1.2 Scope
The system is a web-based platform that enables:
- Browsing and organizing exercises
- Posting and discussing solutions
- Community-driven validation (likes)
- AI-assisted learning (hints + similar exercises)
- Teacher participation and validation

---

## 2. System Overview

The platform allows users to:
- Explore exercises structured by subject / topic / subtopic
- Submit solutions and explanations
- Interact through comments and likes
- Gain credibility through a point system
- Receive AI-generated hints and similar exercises

---

## 3. Actors

### 3.1 Student
- Browse exercises
- Post solutions
- Comment and like
- Gain reputation points

### 3.2 Teacher (Verified)
- All student capabilities
- Identified by a verified badge
- Higher credibility

### 3.3 Admin / Moderator
- Manage and moderate content
- Verify teachers
- Remove inappropriate content
- Handle reports

---

## 4. Functional Requirements

### 4.1 User Management
- Users must be able to register and log in
- Users must have profiles with:
  - Points
  - Role (student / teacher / admin)
  - Badge (teacher verification)

### 4.2 Exercise Management
Users must be able to:
- Browse exercises by subject / topic / subtopic
- View exercise details
- Post new exercises with:
  - Title
  - Description
  - Difficulty
  - Attachments (images / PDF)
- Exercise categories are admin-controlled

### 4.3 Solution Management
Users must be able to:
- Submit solutions
- Attach images
- View all solutions for an exercise
- Solutions are ordered by most liked (default)

### 4.4 Interaction System
Users must be able to:
- Like solutions
- Comment on solutions

### 4.5 Reputation System
- Users gain points through:
  - Posting solutions
  - Receiving likes
- Teachers have a verified badge (admin-approved)

### 4.6 Moderation System
- Content is visible immediately after posting
- Admin can:
  - Delete content
  - Report users
  - Verify teachers

### 4.7 AI Features (Experimental)

#### 4.7.1 Hint Generation
- Users can request hints
- AI provides:
  - Guidance
  - Theoretical direction
- AI must **NOT** provide full solutions
- Feature labeled as experimental

#### 4.7.2 Similar Exercises
- System suggests exercises:
  - From database (primary)
  - From AI generation (fallback)

---

## 5. Non-Functional Requirements

### 5.1 Performance
- System should load pages within 2 seconds
- Efficient filtering and search
- Feed first paint < 1.5 s on 4G
- Lighthouse performance score ≥ 90 on `/dashboard` and `/exercises`
- CLS < 0.1 on the feed (PDF/image preview areas have fixed aspect ratios)

### 5.2 Security
- Secure authentication
- Password hashing
- Role-based access control

### 5.3 Usability
- Simple and intuitive interface
- Clear navigation structure

### 5.4 Scalability
- Must support increasing users and content
- NoSQL database (MongoDB) recommended

### 5.5 Reliability
- System should handle concurrent users
- Minimal downtime

### 5.6 AI Transparency
- AI results may be inaccurate
- Must be labeled as experimental

---

## 6. Use Case Examples

### Use Case 1: Submit Solution
- **Actor:** Student
- **Flow:**
  1. User opens exercise
  2. Clicks "Add Solution"
  3. Writes explanation + uploads image
  4. Submits solution
  5. Solution becomes visible

### Use Case 2: Request Hint
- **Actor:** Student
- **Flow:**
  1. User clicks "Get Hint"
  2. AI processes exercise
  3. Returns guidance (not solution)

### Use Case 3: Moderate Content
- **Actor:** Admin
- **Flow:**
  1. Admin reviews content
  2. Deletes inappropriate post
  3. Optionally reports user

---

## 7. User Stories (Prioritized)

### High Priority
- As a student, I want to browse exercises so I can practice
- As a student, I want to post solutions so I can share knowledge
- As a user, I want to like solutions so I can highlight good answers
- As a user, I want to comment so I can discuss solutions
- As a user, I want to register/login so I can interact

### Medium Priority
- As a user, I want to gain points so I can build credibility
- As a teacher, I want a verified badge so I can be recognized
- As a user, I want to attach images so I can better explain solutions
- As a user, I want to request hints so I can get help

### Low Priority
- As a user, I want similar exercises so I can practice more
- As an admin, I want to manage reports so I can maintain quality

---

## 8. Localisation Requirements *(Added)*

> This section was identified as missing from the original SRS and must be incorporated.

### 8.1 Supported Languages
The platform must support the following three languages:

| Code | Language | Direction |
|------|----------|-----------|
| `en` | English  | LTR       |
| `fr` | French   | LTR       |
| `ar` | Arabic   | **RTL**   |

### 8.2 Requirements
- All user-facing strings must be externalized into translation files (no hardcoded UI text)
- The UI must dynamically switch text direction (`dir="ltr"` / `dir="rtl"`) based on the active locale
- The `lang` attribute on the root HTML element must reflect the active locale
- Users must be able to switch language from any page without losing context
- Default language: **Arabic (`ar`)**
- French should use standard French as spoken in Algeria
- Arabic translations should use Modern Standard Arabic (MSA)

### 8.3 Translation Coverage
All of the following areas must have complete translations in all three languages:
- Authentication (login, register, error messages)
- Navigation and menus
- Exercise management (browse, filter labels, post form, difficulty levels)
- Solution management (submit, view, like, comment)
- User profile (points, role labels, badge)
- Moderation (delete confirmations, report dialogs)
- Reputation system (point labels, badge names)
- AI features (hint button, experimental disclaimer, similar exercises)
- Common UI elements (buttons: save, cancel, submit, loading states, success/error toasts)
- Role names (student, teacher, admin)

---

## 9. Engagement Features

### 9.1 Dashboard Feed
- Personalized feed ranked by engagement score + recency decay + subject-preference boost
- Initial 10 items server-rendered; subsequent pages fetched via infinite scroll
- Same `ExerciseCard` component also used on `/exercises` with chronological sort + filters

### 9.2 Save / Bookmark
- Users can bookmark exercises via an inline card action
- Saved items listed on a dedicated `Saved` tab on the profile page
- Stored in a dedicated `SavedExercise` collection (compound-unique index on `userId + exerciseId`)

### 9.3 Exercise-Level Likes
- Distinct from solution-level likes
- Stored in a dedicated `ExerciseLike` collection
- Feed ranking uses `likesCount` maintained via Mongoose hooks

### 9.4 Subject Preferences
- Users can pick preferred subjects in profile settings
- Feed ranking applies a fixed +50 score boost to matching subjects
- Empty feed triggers a prompt directing the user to pick subjects