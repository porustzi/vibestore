const ADMIN_PASSWORD = "vibe123store"

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

  return new Response(JSON.stringify({ ok: true }), {
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
