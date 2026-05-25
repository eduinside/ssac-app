export const onRequest: PagesFunction = async ({ request }) => {
  const url = new URL(request.url);
  const hostHeader = request.headers.get('host');

  // ssac.pages.dev 요청만 리다이렉트 (API 제외)
  if (hostHeader === 'ssac.pages.dev' && !url.pathname.startsWith('/api')) {
    const newUrl = new URL(request.url);
    newUrl.hostname = 'ssac.dgedu.link';
    return new Response(null, {
      status: 301,
      headers: { 'Location': newUrl.toString() }
    });
  }

  // ssac.dgedu.link 및 다른 요청은 정상 처리
  return fetch(request);
};
