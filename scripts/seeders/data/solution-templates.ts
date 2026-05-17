/** Solution + comment templates used by the seeder. Short, realistic,
 *  not pretending to be AI-perfect math.  */

export const SOLUTION_TEMPLATES_AR = [
  'لنبدأ بدراسة الدالة: نحسب المشتقة $f\'(x)$ ثم ندرس إشارتها.\n\nمن خلال جدول التغيرات نستنتج أن الدالة متزايدة على المجال المطلوب.\n\nبعد ذلك نحسب النهاية، وننتهي بإثبات النتيجة المطلوبة.',
  'الفكرة الأساسية هي استعمال التراجع.\n\nالتهيئة: من أجل $n=0$، التحقق مباشر.\nالهرة: نفترض أن العلاقة محققة من أجل $n$ ونثبتها من أجل $n+1$.\nالنتيجة: العلاقة صحيحة من أجل كل عدد طبيعي $n$.',
  'نستعمل خاصية التماثل في الشكل الهندسي ثم نطبق نظرية فيثاغورس.\n\nبعد الحسابات نحصل على النتيجة المطلوبة.',
  'لحل هذا السؤال نستعمل قانون احتمال شرطي.\n\n$P(A \\cap B) = P(A) \\cdot P(B|A)$\n\nثم نطبق صيغة بايز للحصول على الجواب.',
  'نضع $g(x) = f(x) - x$، ندرس تغيرات $g$.\n\nنبين أن $g$ تتزايد قطعا ثم نطبق مبرهنة القيم المتوسطة.',
  'نقوم أولا بالعوامل المشتركة، ثم نحلل التعبير إلى عوامل أبسط.\n\nالنتيجة المطلوبة تأتي بعد التبسيط.',
  'نستعمل التغيير في المتغير: نضع $u = e^x$. التعبير يصبح أبسط بكثير ويمكن حله مباشرة.',
] as const;

export const SOLUTION_TEMPLATES_FR = [
  "Commençons par calculer la dérivée $f'(x)$ et étudier son signe.\n\nLe tableau de variation montre que $f$ est croissante sur l'intervalle considéré.\n\nOn calcule ensuite la limite et on conclut.",
  "On utilise le raisonnement par récurrence.\n\nInitialisation : pour $n=0$, la propriété est vérifiée.\nHérédité : supposons la propriété vraie au rang $n$, on la démontre au rang $n+1$.\nConclusion : la propriété est vraie pour tout $n \\in \\mathbb{N}$.",
  "On exploite la symétrie de la figure puis on applique le théorème de Pythagore.\n\nAprès calcul on obtient le résultat demandé.",
  "On pose $g(x) = f(x) - x$, on étudie ses variations.\n\nOn montre que $g$ est strictement croissante puis on applique le théorème des valeurs intermédiaires.",
  "On factorise l'expression puis on simplifie. Le résultat suit directement.",
  "Utilisons le changement de variable $u = e^x$. L'équation devient beaucoup plus simple et se résout directement.",
] as const;

export const COMMENT_TEMPLATES = {
  comment_ar: [
    'شكرا على الشرح!', 'هذا واضح الآن، جزاك الله خيرا.',
    'هل يمكن توضيح الخطوة الأخيرة؟', 'فهمت الفكرة، شكرا.',
    'مفيد جدا.', 'أحسنت!',
    'بارك الله فيك على المجهود.', 'كيف نطبق هذه الطريقة على تمرين آخر؟',
  ],
  comment_fr: [
    "Merci pour l'explication !", 'Très clair, merci.',
    'Peux-tu détailler la dernière étape ?', 'OK je vois mieux maintenant.',
    'Très utile, merci beaucoup.',
    'Bien expliqué.', 'Cette méthode marche aussi pour les autres exercices ?',
  ],
  tip_ar: [
    'نصيحة: لا تنسى أن تتحقق من شروط التعريف قبل تطبيق المشتقة.',
    'احرص على رسم جدول التغيرات قبل استنتاج النهاية.',
    'يمكنك استعمال طريقة التراجع لإثبات هذه المتباينة بسرعة.',
    'تذكر: المشتقة الثانية تساعد في تحديد نقاط الانعطاف.',
  ],
  tip_fr: [
    "Astuce : pense toujours à vérifier le domaine avant de dériver.",
    "Le tableau de variation aide énormément à visualiser les limites.",
    "Pour ce genre d'inégalité, la récurrence est souvent la voie la plus rapide.",
    "Astuce : la dérivée seconde permet de trouver les points d'inflexion.",
  ],
  mistake_ar: [
    'خطأ شائع: نسيان قيد $x \\neq 0$ في المقام.',
    'انتبه إلى علامة المشتقة في النصف الثاني من المجال.',
    'لا تستنتج التزايد من قيمة وحيدة.',
    'كثير من الطلبة يخلطون بين نهاية يمين ونهاية يسار.',
  ],
  mistake_fr: [
    "Attention, j'ai vu beaucoup d'élèves oublier la condition $x \\neq 0$.",
    "Erreur classique : confondre limite à droite et limite à gauche.",
    "Ne déduis pas la croissance à partir d'une seule valeur de la dérivée.",
    "Attention au signe de la dérivée sur la deuxième moitié de l'intervalle.",
  ],
} as const;
