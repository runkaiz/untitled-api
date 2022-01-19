import { Router } from 'itty-router'
import auth from './auth'

// Create a new router
const router = Router()

/*
The index route. 
For compatibility with the old API, the following two routes deal with retrieving or adding articles.
TODO: migrate this function into POST/GET /article and GET /articles
Parameters:
  - id: the id of the article to retrieve                   (optional)
        returns a list of articles if no id is specified
*/
router.get('/', async request => {

  const url = new URL(request.url)

  const id = url.searchParams.get('id')
  const imagesIndex = url.searchParams.get('imagesIndex')
  const imagesSize = url.searchParams.get('imagesSize')

  if (imagesIndex && imagesSize) {
    return listImages(imagesIndex, imagesSize++)
  } else if (imagesIndex) {
    return listImages(imagesIndex, 50)
  }

  if (id) {
    return readPost(id)
  } else {
    return listPosts()
  }
})

router.post('/', auth, async request => {
  // TODO: Validate the requesthttps://api.untitled.workers.dev
  return addPost(await request.text())
})

/*
Getting a list of images, pagination builtin.
*/
async function listImages(index, length) {
  const myHeaders = new Headers()
  myHeaders.set('Access-Control-Allow-Origin', '*')
  myHeaders.set('Access-Control-Allow-Methods', 'GET')
  myHeaders.set('Access-Control-Max-Age', '86400')
  myHeaders.set('content-type', 'application/json')

  const result = await fetch(`https://api.cloudflare.com/client/v4/accounts/999082d41b8b1f538b37a8f395918c33/images/v1?page=${index}&per_page=${length}`, {
        method: "GET",
        mode: 'cors',
        headers: {
            'Content-Type':'application/json',
            'Authorization': 'Bearer wC2nozCkOTw3dJ9arYQvdp9ibcYoRuZIOVB38Fis'
        }})
  .then((response) => {
     console.log(response);
  })

  return new Response(JSON.stringify(result), {
    status: 200,
    headers: myHeaders,
  })
}

async function listPosts() {
  const myHeaders = new Headers()
  myHeaders.set('Access-Control-Allow-Origin', '*')
  myHeaders.set('Access-Control-Allow-Methods', 'GET')
  myHeaders.set('Access-Control-Max-Age', '86400')
  myHeaders.set('content-type', 'application/json')
  const result = await BLOG.list()

  return new Response(JSON.stringify(result.keys), {
    status: 200,
    headers: myHeaders,
  })
}

async function readPost(key) {
  const myHeaders = new Headers()
  myHeaders.set('Access-Control-Allow-Origin', '*')
  myHeaders.set('Access-Control-Allow-Methods', 'GET')
  myHeaders.set('Access-Control-Max-Age', '86400')
  myHeaders.set('content-type', 'text/plain')

  const result = await BLOG.get(key)

  return new Response(result, { status: 200, headers: myHeaders })
}

async function addPost(markdown) {
  const myHeaders = new Headers()
  myHeaders.set('Access-Control-Allow-Origin', '*')
  myHeaders.set('Access-Control-Allow-Methods', 'POST')
  myHeaders.set('Access-Control-Max-Age', '86400')
  myHeaders.set('content-type', 'text/plain')

  const result = await BLOG.put(Date.now(), markdown)

  return new Response('Post Uploaded!', {
    headers: myHeaders,
  })
}

/*
The /updates route.
For GET requests, the url parameters are:
  - limit: the number of updates to retrieve (optional, default: 10)
  - cursor: the cursor to start from (optional, default: 0)
  Returns a list of updates, starting with the most recent.

For POST requests, the body should be a JSON object with the following fields:
  - title: the title of the update                          (optional)
  - content: the content of the update                      (required)
  - date: the date of the update                            (optional, default: the current date)
  - tagged: a list of authors who are tagged in the update  (optional)
  - imgUrl: the url of the image to be used for the update  (optional)
*/
router.get('/updates', async request => {
  const limit = new URL(request.url).searchParams.get('limit')
  const cursor = new URL(request.url).searchParams.get('cursor')
  return listUpdates(limit, cursor)
})

router.post('/updates', auth, async request => {
  // TODO: Validate the request
  const update = await request.json()
  return addUpdate(update)
})

async function listUpdates(limit, cursor) {
  const myHeaders = new Headers()
  myHeaders.set('Access-Control-Allow-Origin', '*')
  myHeaders.set('Access-Control-Allow-Methods', 'GET')
  myHeaders.set('Access-Control-Max-Age', '86400')
  myHeaders.set('content-type', 'application/json')

  if (!limit) {
    limit = 10
  }

  const result = await UPDATES.list({ limit, cursor })

  return new Response(JSON.stringify(result.keys), {
    status: 200,
    headers: myHeaders,
  })
}

async function addUpdate(update) {
  const myHeaders = new Headers()
  myHeaders.set('Access-Control-Allow-Origin', '*')
  myHeaders.set('Access-Control-Allow-Methods', 'POST')
  myHeaders.set('Access-Control-Max-Age', '86400')
  myHeaders.set('content-type', 'text/plain')

  const key = update.date ? update.date : Date.now()
  const value = JSON.stringify(update)

  await UPDATES.put(key, value)

  return new Response('Update Uploaded!', {
    headers: myHeaders,
  })
}

/**
 * The /login route.
 * For GET requests, the url parameters are:
 * - username: the username of the user to login as (required)
 * - password: the password of the user to login as (required)
 *
 * Returns a token and set for Authorization header if the login is successful.
 */
router.get('/login', async request => {
  const username = new URL(request.url).searchParams.get('username')
  const password = new URL(request.url).searchParams.get('password')
  return login(username, password)
})

async function login(username, password) {
  const myHeaders = new Headers()
  myHeaders.set('Access-Control-Allow-Origin', '*')
  myHeaders.set('Access-Control-Allow-Methods', 'GET')
  myHeaders.set('Access-Control-Max-Age', '86400')
  myHeaders.set('content-type', 'application/json')

  if (!username || !password) {
    return new Response('Username and password are required', {
      status: 400,
      headers: myHeaders,
    })
  }

  // Try to find the user in KV
  const user = await USERS.get(username, { type: 'json' })

  if (!user) {
    return new Response(re(true, 'User not found.'), {
      status: 404,
      headers: myHeaders,
    })
  }

  // Check the password
  // Hashing the incoming password with the salt using WebCrypto
  const hash = await hashPassword(password, user.salt)
  // If the hash doesn't match, the password is wrong
  if (hash !== user.password) {
    return new Response(re(true, 'Wrong password'), {
      status: 401,
      headers: myHeaders,
    })
  }

  // Generate a 30-day token and store it in KV.
  const token = await generateToken()
  const expireTtl = 30 * 24 * 60 * 60
  console.log(`token: ${token} expireTtl: ${expireTtl}`)
  await TOKENS.put(token, username, { expirationTtl: expireTtl })

  const result = {
    token: token,
    expireTtl: expireTtl,
  }

  return new Response(re(false, 'Logged in.', result), {
    status: 200,
    headers: myHeaders,
  })
}

/**
 * The /logout route.
 * Reads the Authorization header and deletes the token from KV.
 */
router.get('/logout', async request => {
  const myHeaders = new Headers()
  myHeaders.set('Access-Control-Allow-Origin', '*')
  myHeaders.set('Access-Control-Allow-Methods', 'GET')
  myHeaders.set('Access-Control-Max-Age', '86400')
  myHeaders.set('content-type', 'application/json')

  if (!request.headers.get('Authorization')) {
    return new Response(re(true, 'No authorization header.'), {
      status: 400,
      headers: myHeaders,
    })
  }

  const token = request.headers.get('Authorization').replace('Token ', '')
  await TOKENS.delete(token)

  return new Response(re(false, 'Logged out.'), {
    status: 200,
    headers: myHeaders,
  })
})

/*
Lead all unknown routes to 404.
*/
router.all('*', () => new Response('404, not found!', { status: 404 }))

/*
This snippet ties our worker to the router we deifned above, all incoming requests
are passed to the router where your routes are called and the response is sent.
*/
addEventListener('fetch', e => {
  e.respondWith(router.handle(e.request))
})

// Use this function to generate response bodies to standardize the response format.
function re(error, message, data) {
  if (!error || !message) {
    throw new Error('re() requires error and message')
  }

  data = data || {}

  return JSON.stringify({
    error: error,
    message: message,
    data: data,
  })
}

async function hashPassword(password, salt) {
  const msgUint8 = new TextEncoder().encode(`${password}${salt}`) // encode as (utf-8) Uint8Array
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8) // hash the password
  const hashArray = Array.from(new Uint8Array(hashBuffer)) // convert buffer to byte array
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('') // convert bytes to hex string
  return hashHex
}

async function generateToken() {
  const token = await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt'],
  )
  const exportedToken = await crypto.subtle.exportKey('raw', token)
  return Buffer.from(exportedToken).toString('hex')
}
