import { redirect } from "next/navigation";

/**
 * 업로드 전용 페이지는 폐기 — 업로드는 항상 팝업(useUploadModal)
 * 으로만 처리한다.  모든 진입점(사이드바 / 콘테스트 / 응모권 안내
 * / 프로필 / hero)이 이미 openUploadModal() 을 호출하므로 직접
 * URL 접근만 여기로 떨어진다.  홈으로 보내 사이드바의 업로드
 * 버튼(모달)으로 유도한다.
 *
 * 라우트 자체를 지우면 기존 북마크/외부 링크가 404 가 되므로
 * redirect 로 유지.
 */
export default function UploadPageRedirect() {
  redirect("/");
}
