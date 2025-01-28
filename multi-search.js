const axios = require("axios");
const cheerio = require("cheerio");

// Función para buscar en DuckDuckGo
async function buscarEnDuckDuckGo(query, numResultados) {
  const resultados = [];
  const url = "https://html.duckduckgo.com/html/";
  const headers = { "User-Agent": "Mozilla/5.0" };

  try {
    const response = await axios.post(url, `q=${encodeURIComponent(query)}`, {
      headers,
      timeout: 10000,
    });
    const $ = cheerio.load(response.data);
    $("a.result__a").each((i, el) => {
      if (resultados.length < numResultados) {
        const href = $(el).attr("href");
        if (href.startsWith("http")) resultados.push(href);
      }
    });
    return resultados;
  } catch (error) {
    console.error("[X] Error en DuckDuckGo:", error.message);
    return [];
  }
}

// Función para buscar en Bing
async function buscarEnBing(query, numResultados) {
  const resultados = [];
  const url = "https://www.bing.com/search";
  const headers = { "User-Agent": "Mozilla/5.0" };

  try {
    const response = await axios.get(url, {
      headers,
      params: { q: query, count: numResultados },
      timeout: 10000,
    });
    const $ = cheerio.load(response.data);
    $("a").each((i, el) => {
      const href = $(el).attr("href");
      if (href && href.startsWith("http") && !href.includes("bing.com")) {
        if (resultados.length < numResultados) resultados.push(href);
      }
    });
    return resultados;
  } catch (error) {
    console.error("[X] Error en Bing:", error.message);
    return [];
  }
}

// Función para buscar en Yahoo
async function buscarEnYahoo(query, numResultados) {
  const resultados = [];
  const url = "https://search.yahoo.com/search";
  const headers = { "User-Agent": "Mozilla/5.0" };

  try {
    const response = await axios.get(url, {
      headers,
      params: { p: query },
      timeout: 10000,
    });
    const $ = cheerio.load(response.data);
    $("a").each((i, el) => {
      const href = $(el).attr("href");
      if (href && href.startsWith("http") && !href.includes("yahoo.com")) {
        if (resultados.length < numResultados) resultados.push(href);
      }
    });
    return resultados;
  } catch (error) {
    console.error("[X] Error en Yahoo:", error.message);
    return [];
  }
}

// Combinar resultados y eliminar duplicados
function combinarResultados(resultadosTotales, numResultados) {
  return [...new Set(resultadosTotales)].slice(0, numResultados);
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

  const motores = [buscarEnDuckDuckGo, buscarEnBing, buscarEnYahoo];
  let resultadosTotales = [];

  for (const motor of motores) {
    const resultados = await motor(query, numResultados);
    resultadosTotales = resultadosTotales.concat(resultados);
  }

  const resultadosFinales = combinarResultados(resultadosTotales, numResultados);
  if (resultadosFinales.length > 0) {
    console.log("\n=== Resultados Combinados ===");
    resultadosFinales.forEach((url, i) => console.log(`${i + 1}. ${url}`));
  } else {
    console.log("[!] No se encontraron resultados.");
  }
}

main();
