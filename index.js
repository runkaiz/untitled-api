import { Router } from 'itty-router'

// Create a new router
const router = Router()

/*
The index route. 
For compatibility with the old API, the following three routes deal with retrieving or adding articles.
TODO: migrate this function into POST/GET /article and GET /articles
Parameters:
  - id: the id of the article to retrieve (optional)
        returns a list of articles if no id is specified
*/
router.get("/", () => {
  return listPosts()
})

router.get("/:id", ({ params }) => {
  return readPost(params.id)
})

router.post("/", async request => {
  return addPost(await request.text())
})

async function listPosts() {
  const myHeaders = new Headers();
  myHeaders.set("Access-Control-Allow-Origin", '*');
  myHeaders.set("Access-Control-Allow-Methods", "GET");
  myHeaders.set("Access-Control-Max-Age", "86400",);
  myHeaders.set('content-type', 'application/json');
  const result = await BLOG.list()

  return new Response(JSON.stringify(result.keys), { status: 200, headers: myHeaders })
}

async function readPost(key) {
  const myHeaders = new Headers();
  myHeaders.set("Access-Control-Allow-Origin", '*');
  myHeaders.set("Access-Control-Allow-Methods", "GET");
  myHeaders.set("Access-Control-Max-Age", "86400",);
  myHeaders.set('content-type', 'text/plain');

  const result = await BLOG.get(key)

  return new Response(result, { status: 200, headers: myHeaders })
}

async function addPost(markdown) {
  const myHeaders = new Headers();
  myHeaders.set("Access-Control-Allow-Origin", '*');
  myHeaders.set("Access-Control-Allow-Methods", "POST");
  myHeaders.set("Access-Control-Max-Age", "86400",);
  myHeaders.set('content-type', 'text/plain');

  const result = await BLOG.put(Date.now(), markdown)

  return new Response('Post Uploaded!', {
    headers: myHeaders,
  })
}

/*
This is the last route we define, it will match anything that hasn't hit a route we've defined
above, therefore it's useful as a 404 (and avoids us hitting worker exceptions, so make sure to include it!).

Visit any page that doesn't exist (e.g. /foobar) to see it in action.
*/
router.all("*", () => new Response("404, not found!", { status: 404 }))

/*
This snippet ties our worker to the router we deifned above, all incoming requests
are passed to the router where your routes are called and the response is sent.
*/
addEventListener('fetch', (e) => {
  e.respondWith(router.handle(e.request))
})