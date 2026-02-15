const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE || "http://127.0.0.1:8000";

function buildUrl(url: string) {
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  if (url.startsWith("/")) {
    return API_BASE + url;
  }
  return API_BASE + "/" + url;
}

export async function fetcher(url: string) {
  console.log("FETCH URL =>", url);

  if (!url || url.includes("undefined")) {
    // 关键：直接把调用栈打出来，告诉你是哪个文件哪一行传进来的
    console.error("BAD URL STACK =>", new Error().stack);
    throw new Error(`Bad url: ${url}`);
  }

  // 统一成相对路径（保证走 Next + rewrites）
  const finalUrl = url.startsWith("/") ? url : `/${url}`;

  const res = await fetch(finalUrl);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function postJson(url: string, data: any) {
  const finalUrl = url.startsWith("/") ? url : `/${url}`;

  const res = await fetch(finalUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

