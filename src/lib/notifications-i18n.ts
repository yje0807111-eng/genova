export function getNotificationLabel(
  notification: { type?: string | null; title?: string | null; body?: string | null; metadata?: Record<string, unknown> },
  t: (key: string, fallback: string) => string,
) {
  const meta = (notification.metadata ?? {}) as Record<string, string>;
  const videoTitle = meta.video_title ?? meta.videoTitle ?? "";
  const actorName = meta.actor_name ?? meta.actorName ?? "";

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
    case "competition_result":
      return {
        title: t("notif.competition.title", "공모전 결과"),
        body: notification.body ?? "",
      };
    case "trophy":
      return {
        title: t("notif.trophy.title", "트로피 획득"),
        body: notification.body ?? "",
      };
    case "lottery_winner":
      // The row's `title` ("🎉 You won …") and `body` ("Tier X · $Y …")
      // are populated server-side in English at insert time
      // (lottery-admin.ts → dispatchWinnerNotifications).  Surfacing
      // them through dedicated i18n keys with structured fields will
      // require a `metadata` jsonb column on notifications — until
      // then we pass the server strings through unchanged but use a
      // canonical title key so the UI can theme this type even on a
      // missing-body row.
      return {
        title: notification.title?.trim()
          ? notification.title
          : t("notif.lotteryWinner.title", "🎉 You won the Genova lottery"),
        body: notification.body ?? "",
      };
    case "lottery_reminder":
      return {
        title: notification.title?.trim()
          ? notification.title
          : t("notif.lotteryReminder.title", "⏰ Claim deadline approaching"),
        body: notification.body ?? "",
      };
    default:
      return {
        title: notification.title ?? "",
        body: notification.body ?? "",
      };
  }
}
