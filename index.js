import { Router } from 'itty-router'

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
  const id = new URL(request.url).searchParams.get('id')
  if (id) {
    return readPost(id)
  } else {
    return listPosts()
  }
})

router.post('/', async request => {
  // TODO: Validate the request
  return addPost(await request.text())
})

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

router.post('/updates', async request => {
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
