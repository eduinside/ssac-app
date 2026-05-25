export const onRequest: PagesFunction = async ({ request }) => {
  const url = new URL(request.url);

  // ssac.pages.dev에서만 리다이렉트 (API는 제외)
  if (url.hostname === 'ssac.pages.dev' && !url.pathname.startsWith('/api')) {
    const newUrl = new URL(request.url);
    newUrl.hostname = 'ssac.dgedu.link';
    return new Response(null, {
      status: 301,
      headers: { 'Location': newUrl.toString() }
    });
  }

  // 다른 요청은 정상 처리
  return fetch(request);
};
