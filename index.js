addEventListener('fetch', (event) => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  if (request.method === "POST") {
    return addPost(await request.text())
  } else if (request.method === "GET") {
    const id = new URL(request.url).searchParams.get('id')

    if (id === null) {
      return listPosts()
    } else {
      return readPost(id)
    }
  }
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

async function readPost(key) {
  const myHeaders = new Headers();
  myHeaders.set("Access-Control-Allow-Origin", '*');
  myHeaders.set("Access-Control-Allow-Methods", "GET");
  myHeaders.set("Access-Control-Max-Age", "86400",);
  myHeaders.set('content-type', 'text/plain');

  const result = await BLOG.get(key)

  return new Response(result, { status: 200, headers: myHeaders })
}

async function listPosts() {
  const myHeaders = new Headers();
  myHeaders.set("Access-Control-Allow-Origin", '*');
  myHeaders.set("Access-Control-Allow-Methods", "GET");
  myHeaders.set("Access-Control-Max-Age", "86400",);
  myHeaders.set('content-type', 'application/json');
  const result = await BLOG.list()

  return new Response(JSON.stringify(result.keys), { status: 200, headers: myHeaders })
}