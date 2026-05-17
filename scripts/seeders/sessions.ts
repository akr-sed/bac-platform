import { Types } from 'mongoose';
import Session from '../../src/models/Session';
import SessionEnrollment from '../../src/models/SessionEnrollment';
import { type SeedContext, pick, pickN, weightedPick } from './context';

export interface SessionsReport {
  total: number;
  byStatus: Record<string, number>;
  byTopic: Record<string, number>;
  enrollments: number;
  freeSessions: number;
  paidSessions: number;
  linkedExercises: number;
}

// ---------------------------------------------------------------------------
// Topic palette — aligned 1:1 with the BAC corpus topic field. Counts in the
// extracted JSONs at time of writing: analyse 113, nombres_complexes 47,
// arithmetique 35, probabilites 31, geometrie 28, suites_numeriques 1,
// equations_differentielles 1. The weights below mirror that distribution so
// the most common topics get the most live sessions.
// ---------------------------------------------------------------------------

type TopicArea =
  | 'analyse'
  | 'nombres_complexes'
  | 'arithmetique'
  | 'probabilites'
  | 'geometrie'
  | 'suites_numeriques'
  | 'equations_differentielles';

const TOPIC_WEIGHTS: ReadonlyArray<readonly [TopicArea, number]> = [
  ['analyse', 0.36],
  ['nombres_complexes', 0.18],
  ['arithmetique', 0.14],
  ['probabilites', 0.13],
  ['geometrie', 0.13],
  ['suites_numeriques', 0.03],
  ['equations_differentielles', 0.03],
];

interface SessionTemplate {
  title: string;
  description: string;
  topics: string[];
  durationMinutes: number;
  /** Hour of day (Algeria, GMT+1). Schedule lands at this hour ± 15 min. */
  preferredHour: number;
}

const TEMPLATES: Record<TopicArea, SessionTemplate[]> = {
  analyse: [
    {
      title: 'Étude complète d\'une fonction — préparation BAC',
      description:
        "Atelier intensif sur l'étude de fonction : domaine, limites, dérivée, tableau de variation, asymptotes et représentation graphique. Nous travaillerons sur deux sujets BAC corrigés en direct.\n\nPré-requis : connaître les règles de dérivation usuelles.\nÀ la fin de la séance : tu dois pouvoir mener une étude de fonction complète en moins de 45 minutes.",
      topics: ['étude-de-fonction', 'dérivation', 'limites'],
      durationMinutes: 90,
      preferredHour: 19,
    },
    {
      title: 'حساب التكاملات — تقنيات وحالات نموذجية',
      description:
        'حصة مكثفة حول التكامل: التكامل بالتجزئة، تغيير المتغير، التكامل التحت متقاربة. سنحل ثلاثة تمارين من بكالوريات 2018، 2021 و2023.\n\nمتطلبات: إتقان المشتقات الأساسية.\nبعد الحصة: ستكون قادرا على حل تمارين التكامل في الامتحان بثقة.',
      topics: ['integrales', 'calcul-integral', 'analyse'],
      durationMinutes: 90,
      preferredHour: 20,
    },
    {
      title: 'Logarithme népérien & exponentielle — fondamentaux + BAC',
      description:
        "Reprise complète des fonctions ln et exp : propriétés, équations, inéquations, étude de fonctions composées. Exercices ciblés pour la partie 'fonctions exponentielles' du BAC.",
      topics: ['logarithme', 'exponentielle', 'fonctions'],
      durationMinutes: 75,
      preferredHour: 18,
    },
    {
      title: 'مراجعة الاشتقاق ودراسة اتجاه التغير',
      description:
        'كل ما تحتاج معرفته حول الاشتقاق: المشتقات النموذجية، اشتقاق الدوال المركبة، دراسة إشارة المشتقة، وحساب القيم الحدية. تمارين تطبيقية من بكالوريا 2019 و2022.',
      topics: ['dérivation', 'variations', 'analyse'],
      durationMinutes: 60,
      preferredHour: 18,
    },
    {
      title: 'Limites et continuité — éviter les pièges du BAC',
      description:
        "Maîtriser le calcul de limites : formes indéterminées, croissances comparées, limites en l'infini et en un point. Focus sur les pièges classiques de l'examen.",
      topics: ['limites', 'continuité', 'analyse'],
      durationMinutes: 60,
      preferredHour: 19,
    },
  ],
  nombres_complexes: [
    {
      title: 'Nombres complexes — module, argument, forme exponentielle',
      description:
        "Tout le programme des complexes : écritures algébrique/trigonométrique/exponentielle, opérations, résolutions d'équations du second degré à coefficients complexes. Trois exercices de BAC corrigés.",
      topics: ['complexes', 'module', 'argument'],
      durationMinutes: 75,
      preferredHour: 19,
    },
    {
      title: 'الأعداد المركبة والتحويلات الهندسية في المستوي',
      description:
        'الجزء الهندسي للأعداد المركبة: الإزاحات، الدورانات، التحاكي، طبيعة المثلثات والرباعيات. سنغطي تمرينا كاملا من بكالوريا 2021.\n\nمتطلبات: معرفة الشكل الأسي.',
      topics: ['géométrie-complexe', 'transformations', 'complexes'],
      durationMinutes: 90,
      preferredHour: 18,
    },
    {
      title: 'Résolution d\'équations dans ℂ — méthodes et astuces',
      description:
        "Équations du second et troisième degré dans ℂ, racines n-ièmes de l'unité. Comment factoriser rapidement et trouver toutes les solutions.",
      topics: ['équations', 'complexes', 'racines'],
      durationMinutes: 60,
      preferredHour: 20,
    },
    {
      title: 'مراجعة شاملة: الأعداد المركبة في بكالوريا الرياضيات',
      description:
        'حصة مراجعة عامة تغطي كل النقاط المتكررة في امتحانات البكالوريا حول الأعداد المركبة بين 2015 و2023. مع ملخص قابل للتحميل.',
      topics: ['complexes', 'révision', 'bac'],
      durationMinutes: 60,
      preferredHour: 17,
    },
  ],
  arithmetique: [
    {
      title: 'Congruences et théorèmes fondamentaux — niveau BAC',
      description:
        "Tout savoir sur les congruences modulo n, le théorème de Bezout, le PGCD/PPCM et le théorème de Gauss. Démarrer par les bases et finir par un exercice complet de BAC.",
      topics: ['congruences', 'pgcd', 'bezout'],
      durationMinutes: 90,
      preferredHour: 19,
    },
    {
      title: 'المتطابقات والقسمة الإقليدية — تطبيقات بكالوريا',
      description:
        'حصة تركز على القسمة الإقليدية، المتطابقات modulo n، وحل المعادلات الديوفنطية ax + by = c. مع شرح طريقة العثور على الحلول الكاملة.',
      topics: ['arithmétique', 'division-euclidienne', 'diophantienne'],
      durationMinutes: 75,
      preferredHour: 20,
    },
    {
      title: 'PGCD, PPCM et nombres premiers entre eux',
      description:
        "Comprendre et maîtriser le PGCD via l'algorithme d'Euclide, ainsi que les nombres premiers entre eux. Exercices type BAC.",
      topics: ['pgcd', 'algorithme-euclide', 'arithmétique'],
      durationMinutes: 60,
      preferredHour: 18,
    },
    {
      title: 'البرهان بالاستدلال في الحسابيات',
      description:
        'استخدام الاستدلال بالتراجع، الاستدلال بالعد، والاستدلال بالخلف في تمارين الحسابيات. التركيز على البراهين الصارمة.',
      topics: ['raisonnement', 'récurrence', 'arithmétique'],
      durationMinutes: 60,
      preferredHour: 18,
    },
  ],
  probabilites: [
    {
      title: 'Probabilités conditionnelles & lois discrètes',
      description:
        "Probabilités conditionnelles, indépendance, loi binomiale, loi hypergéométrique. On résoudra ensemble un exercice type BAC sur un arbre pondéré et une variable aléatoire.\n\nPré-requis : combinatoire de base (Cⁿₖ).",
      topics: ['probabilités', 'lois-discrètes', 'arbre-pondéré'],
      durationMinutes: 75,
      preferredHour: 19,
    },
    {
      title: 'الاحتمالات الشرطية وقانون بايز',
      description:
        'مفاهيم الاحتمالات الشرطية، صيغة الاحتمالات الكلية، وقانون بايز. أمثلة من سحب بدون إعادة ومن مشاكل الكشف الطبي.',
      topics: ['probabilités-conditionnelles', 'bayes', 'tirages'],
      durationMinutes: 60,
      preferredHour: 18,
    },
    {
      title: 'Variables aléatoires — espérance, variance, écart-type',
      description:
        "Loi de probabilité d'une VA, calcul de l'espérance et de la variance, simulation. Suivi d'un exercice de probabilité complet sur 6 points.",
      topics: ['variable-aléatoire', 'espérance', 'variance'],
      durationMinutes: 75,
      preferredHour: 20,
    },
    {
      title: 'التحليل التوافقي للبكالوريا',
      description:
        'الترتيبات، التوافيق، التراتيب: متى نستعمل كل واحد منها. تمارين تطبيقية على سحب الكريات والمواقع.',
      topics: ['combinatoire', 'analyse-combinatoire', 'dénombrement'],
      durationMinutes: 60,
      preferredHour: 17,
    },
  ],
  geometrie: [
    {
      title: 'Géométrie dans l\'espace — produit scalaire & équations de plans',
      description:
        "Maîtriser la géométrie analytique 3D : produit scalaire, produit vectoriel, équations de droites et de plans, distances, intersections.",
      topics: ['géométrie-3d', 'produit-scalaire', 'plans'],
      durationMinutes: 90,
      preferredHour: 19,
    },
    {
      title: 'الهندسة الفضائية — مستقيمات ومستويات',
      description:
        'حصة على الهندسة في الفضاء: تمثيل وسيطي للمستقيم، المعادلة الديكارتية للمستوي، حساب المسافات وزوايا التقاطع. مرفقة برسومات تفاعلية.',
      topics: ['géométrie-espace', 'vecteurs', 'distances'],
      durationMinutes: 75,
      preferredHour: 18,
    },
    {
      title: 'Sphères, paramètres et intersections — préparation BAC',
      description:
        "Comment caractériser une sphère, calculer son intersection avec un plan, et résoudre les problèmes d'intersection droite-sphère.",
      topics: ['sphères', 'intersections', 'géométrie-3d'],
      durationMinutes: 60,
      preferredHour: 20,
    },
  ],
  suites_numeriques: [
    {
      title: 'Suites numériques — convergence & raisonnement par récurrence',
      description:
        "Suites arithmétiques, géométriques, récurrentes. Démontrer par récurrence, étudier la monotonie et la convergence. Théorèmes essentiels du BAC.",
      topics: ['suites', 'récurrence', 'convergence'],
      durationMinutes: 90,
      preferredHour: 19,
    },
    {
      title: 'المتتاليات والاستدلال بالتراجع — تحضير البكالوريا',
      description:
        'حصة شاملة على المتتاليات: الحدية، الرتابة، التقارب، والاستدلال بالتراجع. تمارين من بكالوريات سابقة.',
      topics: ['suites', 'récurrence', 'monotonie'],
      durationMinutes: 75,
      preferredHour: 18,
    },
  ],
  equations_differentielles: [
    {
      title: 'Équations différentielles — y\' = ay + b et applications',
      description:
        "Résoudre les équations différentielles du premier ordre, conditions initiales, applications physiques (refroidissement, désintégration). Niveau BAC math.",
      topics: ['équations-différentielles', 'modélisation'],
      durationMinutes: 75,
      preferredHour: 19,
    },
    {
      title: 'المعادلات التفاضلية البسيطة وتطبيقاتها',
      description:
        'المعادلات التفاضلية من النمط y\' = ay + b، الحلول العامة والخاصة، وأمثلة من الفيزياء. مناسبة لشعبة الرياضيات.',
      topics: ['équations-différentielles', 'modélisation'],
      durationMinutes: 60,
      preferredHour: 20,
    },
  ],
};

// Meeting URL templates — each session gets a unique-ish URL.
const MEET_HOSTS = [
  (id: string) => `https://meet.google.com/${id}`,
  (id: string) => `https://meet.jit.si/bac-platform-${id}`,
  (id: string) => `https://us02web.zoom.us/j/${id}`,
];

function makeMeetingUrl(rng: () => number, sessionId: string): string {
  const host = pick(MEET_HOSTS, rng);
  // Mix in the session id so each session has its own room. Google Meet uses
  // xxx-xxxx-xxx, Jitsi accepts arbitrary slugs, Zoom takes a numeric id —
  // the hosts above tolerate any of these so we keep it simple.
  const slug = sessionId.slice(-12);
  return host(`${slug.slice(0, 3)}-${slug.slice(3, 7)}-${slug.slice(7, 10)}`);
}

/**
 * Schedule logic — bias to evenings, mostly upcoming, some recent past for
 * a "previous sessions" trail. ScheduledAt is always at the template's
 * preferredHour ± 15min, on a date drawn from one of:
 *   - 70% upcoming (next 28 days)
 *   - 25% past (last 60 days, completed sessions)
 *   - 5% imminent (within ±90 min, candidate for live status)
 */
function pickScheduledAt(template: SessionTemplate, rng: () => number): Date {
  const r = rng();
  const now = new Date();
  let target: Date;
  if (r < 0.05) {
    target = new Date(now.getTime() + (rng() * 10800000 - 5400000));
  } else if (r < 0.75) {
    target = new Date(now.getTime() + Math.floor(rng() * 28 * 86400000) + 3600000);
  } else {
    target = new Date(now.getTime() - Math.floor(rng() * 60 * 86400000) - 86400000);
  }
  // Snap to the template's preferred hour ± 15 minutes (Algeria local time
  // ≈ server UTC+1; we just write the absolute timestamp, the UI handles tz).
  target.setHours(template.preferredHour, Math.floor(rng() * 60), 0, 0);
  return target;
}

function statusFor(scheduledAt: Date, rng: () => number): 'scheduled' | 'live' | 'completed' | 'cancelled' {
  const now = Date.now();
  const ts = scheduledAt.getTime();
  if (ts < now - 86400000) return 'completed';
  if (Math.abs(ts - now) < 5400000) {
    return rng() < 0.5 ? 'live' : 'scheduled';
  }
  return weightedPick<'scheduled' | 'cancelled'>(
    [
      ['scheduled', 0.94],
      ['cancelled', 0.06],
    ],
    rng
  );
}

interface TeacherProfile {
  userId: Types.ObjectId;
  isVerified: boolean;
  specialty: TopicArea;
  /** 0-1; influences pricing willingness and capacity ambition. */
  reputation: number;
}

/**
 * Phase 9: seed realistic live sessions led by teachers.
 *  - Each teacher gets a deterministic specialty (one TopicArea).
 *  - Verified teachers host 2-3 sessions, unverified 0-1.
 *  - Each session links to 2-4 real library exercises matching its topic.
 *  - Pricing skews paid for verified + reputation > 0.5, free otherwise.
 *  - One free upcoming session is guaranteed to enrol the preserved user
 *    so the live deployment has a visible "joined" session out of the box.
 */
export async function seedSessions(ctx: SeedContext): Promise<SessionsReport> {
  const allTeachers = ctx.users.filter((u) => u.role === 'teacher');
  const students = ctx.users.filter((u) => u.role === 'student');
  if (allTeachers.length === 0) {
    return {
      total: 0,
      byStatus: {},
      byTopic: {},
      enrollments: 0,
      freeSessions: 0,
      paidSessions: 0,
      linkedExercises: 0,
    };
  }

  // Bucket library exercises by topic so each session can sample real BAC
  // problems from its area.
  const exercisesByTopic = new Map<string, Types.ObjectId[]>();
  for (const ex of ctx.libraryExercises) {
    if (!ex.topic) continue;
    const bucket = exercisesByTopic.get(ex.topic) ?? [];
    bucket.push(ex._id);
    exercisesByTopic.set(ex.topic, bucket);
  }

  // Assign each teacher a deterministic specialty + reputation score.
  const profiles: TeacherProfile[] = allTeachers.map((t) => ({
    userId: t._id,
    isVerified: t.isVerifiedTeacher,
    specialty: weightedPick(TOPIC_WEIGHTS, ctx.rng),
    reputation: t.isVerifiedTeacher ? 0.5 + ctx.rng() * 0.5 : ctx.rng() * 0.4,
  }));

  const byStatus: Record<string, number> = {
    scheduled: 0,
    live: 0,
    completed: 0,
    cancelled: 0,
  };
  const byTopic: Record<string, number> = {};
  let enrollments = 0;
  let freeSessions = 0;
  let paidSessions = 0;
  let total = 0;
  let linkedExercises = 0;

  for (const profile of profiles) {
    // Verified teachers host more sessions; reputation lifts the count.
    const baseCount = profile.isVerified ? 2 : 0;
    const bonus = ctx.rng() < profile.reputation ? 1 : 0;
    const count = baseCount + bonus;
    if (count === 0) continue;

    const specialtyTemplates = TEMPLATES[profile.specialty];
    const picked = pickN(specialtyTemplates, Math.min(count, specialtyTemplates.length), ctx.rng);
    // Pad with extra rolls if a teacher hosts more sessions than there are
    // templates in their specialty (rare, but possible for analyse).
    while (picked.length < count) {
      picked.push(pick(specialtyTemplates, ctx.rng));
    }

    for (const template of picked) {
      const scheduledAt = pickScheduledAt(template, ctx.rng);
      const status = statusFor(scheduledAt, ctx.rng);
      const capacity = ctx.rng() < 0.3 ? null : pick([15, 20, 25, 30], ctx.rng);

      // Pricing — verified teachers with reputation > 0.5 charge most of the
      // time; everyone else stays mostly free.
      let priceDA = 0;
      if (profile.isVerified && profile.reputation > 0.5 && ctx.rng() < 0.65) {
        priceDA = weightedPick<number>(
          [
            [500, 0.25],
            [800, 0.3],
            [1000, 0.25],
            [1500, 0.15],
            [2500, 0.05],
          ],
          ctx.rng
        );
      }

      // Pull 2-4 real library exercises from the matching topic for the
      // teacher's preparation kit.
      const pool = exercisesByTopic.get(profile.specialty) ?? [];
      const exerciseIds =
        pool.length > 0 ? pickN(pool, Math.min(2 + Math.floor(ctx.rng() * 3), pool.length), ctx.rng) : [];

      // Build the session first so we can mint a per-session meeting URL.
      const placeholder = new Types.ObjectId();
      const session = await Session.create({
        _id: placeholder,
        title: template.title,
        description: template.description,
        teacherId: profile.userId,
        subject: 'mathematics',
        topics: template.topics,
        exerciseIds,
        scheduledAt,
        durationMinutes: template.durationMinutes,
        meetingUrl: makeMeetingUrl(ctx.rng, placeholder.toString()),
        capacity,
        priceDA,
        status,
        enrolledCount: 0,
        createdAt: new Date(scheduledAt.getTime() - Math.floor(ctx.rng() * 14 * 86400000) - 86400000),
      });

      total += 1;
      byStatus[status] = (byStatus[status] ?? 0) + 1;
      byTopic[profile.specialty] = (byTopic[profile.specialty] ?? 0) + 1;
      if (priceDA === 0) freeSessions += 1;
      else paidSessions += 1;
      linkedExercises += exerciseIds.length;

      // Enrollments: completed/scheduled/live can have students; cancelled
      // shouldn't. Fill ratio: reputation-driven, dampened by price.
      if (status !== 'cancelled' && students.length > 0) {
        const ceiling = capacity ?? 25;
        const baseFill = 0.25 + profile.reputation * 0.6;
        const priceDamp = priceDA === 0 ? 1 : 0.55 - Math.min(0.4, priceDA / 5000);
        const recencyBoost = status === 'live' ? 1.1 : status === 'completed' ? 0.85 : 1;
        const target = Math.max(
          1,
          Math.floor(ceiling * baseFill * priceDamp * recencyBoost)
        );

        const enrollees = pickN(students, Math.min(target, students.length), ctx.rng);
        let landed = 0;
        for (const student of enrollees) {
          try {
            await SessionEnrollment.create({
              userId: student._id,
              sessionId: session._id as Types.ObjectId,
            });
            landed += 1;
          } catch {
            /* duplicate */
          }
        }
        if (landed > 0) {
          await Session.findByIdAndUpdate(session._id, { enrolledCount: landed });
          enrollments += landed;
        }
      }
    }
  }

  // Make sure the preserved user has at least one upcoming free session
  // they're enrolled in (handy for live-demo screenshots).
  const showcase = await Session.findOne({
    status: 'scheduled',
    priceDA: 0,
    scheduledAt: { $gt: new Date() },
  })
    .sort({ scheduledAt: 1 })
    .select('_id');
  if (showcase) {
    try {
      await SessionEnrollment.create({
        userId: ctx.preservedUserId,
        sessionId: showcase._id,
      });
      await Session.findByIdAndUpdate(showcase._id, { $inc: { enrolledCount: 1 } });
      enrollments += 1;
    } catch {
      /* already enrolled */
    }
  }

  return {
    total,
    byStatus,
    byTopic,
    enrollments,
    freeSessions,
    paidSessions,
    linkedExercises,
  };
}
