# BAC Platform — Foundation Setup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Scaffold a production-ready Next.js 15 project with next-intl i18n (en/fr/ar + RTL), Mongoose models, and a clean folder structure ready for feature development.

**Architecture:** Next.js App Router with a `[locale]` dynamic segment at the root. next-intl handles locale routing via middleware and provides `useTranslations` for all user-facing strings. MongoDB is accessed through a cached Mongoose connection helper; no API routes are implemented yet — only schemas.

**Tech Stack:** Next.js 15 (App Router, TypeScript, Tailwind CSS), next-intl v3, Mongoose 8, GitHub CLI (`gh`)

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `next.config.ts` | Modify | Wrap with `withNextIntl` plugin |
| `src/i18n/routing.ts` | Create | Locale list, default locale, navigation exports (`Link`, `useRouter`, `usePathname`) |
| `src/i18n/request.ts` | Create | Server-side `getRequestConfig` — loads messages per locale |
| `src/middleware.ts` | Create | next-intl locale routing middleware |
| `messages/en.json` | Create | English translations (all features) |
| `messages/fr.json` | Create | French translations (all features) |
| `messages/ar.json` | Create | Arabic MSA translations (all features) |
| `src/app/layout.tsx` | Delete | Replaced by `[locale]/layout.tsx` |
| `src/app/page.tsx` | Delete | Replaced by `[locale]/page.tsx` |
| `src/app/[locale]/layout.tsx` | Create | Root layout: html lang+dir, NextIntlClientProvider |
| `src/app/[locale]/page.tsx` | Create | Home page placeholder |
| `src/app/[locale]/(auth)/login/page.tsx` | Create | Login page placeholder |
| `src/app/[locale]/(auth)/register/page.tsx` | Create | Register page placeholder |
| `src/app/[locale]/exercises/page.tsx` | Create | Browse exercises placeholder |
| `src/app/[locale]/exercises/[id]/page.tsx` | Create | Exercise detail placeholder |
| `src/app/[locale]/profile/page.tsx` | Create | User profile placeholder |
| `src/app/[locale]/admin/page.tsx` | Create | Admin dashboard placeholder |
| `src/components/layout/Navbar.tsx` | Create | Server component navbar with locale-aware links |
| `src/components/layout/LocaleSwitcher.tsx` | Create | Client component locale dropdown |
| `src/lib/mongodb.ts` | Create | Cached Mongoose connection helper |
| `src/models/User.ts` | Create | User schema + TypeScript interface |
| `src/models/Exercise.ts` | Create | Exercise schema + TypeScript interface |
| `src/models/Solution.ts` | Create | Solution schema + TypeScript interface |
| `src/models/Comment.ts` | Create | Comment schema + TypeScript interface |
| `.env.local.example` | Create | Example env vars |
| `README.md` | Modify | Full project documentation |
| `.gitignore` | Verify | `.env.local` must be present |

---

## Task 1: Create GitHub Repository

**Files:** GitHub remote only (no local files)

- [ ] **Step 1: Create the remote repo with GitHub CLI**

```bash
gh repo create bac-platform \
  --public \
  --description "Collaborative BAC exercise practice and learning platform" \
  --confirm
```

> Note: Do NOT use `--add-readme` — the scaffold will create its own README and git history. We want an empty remote.

- [ ] **Step 2: Verify the repo was created**

```bash
gh repo view bac-platform
```

Expected: shows the repo page with the description and `bac-platform` as name.

---

## Task 2: Scaffold Next.js Project

**Files:**
- Create: entire `bac-platform` project (scaffold in current directory)

- [ ] **Step 1: Run create-next-app in the current directory**

From `/home/akram/Desktop/Projects/bac-platform/`:

```bash
npx create-next-app@latest . \
  --typescript \
  --eslint \
  --tailwind \
  --app \
  --src-dir \
  --import-alias "@/*" \
  --yes
```

Expected output ends with: `✓ Installation complete`

- [ ] **Step 2: Verify the scaffold**

```bash
ls src/app src/app/layout.tsx src/app/page.tsx package.json tsconfig.json
```

Expected: all files listed without errors.

- [ ] **Step 3: Verify TypeScript compiles clean**

```bash
npx tsc --noEmit
```

Expected: no output (zero errors).

- [ ] **Step 4: Add GitHub remote**

```bash
# Get your GitHub username
GH_USER=$(gh api user --jq '.login')
git remote add origin "https://github.com/${GH_USER}/bac-platform.git"
git remote -v
```

Expected: shows `origin` pointing to `https://github.com/<your-username>/bac-platform.git`

---

## Task 3: Install Additional Dependencies

**Files:** `package.json` (modified by npm)

- [ ] **Step 1: Install next-intl and mongoose**

```bash
npm install next-intl mongoose
npm install --save-dev @types/mongoose
```

> Note: `@types/mongoose` may not be needed since Mongoose 8 ships its own types — npm will warn if redundant, that's fine.

- [ ] **Step 2: Verify installation**

```bash
node -e "require('next-intl'); console.log('next-intl ok')"
node -e "require('mongoose'); console.log('mongoose ok')"
```

Expected:
```
next-intl ok
mongoose ok
```

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: install next-intl and mongoose"
```

---

## Task 4: Configure next.config.ts for next-intl

**Files:**
- Modify: `next.config.ts`

- [ ] **Step 1: Replace next.config.ts with the next-intl plugin wrapper**

```typescript
// next.config.ts
import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {};

export default withNextIntl(nextConfig);
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors (next-intl plugin types are found from npm install).

- [ ] **Step 3: Commit**

```bash
git add next.config.ts
git commit -m "chore: configure next-intl plugin in next.config.ts"
```

---

## Task 5: Create i18n Routing and Request Config

**Files:**
- Create: `src/i18n/routing.ts`
- Create: `src/i18n/request.ts`

- [ ] **Step 1: Create `src/i18n/routing.ts`**

```typescript
// src/i18n/routing.ts
import { defineRouting } from 'next-intl/routing';
import { createNavigation } from 'next-intl/navigation';

export const routing = defineRouting({
  locales: ['en', 'fr', 'ar'] as const,
  defaultLocale: 'en',
});

export type Locale = (typeof routing.locales)[number];

export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
```

- [ ] **Step 2: Create `src/i18n/request.ts`**

```typescript
// src/i18n/request.ts
import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;

  if (!locale || !(routing.locales as readonly string[]).includes(locale)) {
    locale = routing.defaultLocale;
  }

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/i18n/
git commit -m "feat: add next-intl routing and request config"
```

---

## Task 6: Create Middleware

**Files:**
- Create: `src/middleware.ts`

- [ ] **Step 1: Create `src/middleware.ts`**

```typescript
// src/middleware.ts
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

export default createMiddleware(routing);

export const config = {
  // Match all paths except Next.js internals, static files, and API routes
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/middleware.ts
git commit -m "feat: add next-intl locale routing middleware"
```

---

## Task 7: Create Translation Message Files

**Files:**
- Create: `messages/en.json`
- Create: `messages/fr.json`
- Create: `messages/ar.json`

- [ ] **Step 1: Create `messages/en.json`**

```json
{
  "common": {
    "welcome": "Welcome to BAC Platform",
    "save": "Save",
    "cancel": "Cancel",
    "submit": "Submit",
    "loading": "Loading...",
    "error": "An error occurred",
    "success": "Success",
    "delete": "Delete",
    "edit": "Edit",
    "view": "View",
    "back": "Back",
    "next": "Next",
    "previous": "Previous",
    "search": "Search",
    "filter": "Filter",
    "sort": "Sort",
    "close": "Close",
    "confirm": "Confirm",
    "learnMore": "Learn more"
  },
  "navigation": {
    "home": "Home",
    "exercises": "Exercises",
    "profile": "Profile",
    "admin": "Admin",
    "login": "Login",
    "register": "Register",
    "logout": "Logout",
    "language": "Language"
  },
  "auth": {
    "login": {
      "title": "Login",
      "email": "Email",
      "password": "Password",
      "submit": "Login",
      "noAccount": "Don't have an account?",
      "forgotPassword": "Forgot password?",
      "registerLink": "Register"
    },
    "register": {
      "title": "Register",
      "name": "Full Name",
      "email": "Email",
      "password": "Password",
      "confirmPassword": "Confirm Password",
      "submit": "Create Account",
      "hasAccount": "Already have an account?",
      "loginLink": "Login",
      "role": "I am a",
      "student": "Student",
      "teacher": "Teacher"
    },
    "errors": {
      "invalidCredentials": "Invalid email or password",
      "emailTaken": "This email is already in use",
      "weakPassword": "Password must be at least 8 characters",
      "passwordMismatch": "Passwords do not match",
      "required": "This field is required",
      "invalidEmail": "Invalid email address",
      "serverError": "Server error, please try again"
    }
  },
  "exercises": {
    "title": "Exercises",
    "browse": "Browse Exercises",
    "post": "Post an Exercise",
    "noResults": "No exercises found",
    "filter": {
      "subject": "Subject",
      "topic": "Topic",
      "subtopic": "Subtopic",
      "difficulty": "Difficulty",
      "all": "All"
    },
    "difficulty": {
      "easy": "Easy",
      "medium": "Medium",
      "hard": "Hard"
    },
    "fields": {
      "title": "Title",
      "description": "Description",
      "subject": "Subject",
      "topic": "Topic",
      "subtopic": "Subtopic",
      "attachments": "Attachments"
    },
    "detail": {
      "solutions": "Solutions",
      "noSolutions": "No solutions yet. Be the first to post one!",
      "similarExercises": "Similar Exercises",
      "postedBy": "Posted by",
      "postedAt": "Posted on"
    }
  },
  "solutions": {
    "submit": "Submit Solution",
    "view": "View Solution",
    "like": "Like",
    "unlike": "Unlike",
    "likes": "{count, plural, one {# like} other {# likes}}",
    "comment": "Comment",
    "comments": "{count, plural, one {# comment} other {# comments}}",
    "addComment": "Add a comment",
    "fields": {
      "content": "Your Solution",
      "images": "Attach Images"
    },
    "placeholder": "Write your solution here...",
    "submitSuccess": "Solution submitted successfully",
    "editSuccess": "Solution updated successfully"
  },
  "profile": {
    "title": "My Profile",
    "points": "Points",
    "role": "Role",
    "badge": "Badge",
    "exercises": "My Exercises",
    "solutions": "My Solutions",
    "reputation": "Reputation",
    "joinedAt": "Member since",
    "verifiedTeacher": "Verified Teacher",
    "editProfile": "Edit Profile"
  },
  "moderation": {
    "delete": "Delete",
    "report": "Report",
    "reportReason": "Reason for report",
    "confirmDelete": "Are you sure you want to delete this? This action cannot be undone.",
    "deleted": "Successfully deleted",
    "reported": "Thank you, your report has been submitted",
    "reasons": {
      "spam": "Spam",
      "inappropriate": "Inappropriate content",
      "incorrect": "Incorrect solution",
      "other": "Other"
    }
  },
  "reputation": {
    "points": "{count, plural, one {# point} other {# points}}",
    "badges": {
      "beginner": "Beginner",
      "intermediate": "Intermediate",
      "advanced": "Advanced",
      "expert": "Expert"
    },
    "earned": "You earned {points} points!"
  },
  "ai": {
    "hint": "Get AI Hint",
    "hintButton": "Hint",
    "disclaimer": "AI-generated hints are experimental and may contain inaccuracies. Always verify with your teacher.",
    "generating": "Generating hint...",
    "similarExercises": "Similar Exercises",
    "noSimilar": "No similar exercises found",
    "error": "Could not generate a hint. Please try again."
  },
  "roles": {
    "student": "Student",
    "teacher": "Teacher",
    "admin": "Administrator",
    "moderator": "Moderator"
  },
  "admin": {
    "title": "Admin Dashboard",
    "users": "Users",
    "exercises": "Exercises",
    "solutions": "Solutions",
    "reports": "Reports",
    "verifyTeacher": "Verify Teacher",
    "revokeTeacher": "Revoke Teacher Status",
    "stats": "Statistics",
    "totalUsers": "Total Users",
    "totalExercises": "Total Exercises",
    "pendingReports": "Pending Reports"
  }
}
```

- [ ] **Step 2: Create `messages/fr.json`**

```json
{
  "common": {
    "welcome": "Bienvenue sur la plateforme BAC",
    "save": "Enregistrer",
    "cancel": "Annuler",
    "submit": "Soumettre",
    "loading": "Chargement...",
    "error": "Une erreur s'est produite",
    "success": "Succès",
    "delete": "Supprimer",
    "edit": "Modifier",
    "view": "Voir",
    "back": "Retour",
    "next": "Suivant",
    "previous": "Précédent",
    "search": "Rechercher",
    "filter": "Filtrer",
    "sort": "Trier",
    "close": "Fermer",
    "confirm": "Confirmer",
    "learnMore": "En savoir plus"
  },
  "navigation": {
    "home": "Accueil",
    "exercises": "Exercices",
    "profile": "Profil",
    "admin": "Administration",
    "login": "Connexion",
    "register": "Inscription",
    "logout": "Déconnexion",
    "language": "Langue"
  },
  "auth": {
    "login": {
      "title": "Connexion",
      "email": "Adresse e-mail",
      "password": "Mot de passe",
      "submit": "Se connecter",
      "noAccount": "Vous n'avez pas de compte ?",
      "forgotPassword": "Mot de passe oublié ?",
      "registerLink": "S'inscrire"
    },
    "register": {
      "title": "Inscription",
      "name": "Nom complet",
      "email": "Adresse e-mail",
      "password": "Mot de passe",
      "confirmPassword": "Confirmer le mot de passe",
      "submit": "Créer un compte",
      "hasAccount": "Vous avez déjà un compte ?",
      "loginLink": "Se connecter",
      "role": "Je suis",
      "student": "Élève",
      "teacher": "Professeur"
    },
    "errors": {
      "invalidCredentials": "Adresse e-mail ou mot de passe incorrect",
      "emailTaken": "Cette adresse e-mail est déjà utilisée",
      "weakPassword": "Le mot de passe doit contenir au moins 8 caractères",
      "passwordMismatch": "Les mots de passe ne correspondent pas",
      "required": "Ce champ est obligatoire",
      "invalidEmail": "Adresse e-mail invalide",
      "serverError": "Erreur serveur, veuillez réessayer"
    }
  },
  "exercises": {
    "title": "Exercices",
    "browse": "Parcourir les exercices",
    "post": "Publier un exercice",
    "noResults": "Aucun exercice trouvé",
    "filter": {
      "subject": "Matière",
      "topic": "Thème",
      "subtopic": "Sous-thème",
      "difficulty": "Difficulté",
      "all": "Tous"
    },
    "difficulty": {
      "easy": "Facile",
      "medium": "Moyen",
      "hard": "Difficile"
    },
    "fields": {
      "title": "Titre",
      "description": "Description",
      "subject": "Matière",
      "topic": "Thème",
      "subtopic": "Sous-thème",
      "attachments": "Pièces jointes"
    },
    "detail": {
      "solutions": "Solutions",
      "noSolutions": "Aucune solution pour le moment. Soyez le premier !",
      "similarExercises": "Exercices similaires",
      "postedBy": "Publié par",
      "postedAt": "Publié le"
    }
  },
  "solutions": {
    "submit": "Soumettre une solution",
    "view": "Voir la solution",
    "like": "J'aime",
    "unlike": "Je n'aime plus",
    "likes": "{count, plural, one {# j'aime} other {# j'aimes}}",
    "comment": "Commenter",
    "comments": "{count, plural, one {# commentaire} other {# commentaires}}",
    "addComment": "Ajouter un commentaire",
    "fields": {
      "content": "Votre solution",
      "images": "Joindre des images"
    },
    "placeholder": "Rédigez votre solution ici...",
    "submitSuccess": "Solution soumise avec succès",
    "editSuccess": "Solution mise à jour avec succès"
  },
  "profile": {
    "title": "Mon profil",
    "points": "Points",
    "role": "Rôle",
    "badge": "Badge",
    "exercises": "Mes exercices",
    "solutions": "Mes solutions",
    "reputation": "Réputation",
    "joinedAt": "Membre depuis",
    "verifiedTeacher": "Professeur vérifié",
    "editProfile": "Modifier le profil"
  },
  "moderation": {
    "delete": "Supprimer",
    "report": "Signaler",
    "reportReason": "Motif du signalement",
    "confirmDelete": "Êtes-vous sûr de vouloir supprimer ceci ? Cette action est irréversible.",
    "deleted": "Supprimé avec succès",
    "reported": "Merci, votre signalement a été pris en compte",
    "reasons": {
      "spam": "Spam",
      "inappropriate": "Contenu inapproprié",
      "incorrect": "Solution incorrecte",
      "other": "Autre"
    }
  },
  "reputation": {
    "points": "{count, plural, one {# point} other {# points}}",
    "badges": {
      "beginner": "Débutant",
      "intermediate": "Intermédiaire",
      "advanced": "Avancé",
      "expert": "Expert"
    },
    "earned": "Vous avez gagné {points} points !"
  },
  "ai": {
    "hint": "Obtenir un indice IA",
    "hintButton": "Indice",
    "disclaimer": "Les indices générés par l'IA sont expérimentaux et peuvent contenir des inexactitudes. Vérifiez toujours auprès de votre professeur.",
    "generating": "Génération de l'indice...",
    "similarExercises": "Exercices similaires",
    "noSimilar": "Aucun exercice similaire trouvé",
    "error": "Impossible de générer un indice. Veuillez réessayer."
  },
  "roles": {
    "student": "Élève",
    "teacher": "Professeur",
    "admin": "Administrateur",
    "moderator": "Modérateur"
  },
  "admin": {
    "title": "Tableau de bord",
    "users": "Utilisateurs",
    "exercises": "Exercices",
    "solutions": "Solutions",
    "reports": "Signalements",
    "verifyTeacher": "Vérifier le professeur",
    "revokeTeacher": "Révoquer le statut de professeur",
    "stats": "Statistiques",
    "totalUsers": "Total utilisateurs",
    "totalExercises": "Total exercices",
    "pendingReports": "Signalements en attente"
  }
}
```

- [ ] **Step 3: Create `messages/ar.json`**

```json
{
  "common": {
    "welcome": "مرحباً بك في منصة البكالوريا",
    "save": "حفظ",
    "cancel": "إلغاء",
    "submit": "إرسال",
    "loading": "جارٍ التحميل...",
    "error": "حدث خطأ ما",
    "success": "تمّ بنجاح",
    "delete": "حذف",
    "edit": "تعديل",
    "view": "عرض",
    "back": "رجوع",
    "next": "التالي",
    "previous": "السابق",
    "search": "بحث",
    "filter": "تصفية",
    "sort": "ترتيب",
    "close": "إغلاق",
    "confirm": "تأكيد",
    "learnMore": "اقرأ المزيد"
  },
  "navigation": {
    "home": "الرئيسية",
    "exercises": "التمارين",
    "profile": "الملف الشخصي",
    "admin": "الإدارة",
    "login": "تسجيل الدخول",
    "register": "إنشاء حساب",
    "logout": "تسجيل الخروج",
    "language": "اللغة"
  },
  "auth": {
    "login": {
      "title": "تسجيل الدخول",
      "email": "البريد الإلكتروني",
      "password": "كلمة المرور",
      "submit": "تسجيل الدخول",
      "noAccount": "ليس لديك حساب؟",
      "forgotPassword": "نسيت كلمة المرور؟",
      "registerLink": "إنشاء حساب"
    },
    "register": {
      "title": "إنشاء حساب",
      "name": "الاسم الكامل",
      "email": "البريد الإلكتروني",
      "password": "كلمة المرور",
      "confirmPassword": "تأكيد كلمة المرور",
      "submit": "إنشاء الحساب",
      "hasAccount": "لديك حساب بالفعل؟",
      "loginLink": "تسجيل الدخول",
      "role": "أنا",
      "student": "طالب",
      "teacher": "أستاذ"
    },
    "errors": {
      "invalidCredentials": "البريد الإلكتروني أو كلمة المرور غير صحيحة",
      "emailTaken": "هذا البريد الإلكتروني مستخدم بالفعل",
      "weakPassword": "يجب أن تحتوي كلمة المرور على 8 أحرف على الأقل",
      "passwordMismatch": "كلمتا المرور غير متطابقتين",
      "required": "هذا الحقل مطلوب",
      "invalidEmail": "البريد الإلكتروني غير صالح",
      "serverError": "خطأ في الخادم، يرجى المحاولة مرة أخرى"
    }
  },
  "exercises": {
    "title": "التمارين",
    "browse": "تصفّح التمارين",
    "post": "نشر تمرين",
    "noResults": "لم يُعثر على أي تمرين",
    "filter": {
      "subject": "المادة",
      "topic": "الموضوع",
      "subtopic": "الموضوع الفرعي",
      "difficulty": "المستوى",
      "all": "الكل"
    },
    "difficulty": {
      "easy": "سهل",
      "medium": "متوسط",
      "hard": "صعب"
    },
    "fields": {
      "title": "العنوان",
      "description": "الوصف",
      "subject": "المادة",
      "topic": "الموضوع",
      "subtopic": "الموضوع الفرعي",
      "attachments": "المرفقات"
    },
    "detail": {
      "solutions": "الحلول",
      "noSolutions": "لا توجد حلول بعد. كن أول من يشارك!",
      "similarExercises": "تمارين مشابهة",
      "postedBy": "نشره",
      "postedAt": "تاريخ النشر"
    }
  },
  "solutions": {
    "submit": "إرسال الحل",
    "view": "عرض الحل",
    "like": "إعجاب",
    "unlike": "إلغاء الإعجاب",
    "likes": "{count} إعجاب",
    "comment": "تعليق",
    "comments": "{count} تعليق",
    "addComment": "أضف تعليقاً",
    "fields": {
      "content": "حلّك",
      "images": "إرفاق صور"
    },
    "placeholder": "اكتب حلّك هنا...",
    "submitSuccess": "تم إرسال الحل بنجاح",
    "editSuccess": "تم تحديث الحل بنجاح"
  },
  "profile": {
    "title": "ملفي الشخصي",
    "points": "النقاط",
    "role": "الدور",
    "badge": "الشارة",
    "exercises": "تمارينى",
    "solutions": "حلولي",
    "reputation": "السمعة",
    "joinedAt": "عضو منذ",
    "verifiedTeacher": "أستاذ موثّق",
    "editProfile": "تعديل الملف الشخصي"
  },
  "moderation": {
    "delete": "حذف",
    "report": "إبلاغ",
    "reportReason": "سبب الإبلاغ",
    "confirmDelete": "هل أنت متأكد من الحذف؟ لا يمكن التراجع عن هذا الإجراء.",
    "deleted": "تم الحذف بنجاح",
    "reported": "شكراً، تم تقديم بلاغك بنجاح",
    "reasons": {
      "spam": "رسالة مزعجة",
      "inappropriate": "محتوى غير لائق",
      "incorrect": "حل خاطئ",
      "other": "أخرى"
    }
  },
  "reputation": {
    "points": "{count} نقطة",
    "badges": {
      "beginner": "مبتدئ",
      "intermediate": "متوسط",
      "advanced": "متقدم",
      "expert": "خبير"
    },
    "earned": "لقد حصلت على {points} نقاط!"
  },
  "ai": {
    "hint": "احصل على تلميح ذكاء اصطناعي",
    "hintButton": "تلميح",
    "disclaimer": "التلميحات المولَّدة بالذكاء الاصطناعي تجريبية وقد تحتوي على أخطاء. تحقق دائماً مع أستاذك.",
    "generating": "جارٍ توليد التلميح...",
    "similarExercises": "تمارين مشابهة",
    "noSimilar": "لم يُعثر على تمارين مشابهة",
    "error": "تعذّر توليد التلميح. يرجى المحاولة مجدداً."
  },
  "roles": {
    "student": "طالب",
    "teacher": "أستاذ",
    "admin": "مدير",
    "moderator": "مشرف"
  },
  "admin": {
    "title": "لوحة التحكم",
    "users": "المستخدمون",
    "exercises": "التمارين",
    "solutions": "الحلول",
    "reports": "البلاغات",
    "verifyTeacher": "توثيق الأستاذ",
    "revokeTeacher": "إلغاء توثيق الأستاذ",
    "stats": "الإحصائيات",
    "totalUsers": "إجمالي المستخدمين",
    "totalExercises": "إجمالي التمارين",
    "pendingReports": "البلاغات المعلّقة"
  }
}
```

- [ ] **Step 4: Verify TypeScript resolves the message import**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add messages/
git commit -m "feat: add i18n translation files for en, fr, ar"
```

---

## Task 8: Update Root Layout for [locale] + RTL Support

**Files:**
- Delete: `src/app/layout.tsx`
- Delete: `src/app/page.tsx`
- Create: `src/app/[locale]/layout.tsx`

> `src/app/globals.css` stays — it contains Tailwind directives.

- [ ] **Step 1: Remove default layout and page**

```bash
rm src/app/layout.tsx src/app/page.tsx
```

- [ ] **Step 2: Create `src/app/[locale]/layout.tsx`**

```typescript
// src/app/[locale]/layout.tsx
import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import '../globals.css';

export const metadata: Metadata = {
  title: 'BAC Platform',
  description: 'Collaborative BAC exercise practice and learning platform',
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!(routing.locales as readonly string[]).includes(locale)) {
    notFound();
  }

  const messages = await getMessages();
  const dir = locale === 'ar' ? 'rtl' : 'ltr';

  return (
    <html lang={locale} dir={dir}>
      <body>
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/app/
git commit -m "feat: add [locale] root layout with RTL support and next-intl provider"
```

---

## Task 9: Create Placeholder Pages

**Files:**
- Create: `src/app/[locale]/page.tsx`
- Create: `src/app/[locale]/(auth)/login/page.tsx`
- Create: `src/app/[locale]/(auth)/register/page.tsx`
- Create: `src/app/[locale]/exercises/page.tsx`
- Create: `src/app/[locale]/exercises/[id]/page.tsx`
- Create: `src/app/[locale]/profile/page.tsx`
- Create: `src/app/[locale]/admin/page.tsx`

- [ ] **Step 1: Create `src/app/[locale]/page.tsx`**

```typescript
// src/app/[locale]/page.tsx
import { useTranslations } from 'next-intl';

export default function HomePage() {
  const t = useTranslations('common');
  return (
    <main className="container mx-auto p-8">
      <h1 className="text-3xl font-bold">{t('welcome')}</h1>
    </main>
  );
}
```

- [ ] **Step 2: Create `src/app/[locale]/(auth)/login/page.tsx`**

```typescript
// src/app/[locale]/(auth)/login/page.tsx
import { useTranslations } from 'next-intl';

export default function LoginPage() {
  const t = useTranslations('auth.login');
  return (
    <main className="container mx-auto p-8">
      <h1 className="text-2xl font-bold">{t('title')}</h1>
    </main>
  );
}
```

- [ ] **Step 3: Create `src/app/[locale]/(auth)/register/page.tsx`**

```typescript
// src/app/[locale]/(auth)/register/page.tsx
import { useTranslations } from 'next-intl';

export default function RegisterPage() {
  const t = useTranslations('auth.register');
  return (
    <main className="container mx-auto p-8">
      <h1 className="text-2xl font-bold">{t('title')}</h1>
    </main>
  );
}
```

- [ ] **Step 4: Create `src/app/[locale]/exercises/page.tsx`**

```typescript
// src/app/[locale]/exercises/page.tsx
import { useTranslations } from 'next-intl';

export default function ExercisesPage() {
  const t = useTranslations('exercises');
  return (
    <main className="container mx-auto p-8">
      <h1 className="text-2xl font-bold">{t('browse')}</h1>
    </main>
  );
}
```

- [ ] **Step 5: Create `src/app/[locale]/exercises/[id]/page.tsx`**

```typescript
// src/app/[locale]/exercises/[id]/page.tsx
import { useTranslations } from 'next-intl';

export default function ExerciseDetailPage() {
  const t = useTranslations('exercises.detail');
  return (
    <main className="container mx-auto p-8">
      <h1 className="text-2xl font-bold">{t('solutions')}</h1>
    </main>
  );
}
```

- [ ] **Step 6: Create `src/app/[locale]/profile/page.tsx`**

```typescript
// src/app/[locale]/profile/page.tsx
import { useTranslations } from 'next-intl';

export default function ProfilePage() {
  const t = useTranslations('profile');
  return (
    <main className="container mx-auto p-8">
      <h1 className="text-2xl font-bold">{t('title')}</h1>
    </main>
  );
}
```

- [ ] **Step 7: Create `src/app/[locale]/admin/page.tsx`**

```typescript
// src/app/[locale]/admin/page.tsx
import { useTranslations } from 'next-intl';

export default function AdminPage() {
  const t = useTranslations('admin');
  return (
    <main className="container mx-auto p-8">
      <h1 className="text-2xl font-bold">{t('title')}</h1>
    </main>
  );
}
```

- [ ] **Step 8: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 9: Commit**

```bash
git add src/app/[locale]/
git commit -m "feat: add placeholder pages for all routes under [locale]"
```

---

## Task 10: Create LocaleSwitcher and Navbar Components

**Files:**
- Create: `src/components/layout/LocaleSwitcher.tsx`
- Create: `src/components/layout/Navbar.tsx`
- Create: `src/components/ui/.gitkeep` (empty directory placeholder)

- [ ] **Step 1: Create `src/components/ui/.gitkeep`**

```bash
mkdir -p src/components/ui && touch src/components/ui/.gitkeep
```

- [ ] **Step 2: Create `src/components/layout/LocaleSwitcher.tsx`**

```typescript
// src/components/layout/LocaleSwitcher.tsx
'use client';

import { useLocale, useTranslations } from 'next-intl';
import { usePathname, Link } from '@/i18n/routing';

const LOCALES = [
  { code: 'en' as const, label: 'English' },
  { code: 'fr' as const, label: 'Français' },
  { code: 'ar' as const, label: 'العربية' },
];

export default function LocaleSwitcher() {
  const t = useTranslations('navigation');
  const currentLocale = useLocale();
  const pathname = usePathname();

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-500">{t('language')}:</span>
      {LOCALES.map(({ code, label }) => (
        <Link
          key={code}
          href={pathname}
          locale={code}
          className={
            currentLocale === code
              ? 'text-sm font-bold underline'
              : 'text-sm text-gray-600 hover:text-gray-900'
          }
        >
          {label}
        </Link>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Create `src/components/layout/Navbar.tsx`**

```typescript
// src/components/layout/Navbar.tsx
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import LocaleSwitcher from './LocaleSwitcher';

export default function Navbar() {
  const t = useTranslations('navigation');

  return (
    <header className="border-b bg-white px-6 py-3">
      <nav className="mx-auto flex max-w-6xl items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-lg font-bold text-blue-600">
            BAC Platform
          </Link>
          <Link href="/exercises" className="text-sm hover:text-blue-600">
            {t('exercises')}
          </Link>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/profile" className="text-sm hover:text-blue-600">
            {t('profile')}
          </Link>
          <Link href="/(auth)/login" className="text-sm hover:text-blue-600">
            {t('login')}
          </Link>
          <LocaleSwitcher />
        </div>
      </nav>
    </header>
  );
}
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/components/
git commit -m "feat: add Navbar and LocaleSwitcher components"
```

---

## Task 11: Create MongoDB Connection Helper

**Files:**
- Create: `src/lib/mongodb.ts`

- [ ] **Step 1: Create `src/lib/mongodb.ts`**

```typescript
// src/lib/mongodb.ts
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error(
    'Please define the MONGODB_URI environment variable in .env.local'
  );
}

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

// Extend NodeJS global to persist connection across hot reloads in dev
declare global {
  // eslint-disable-next-line no-var
  var __mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache = global.__mongooseCache ?? {
  conn: null,
  promise: null,
};

if (!global.__mongooseCache) {
  global.__mongooseCache = cached;
}

export async function connectToDatabase(): Promise<typeof mongoose> {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI as string);
  }

  cached.conn = await cached.promise;
  return cached.conn;
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/
git commit -m "feat: add cached MongoDB connection helper"
```

---

## Task 12: Create Mongoose Models

**Files:**
- Create: `src/models/User.ts`
- Create: `src/models/Exercise.ts`
- Create: `src/models/Solution.ts`
- Create: `src/models/Comment.ts`

- [ ] **Step 1: Create `src/models/User.ts`**

```typescript
// src/models/User.ts
import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  role: 'student' | 'teacher' | 'admin';
  points: number;
  isVerifiedTeacher: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ['student', 'teacher', 'admin'] as const,
      default: 'student',
    },
    points: { type: Number, default: 0, min: 0 },
    isVerifiedTeacher: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const User: Model<IUser> =
  (mongoose.models.User as Model<IUser>) ??
  mongoose.model<IUser>('User', UserSchema);

export default User;
```

- [ ] **Step 2: Create `src/models/Exercise.ts`**

```typescript
// src/models/Exercise.ts
import mongoose, { Document, Model, Schema, Types } from 'mongoose';

export interface IExercise extends Document {
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  subject: string;
  topic: string;
  subtopic: string;
  authorId: Types.ObjectId;
  attachments: string[];
  createdAt: Date;
  updatedAt: Date;
}

const ExerciseSchema = new Schema<IExercise>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'] as const,
      required: true,
    },
    subject: { type: String, required: true, trim: true },
    topic: { type: String, required: true, trim: true },
    subtopic: { type: String, default: '', trim: true },
    authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    attachments: [{ type: String }],
  },
  { timestamps: true }
);

const Exercise: Model<IExercise> =
  (mongoose.models.Exercise as Model<IExercise>) ??
  mongoose.model<IExercise>('Exercise', ExerciseSchema);

export default Exercise;
```

- [ ] **Step 3: Create `src/models/Solution.ts`**

```typescript
// src/models/Solution.ts
import mongoose, { Document, Model, Schema, Types } from 'mongoose';

export interface ISolution extends Document {
  exerciseId: Types.ObjectId;
  authorId: Types.ObjectId;
  content: string;
  images: string[];
  likes: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const SolutionSchema = new Schema<ISolution>(
  {
    exerciseId: { type: Schema.Types.ObjectId, ref: 'Exercise', required: true },
    authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true },
    images: [{ type: String }],
    likes: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

const Solution: Model<ISolution> =
  (mongoose.models.Solution as Model<ISolution>) ??
  mongoose.model<ISolution>('Solution', SolutionSchema);

export default Solution;
```

- [ ] **Step 4: Create `src/models/Comment.ts`**

```typescript
// src/models/Comment.ts
import mongoose, { Document, Model, Schema, Types } from 'mongoose';

export interface IComment extends Document {
  solutionId: Types.ObjectId;
  authorId: Types.ObjectId;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

const CommentSchema = new Schema<IComment>(
  {
    solutionId: { type: Schema.Types.ObjectId, ref: 'Solution', required: true },
    authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

const Comment: Model<IComment> =
  (mongoose.models.Comment as Model<IComment>) ??
  mongoose.model<IComment>('Comment', CommentSchema);

export default Comment;
```

- [ ] **Step 5: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/models/
git commit -m "feat: add Mongoose models for User, Exercise, Solution, Comment"
```

---

## Task 13: Create .env.local.example and Verify .gitignore

**Files:**
- Create: `.env.local.example`
- Verify: `.gitignore`

- [ ] **Step 1: Create `.env.local.example`**

```bash
# .env.local.example
MONGODB_URI=mongodb://localhost:27017/bac-platform
NEXTAUTH_SECRET=your_secret_here
NEXTAUTH_URL=http://localhost:3000
OPENAI_API_KEY=your_openai_key_here
```

- [ ] **Step 2: Verify `.env.local` is in `.gitignore`**

```bash
grep '\.env\.local' .gitignore
```

Expected output: `.env.local` (create-next-app adds it by default).

If it is missing, add it:

```bash
echo '.env.local' >> .gitignore
```

- [ ] **Step 3: Commit**

```bash
git add .env.local.example .gitignore
git commit -m "chore: add .env.local.example with required environment variables"
```

---

## Task 14: Update README.md

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Replace README.md with the following content**

```markdown
# BAC Platform

Collaborative BAC (Baccalaureate) exercise practice and learning platform for Algerian students.

## Features

- Browse and filter exercises by subject, topic, subtopic, and difficulty
- Post exercises and submit solutions
- Like and comment on solutions
- Reputation points and badge system
- AI-generated hints (experimental)
- Similar exercise suggestions

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15 (App Router, TypeScript, Tailwind CSS) |
| Backend | Next.js API Routes (Node.js) |
| Database | MongoDB (Mongoose) |
| i18n | next-intl |

## Supported Languages

| Code | Language | Direction |
|------|----------|-----------|
| `en` | English | LTR |
| `fr` | French | LTR |
| `ar` | Arabic (MSA) | **RTL** |

Arabic is automatically served with `dir="rtl"` on the `<html>` element.

## Getting Started

### Prerequisites

- Node.js 20+
- MongoDB (local or Atlas)

### Installation

```bash
git clone https://github.com/<your-username>/bac-platform.git
cd bac-platform
npm install
cp .env.local.example .env.local
# Edit .env.local and fill in your values
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you will be redirected to `/en` by default.

To test a specific locale, navigate to `/fr` or `/ar`.

## Folder Structure

```
src/
├── app/
│   └── [locale]/               # All routes are locale-prefixed (/en, /fr, /ar)
│       ├── layout.tsx           # Root layout: html lang+dir, NextIntlClientProvider
│       ├── page.tsx             # Home page
│       ├── (auth)/
│       │   ├── login/page.tsx
│       │   └── register/page.tsx
│       ├── exercises/
│       │   ├── page.tsx         # Browse exercises
│       │   └── [id]/page.tsx    # Exercise detail
│       ├── profile/page.tsx
│       └── admin/page.tsx
├── components/
│   ├── ui/                      # Shared UI components (shadcn-ready)
│   └── layout/
│       ├── Navbar.tsx
│       └── LocaleSwitcher.tsx
├── i18n/
│   ├── routing.ts               # Locales config + navigation exports
│   └── request.ts               # Server-side getRequestConfig
├── lib/
│   └── mongodb.ts               # Cached Mongoose connection
├── middleware.ts                 # next-intl locale routing
└── models/
    ├── User.ts
    ├── Exercise.ts
    ├── Solution.ts
    └── Comment.ts
messages/
├── en.json
├── fr.json
└── ar.json
```

## Adding New Translations

1. Add the key to `messages/en.json` under the relevant namespace.
2. Add the same key with translated values in `messages/fr.json` and `messages/ar.json`.
3. Use the key in your component:

```typescript
// Server component
import { useTranslations } from 'next-intl';
const t = useTranslations('namespace');
<p>{t('yourKey')}</p>

// Client component ('use client')
import { useTranslations } from 'next-intl';
```

## User Roles

| Role | Description |
|------|-------------|
| `student` | Default role — can post exercises, submit solutions, like and comment |
| `teacher` | Same as student + can be verified by admin |
| `admin` | Full access — can moderate content and verify teachers |

## Environment Variables

See `.env.local.example` for all required variables.
```

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: write comprehensive README with setup, structure, and i18n guide"
```

---

## Task 15: Final Build Verification and Push

- [ ] **Step 1: Run a full TypeScript check**

```bash
npx tsc --noEmit
```

Expected: zero errors.

- [ ] **Step 2: Run Next.js production build**

```bash
npm run build
```

Expected: build completes without errors. Some warnings about missing `params` types in Next.js 15 are acceptable, but zero type errors and zero build failures.

- [ ] **Step 3: Push all commits to GitHub**

```bash
git push -u origin main
```

Expected: all commits pushed. Verify at `https://github.com/<your-username>/bac-platform`.

- [ ] **Step 4: Confirm on GitHub**

```bash
gh repo view --web
```

Expected: browser opens the repo page showing all files and the formatted README.

---

## Spec Coverage Check

| Spec Requirement | Task |
|-----------------|------|
| Create GitHub repo, public, description | Task 1 |
| Scaffold Next.js with TS, ESLint, Tailwind, App Router, src/ | Task 2 |
| Install next-intl | Task 3 |
| Configure next.config.ts with next-intl plugin | Task 4 |
| `src/i18n/routing.ts` with locales en/fr/ar | Task 5 |
| `src/i18n/request.ts` for server locale | Task 5 |
| `src/middleware.ts` for locale routing | Task 6 |
| messages/en.json, fr.json, ar.json — all features | Task 7 |
| Arabic MSA translations | Task 7 |
| Algerian French translations | Task 7 |
| `[locale]/layout.tsx` with dir/lang RTL | Task 8 |
| All placeholder pages | Task 9 |
| Navbar with locale switcher | Task 10 |
| LocaleSwitcher using next-intl Link | Task 10 |
| `src/lib/mongodb.ts` with MONGODB_URI | Task 11 |
| User model | Task 12 |
| Exercise model | Task 12 |
| Solution model | Task 12 |
| Comment model | Task 12 |
| `.env.local.example` | Task 13 |
| Verify .gitignore has .env.local | Task 13 |
| Updated README.md | Task 14 |
| Initial commit and push | Task 15 |
| All user-facing strings use useTranslations | Tasks 8–10 (every page/component) |
| TypeScript interfaces on all models | Task 12 |
