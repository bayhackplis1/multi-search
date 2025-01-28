const axios = require("axios");
const cheerio = require("cheerio");
const readline = require("readline");

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
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  console.log("=== Buscador Mejorado ===");
  rl.question("¿Qué quieres buscar? ", async (query) => {
    rl.question("¿Cuántos resultados deseas? ", async (numStr) => {
      const numResultados = parseInt(numStr, 10);
      if (isNaN(numResultados) || numResultados <= 0) {
        console.error("[!] Por favor, introduce un número válido.");
        rl.close();
        return;
      }

      console.log("\n[*] Iniciando búsquedas...");
      const motores = [
        buscarEnDuckDuckGo,
        buscarEnBing,
        buscarEnYahoo,
      ];
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

      rl.close();
    });
  });
}

main();
