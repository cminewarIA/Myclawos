export async function cminewarFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  let url = "";
  if (typeof input === "string") {
    url = input;
  } else if (input instanceof URL) {
    url = input.toString();
  } else if (input instanceof Request) {
    url = input.url;
  }

  const originalInput = input;
  let hasRewritten = false;

  if (typeof window !== "undefined") {
    const savedIp = localStorage.getItem("cminewar_connected_server_ip");
    if (savedIp) {
      // Rewrite relative /api/cminewar paths or paths containing /api/cminewar
      if (url.startsWith("/api/cminewar") || url.includes("/api/cminewar")) {
        // Only rewrite if it's not already absolute
        if (!url.startsWith("http://") && !url.startsWith("https://")) {
          const formattedUrl = `http://${savedIp}:3000${url.startsWith("/") ? url : "/" + url}`;
          hasRewritten = true;
          if (typeof input === "string") {
            input = formattedUrl;
          } else if (input instanceof URL) {
            input = new URL(formattedUrl);
          } else if (input instanceof Request) {
            const requestInit: RequestInit = {
              method: input.method,
              headers: input.headers,
              body: input.body,
              mode: input.mode,
              credentials: input.credentials,
              cache: input.cache,
              redirect: input.redirect,
              referrer: input.referrer,
              integrity: input.integrity,
              keepalive: input.keepalive,
              signal: input.signal
            };
            input = new Request(formattedUrl, requestInit);
          }
        }
      }
    }
  }

  try {
    return await fetch(input, init);
  } catch (err) {
    if (hasRewritten) {
      console.warn("Fallo de conexión al host remoto. Reintentando con el servidor local...", err);
      return fetch(originalInput, init);
    }
    throw err;
  }
}

// Proyecto propiedad de Yonah Llanes

