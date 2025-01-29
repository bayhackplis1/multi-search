const axios = require("axios");
const cheerio = require("cheerio");

// Configuración
const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36";
const TIMEOUT = 10000; // 10 segundos
const MAX_RETRIES = 2; // Número máximo de reintentos

// Función para realizar solicitudes HTTP con reintentos
async function fetchWithRetries(url, options, retries = MAX_RETRIES) {
  try {
    const response = await axios(url, { ...options, timeout: TIMEOUT });
    return response.data;
  } catch (error) {
    if (retries > 0) {
      console.warn(`[!] Reintentando (${MAX_RETRIES - retries + 1}/${MAX_RETRIES})...`);
      return fetchWithRetries(url, options, retries - 1);
    }
    throw error;
  }
}

// Función para buscar en DuckDuckGo
async function buscarEnDuckDuckGo(query, numResultados) {
  const resultados = [];
  const url = "https://html.duckduckgo.com/html/";
  const headers = { "User-Agent": USER_AGENT };

  try {
    const html = await fetchWithRetries(url, {
      method: "POST",
      headers,
      data: `q=${encodeURIComponent(query)}`,
    });
    const $ = cheerio.load(html);
    $("a.result__a").each((i, el) => {
      if (resultados.length < numResultados) {
        const href = $(el).attr("href");
        if (href && href.startsWith("http")) resultados.push({ url: href, source: "DuckDuckGo" });
      }
    });
  } catch (error) {
    console.error("[X] Error en DuckDuckGo:", error.message);
  }
  return resultados;
}

// Función para buscar en Startpage (similar a DuckDuckGo)
async function buscarEnStartpage(query, numResultados) {
  const resultados = [];
  const url = "https://www.startpage.com/do/search";
  const headers = { "User-Agent": USER_AGENT };

  try {
    const html = await fetchWithRetries(url, {
      method: "GET",
      headers,
      params: { q: query, count: numResultados },
    });
    const $ = cheerio.load(html);
    $("a.w-gl__result-url").each((i, el) => {
      if (resultados.length < numResultados) {
        const href = $(el).attr("href");
        if (href && href.startsWith("http")) resultados.push({ url: href, source: "Startpage" });
      }
    });
  } catch (error) {
    console.error("[X] Error en Startpage:", error.message);
  }
  return resultados;
}

// Función para buscar en Yahoo
async function buscarEnYahoo(query, numResultados) {
  const resultados = [];
  const url = "https://search.yahoo.com/search";
  const headers = { "User-Agent": USER_AGENT };

  try {
    const html = await fetchWithRetries(url, {
      method: "GET",
      headers,
      params: { p: query },
    });
    const $ = cheerio.load(html);
    $("a").each((i, el) => {
      const href = $(el).attr("href");
      if (href && href.startsWith("http") && !href.includes("yahoo.com")) {
        if (resultados.length < numResultados) resultados.push({ url: href, source: "Yahoo" });
      }
    });
  } catch (error) {
    console.error("[X] Error en Yahoo:", error.message);
  }
  return resultados;
}

// Combinar resultados y eliminar duplicados
function combinarResultados(resultadosTotales, numResultados) {
  const resultadosUnicos = [];
  const urlsVistas = new Set();

  for (const resultado of resultadosTotales) {
    if (!urlsVistas.has(resultado.url)) {
      urlsVistas.add(resultado.url);
      resultadosUnicos.push(resultado);
    }
  }

  // Ordenar por relevancia (simulado)
  resultadosUnicos.sort((a, b) => a.source.localeCompare(b.source)); // Ejemplo simple de ordenamiento
  return resultadosUnicos.slice(0, numResultados);
}

// Función principal
async function main() {
  const args = process.argv.slice(2); // Obtener argumentos de línea de comandos

  if (args.length < 2) {
    console.error("Uso: node multi-search.js <consulta> <cantidad de resultados>");
    process.exit(1);
  }

  const query = args[0]; // Primer argumento: la consulta
  const numResultados = parseInt(args[1], 10); // Segundo argumento: cantidad de resultados

  if (isNaN(numResultados) || numResultados <= 0) {
    console.error("[!] La cantidad de resultados debe ser un número mayor a 0.");
    process.exit(1);
  }

  console.log(`\n[*] Buscando: "${query}"`);
  console.log(`[*] Cantidad de resultados deseados: ${numResultados}\n`);

  const motores = [buscarEnDuckDuckGo, buscarEnStartpage, buscarEnYahoo];

  try {
    // Realizar búsquedas en paralelo
    const resultadosPorMotor = await Promise.all(motores.map((motor) => motor(query, numResultados)));
    const resultadosTotales = resultadosPorMotor.flat();

    const resultadosFinales = combinarResultados(resultadosTotales, numResultados);
    if (resultadosFinales.length > 0) {
      console.log("\n=== Resultados Combinados ===");
      resultadosFinales.forEach((resultado, i) => console.log(`${i + 1}. [${resultado.source}] ${resultado.url}`));
    } else {
      console.log("[!] No se encontraron resultados.");
    }
  } catch (error) {
    console.error("[X] Error en la búsqueda:", error.message);
  }
}

main();
