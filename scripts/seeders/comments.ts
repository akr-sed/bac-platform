import Comment from '../../src/models/Comment';
import { COMMENT_TEMPLATES } from './data/solution-templates';
import { type SeedContext, pick, weightedPick } from './context';

export interface CommentsReport {
  total: number;
  byKind: { comment: number; tip: number; mistake: number };
}

export async function seedComments(ctx: SeedContext): Promise<CommentsReport> {
  const report: CommentsReport = {
    total: 0,
    byKind: { comment: 0, tip: 0, mistake: 0 },
  };

  for (const sol of ctx.solutions) {
    if (ctx.rng() < 0.4) continue;
    const n = 1 + Math.floor(ctx.rng() * 5);
    for (let i = 0; i < n; i++) {
      const kind = weightedPick<'comment' | 'tip' | 'mistake'>(
        [
          ['comment', 0.7],
          ['tip', 0.2],
          ['mistake', 0.1],
        ],
        ctx.rng
      );
      const useAr = ctx.rng() < 0.7;
      const tplKey = `${kind}_${useAr ? 'ar' : 'fr'}` as keyof typeof COMMENT_TEMPLATES;
      const content = pick(COMMENT_TEMPLATES[tplKey], ctx.rng);
      const author = pick(ctx.users, ctx.rng);
      const createdAt = new Date(
        sol.createdAt.getTime() + Math.floor(ctx.rng() * 14 * 86400000)
      );

      await Comment.create({
        solutionId: sol._id,
        authorId: author._id,
        content,
        kind,
        createdAt,
      });

      report.total += 1;
      report.byKind[kind] += 1;
    }
  }

  return report;
}
