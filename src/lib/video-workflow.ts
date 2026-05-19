import type { Video } from "@/lib/types";

/**
 * 영상에 노출 가능한 "제작 워크플로우" 정보가 있는지.
 * (워크플로우 jsonb 의 어떤 필드든 채워졌거나 ai_tools 가 있으면 true)
 * 시청 페이지 워크플로우 탭 노출·홈 워크플로우 필터에서 공용 사용.
 */
export function hasWorkflowContent(v: Video): boolean {
  const wf = v.workflow ?? null;
  return Boolean(
    (v.aiTools && v.aiTools.length > 0) ||
      (wf &&
        ((wf.steps && wf.steps.length > 0) ||
          wf.prompts?.trim() ||
          wf.models?.trim() ||
          (wf.links && wf.links.length > 0))),
  );
}
