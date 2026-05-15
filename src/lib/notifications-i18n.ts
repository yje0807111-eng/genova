export function getNotificationLabel(
  notification: { type?: string | null; title?: string | null; body?: string | null; metadata?: Record<string, unknown> | null },
  t: (key: string, fallback: string) => string,
) {
  const meta = (notification.metadata ?? {}) as Record<string, unknown>;
  const videoTitle = ((meta.video_title ?? meta.videoTitle) as string | undefined) ?? "";
  const actorName = ((meta.actor_name ?? meta.actorName) as string | undefined) ?? "";

  switch (notification.type) {
    case "comment":
      return {
        title: t("notif.comment.title", "내 작품에 새 댓글"),
        body: videoTitle
          ? t("notif.comment.body", `"${videoTitle}"에 댓글이 달렸습니다`).replace("{title}", videoTitle)
          : t("notif.comment.bodyGeneric", "댓글이 달렸습니다"),
      };
    case "follow":
      return {
        title: t("notif.follow.title", "새 팔로워"),
        body: actorName
          ? t("notif.follow.body", `${actorName}님이 팔로우했습니다`).replace("{name}", actorName)
          : t("notif.follow.bodyGeneric", "프로필을 확인하세요"),
      };
    case "like": {
      const isSave =
        (notification.title ?? "").toLowerCase().includes("saved") ||
        (notification.title ?? "").toLowerCase().includes("save");
      if (isSave) {
        return {
          title: t("notif.save.title", "내 작품 저장"),
          body: videoTitle
            ? t("notif.save.body", `"${videoTitle}"이 저장되었습니다`).replace("{title}", videoTitle)
            : t("notif.save.bodyGeneric", "저장되었습니다"),
        };
      }
      return {
        title: t("notif.like.title", "내 작품에 좋아요"),
        body: videoTitle
          ? t("notif.like.body", `"${videoTitle}"이 좋아요를 받았습니다`).replace("{title}", videoTitle)
          : t("notif.like.bodyGeneric", "좋아요를 받았습니다"),
      };
    }
    case "competition_result": {
      // F1: metadata.kind discriminates finalist vs winner.  Older
      // rows (pre-metadata) fall through to the row's literal body.
      const kind = meta.kind as string | undefined;
      const title = (meta.video_title as string | undefined) ?? "";
      const award = (meta.award as string | undefined) ?? "";
      if (kind === "finalist" && title) {
        return {
          title: t("notif.competition.finalistTitle", "결선 진출"),
          body: t("notif.competition.finalistBody", `${title}가 결선에 진출했습니다`)
            .replace("{title}", title),
        };
      }
      if (kind === "winner" && title) {
        return {
          title: t("notif.competition.winnerTitle", "공모전 수상"),
          body: t("notif.competition.winnerBody", `${title} · ${award}`)
            .replace("{title}", title)
            .replace("{award}", award),
        };
      }
      return {
        title: t("notif.competition.title", "공모전 결과"),
        body: notification.body ?? "",
      };
    }
    case "trophy": {
      // F1: metadata.kind 'competition' (manual award) vs 'weekly'
      // (auto weekly rank).  Pre-F1 rows fall through to the literal
      // server-stamped title.
      const kind = meta.kind as string | undefined;
      if (kind === "competition") {
        const compTitle = (meta.competition_title as string | undefined) ?? "";
        const award = (meta.award as string | undefined) ?? "";
        if (compTitle && award) {
          return {
            title: t("notif.trophy.title", "트로피 획득"),
            body: t("notif.trophy.competitionBody", `${compTitle}에서 ${award} 수상`)
              .replace("{title}", compTitle)
              .replace("{award}", award),
          };
        }
      }
      if (kind === "weekly") {
        const genreLabel = (meta.genre_label as string | undefined) ?? "";
        const rank = (meta.rank as number | string | undefined) ?? "";
        if (genreLabel && rank !== "") {
          return {
            title: t("notif.trophy.title", "트로피 획득"),
            body: t("notif.trophy.weeklyBody", `${genreLabel} 주간 ${rank}위`)
              .replace("{genre}", genreLabel)
              .replace("{rank}", String(rank)),
          };
        }
      }
      return {
        title: t("notif.trophy.title", "트로피 획득"),
        body: notification.body ?? notification.title ?? "",
      };
    }
    case "lottery_winner": {
      // F1: metadata carries prize_tier + prize_amount_usd.  claim_token
      // is NOT in metadata (security policy) — only in the href.
      const tier = (meta.prize_tier as number | string | undefined) ?? "";
      const amount = (meta.prize_amount_usd as number | string | undefined) ?? "";
      const bodyFromMeta =
        tier !== "" && amount !== ""
          ? t("notif.lotteryWinner.body", `Tier ${tier} · $${amount}`)
              .replace("{tier}", String(tier))
              .replace("{amount}", String(amount))
          : null;
      return {
        title: notification.title?.trim()
          ? notification.title
          : t("notif.lotteryWinner.title", "🎉 You won the Genova lottery"),
        body: bodyFromMeta ?? notification.body ?? "",
      };
    }
    case "lottery_reminder": {
      const amount = (meta.prize_amount_usd as number | string | undefined) ?? "";
      const daysLeft = (meta.days_left as number | string | undefined) ?? "";
      const bodyFromMeta =
        amount !== "" && daysLeft !== ""
          ? t("notif.lotteryReminder.body", `$${amount} prize · ${daysLeft} days left`)
              .replace("{amount}", String(amount))
              .replace("{days}", String(daysLeft))
          : null;
      return {
        title: notification.title?.trim()
          ? notification.title
          : t("notif.lotteryReminder.title", "⏰ Claim deadline approaching"),
        body: bodyFromMeta ?? notification.body ?? "",
      };
    }
    default:
      return {
        title: notification.title ?? "",
        body: notification.body ?? "",
      };
  }
}
