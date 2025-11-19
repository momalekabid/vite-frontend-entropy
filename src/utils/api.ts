// authenticated fetch wrapper that includes google id token
export async function authenticatedFetch(url: string, options: RequestInit = {}) {
  const idToken = localStorage.getItem('google_id_token')

  const headers = new Headers(options.headers)

  if (idToken) {
    headers.set('Authorization', `Bearer ${idToken}`)
  }

  return fetch(url, {
    ...options,
    headers
  })
}
