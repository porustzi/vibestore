const ADMIN_LOGIN = "admin"
const ADMIN_PASSWORD = "8934"

export async function onRequestPost(context) {
  const { env } = context
  const password = env.ADMIN_PASSWORD || ADMIN_PASSWORD

  let body
  try {
    const text = await context.request.text()
    body = Object.fromEntries(new URLSearchParams(text))
  } catch {
    return new Response(JSON.stringify({ error: "Bad request" }), { status: 400 })
  }

  if (body.password !== password) {
    return new Response(JSON.stringify({ error: "Invalid password" }), { status: 401 })
  }

  const token = env.GITHUB_PAT
  if (!token) {
    return new Response(JSON.stringify({ error: "GitHub token not configured" }), { status: 500 })
  }

  return new Response(JSON.stringify({ token }), {
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*"
    }
  })
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    }
  })
}
