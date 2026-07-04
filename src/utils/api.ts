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
      if ((url.startsWith("/api/cminewar") || url.includes("/api/cminewar")) && !url.includes("/api/cminewar/proxy")) {
        // Only rewrite if it's not already absolute
        if (!url.startsWith("http://") && !url.startsWith("https://")) {
          const relativePath = url.startsWith("/") ? url : "/" + url;
          const formattedUrl = `/api/cminewar/proxy?ip=${encodeURIComponent(savedIp)}&path=${encodeURIComponent(relativePath)}`;
          hasRewritten = true;
          if (typeof input === "string") {
            input = formattedUrl;
          } else if (input instanceof URL) {
            input = new URL(window.location.origin + formattedUrl);
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
    const response = await fetch(input, init);
    // If we proxied the request and the remote host returned an error status (e.g. 502 Bad Gateway)
    // then fall back gracefully to the local simulated API endpoints!
    if (!response.ok && hasRewritten) {
      console.warn("Fallo de conexión al host remoto (HTTP error). Reintentando con el servidor local...");
      return await fetch(originalInput, init);
    }
    return response;
  } catch (err) {
    if (hasRewritten) {
      console.warn("Fallo de conexión al host remoto. Reintentando con el servidor local...", err);
      return await fetch(originalInput, init);
    }
    throw err;
  }
}

// Proyecto propiedad de Yonah Llanes

