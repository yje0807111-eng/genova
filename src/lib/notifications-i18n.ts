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
    default:
      return {
        title: notification.title ?? "",
        body: notification.body ?? "",
      };
  }
}
