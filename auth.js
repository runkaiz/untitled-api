/**
 * Middleware to handle authentication from the request
 * @param {Request} request
 */
export default async function auth(request) {
  let isValid = await isValidToken(request)
  if (!isValid) {
    // Return a 401 response if the token is not valid, which skips the rest of the worker function.
    return new Response('Invalid Token', { status: 401 })
  }
  // Continue with the request.
}

/**
 * Read the Authorization header and check.
 *
 * Header: Authorization: Token <token>
 */

async function isValidToken(request) {
  if (!request.headers.get('Authorization')) {
    return false
  }

  // Remove "Token " from the header
  const token = request.headers.get('Authorization').replace('Token ', '')
  if (!token) {
    return false
  }

  // Check if the token is in the KV store
  const result = await TOKENS.get(token)
  if (!result) {
    return false
  }
  return true
}
