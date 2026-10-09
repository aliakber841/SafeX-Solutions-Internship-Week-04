// Small helper for sending data to the server safely.
// Before every POST it asks the server for a CSRF token and sends it in a header.

async function getCsrfToken() {
  const res = await fetch("/api/csrf-token");
  const data = await res.json();
  return data.csrfToken;
}

export async function postJson(url, body) {
  const token = await getCsrfToken();

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-CSRF-Token": token,
    },
    body: JSON.stringify(body),
  });

  let data = {};

  try {
    data = await res.json();
  } catch (err) {
    data = {};
  }

  return { ok: res.ok, status: res.status, data: data };
}

// Turns a server error into one readable line.
export function readError(data) {
  let text = data.error || "Something went wrong";

  if (data.details && data.details.length > 0) {
    const messages = [];

    for (const item of data.details) {
      messages.push(item.message);
    }

    text = text + ": " + messages.join(", ");
  }

  return text;
}
