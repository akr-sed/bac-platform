/** Hand-curated Algerian first names + last names + post framing templates.
 *  Covers male + female given names; surnames are common Algerian patronyms. */

export const FIRST_NAMES = [
  // Male
  'Mohamed', 'Yacine', 'Amine', 'Karim', 'Nassim', 'Sofiane', 'Bilal', 'Walid',
  'Anis', 'Mehdi', 'Adel', 'Youcef', 'Ramzi', 'Idris', 'Akram', 'Salah',
  'Hicham', 'Rachid', 'Toufik', 'Brahim',
  // Female
  'Fatima', 'Yasmine', 'Lina', 'Khadidja', 'Imane', 'Nour', 'Soraya', 'Amina',
  'Meriem', 'Aya', 'Sara', 'Hadjer', 'Soumia', 'Wassila', 'Asma', 'Manel',
  'Ines', 'Latifa', 'Nadia', 'Selma',
] as const;

export const LAST_NAMES = [
  'Benali', 'Bouchareb', 'Khelifi', 'Bouzid', 'Belkacem', 'Cherif', 'Hadj',
  'Mansouri', 'Ouali', 'Saadi', 'Bensaid', 'Boudraa', 'Touati', 'Ferhat',
  'Mokrani', 'Zerouali', 'Rahmani', 'Belaid', 'Tahar', 'Brahimi',
  'Larbi', 'Ammari', 'Hamidi', 'Boukhari', 'Djelloul', 'Bouab', 'Aitouali',
] as const;

export const FRAMING_TEMPLATES_AR = [
  'استنجد بكم، أنا عالق في هذا التمرين من بكالوريا {year}:',
  'مرحبا، كيف نحل هذا السؤال؟',
  'لم أفهم كيفية الانتقال للخطوة التالية:',
  'هل أحد يستطيع شرح هذا التمرين؟',
  'سلام عليكم، أريد المساعدة في:',
  'من فضلكم، هل من يفهم هذا السؤال؟',
] as const;

export const FRAMING_TEMPLATES_FR = [
  'Bonjour, je suis bloqué(e) sur cet exercice du BAC {year}.',
  "Quelqu'un peut m'aider à comprendre cette question ?",
  "Je ne vois pas comment passer à l'étape suivante :",
  "Salut tout le monde, j'aurais besoin d'aide pour :",
  "Comment résoudre cette question ?",
] as const;
