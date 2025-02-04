import fs from 'node:fs/promises';
import path from 'node:path';

const INDEX_PATH = './data/index.json';

/**
 * Les skrá og skilar gögnum eða null.
 * @param {string} filePath Skráin sem á að lesa
 * @returns {Promise<unknown | null>} Les skrá úr `filePath` og skilar innihaldi. Skilar `null` ef villa kom upp.
 */
async function readJson(filePath) {
  console.log('starting to read', filePath);
  let data;
  try {
    data = await fs.readFile(path.resolve(filePath), 'utf-8');
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error.message);
    return null;
  }

  try {
    const parsed = JSON.parse(data);
    return parsed;
  } catch (error) {
    console.error('error parsing data as json');
    return null;
  }
}

/**
 * Skrifa HTML fyrir yfirlit í index.html
 * @param {any} data Gögn til að skrifa
 * @returns {Promise<void>}
 */
async function writeHtml(data) {
  const htmlFilePath = 'dist/index.html';

  const html = data.map((item) => `<li><a href="./${item.file.replace('.json','.html')}">${item.title}</a></li>`).join('\n');
  
  const htmlContent = `
<!doctype html>
<html>
  <head>
    <title>Verkefni 1</title>
  </head>
  <body>
    <ul>
      ${html}
    </ul>
  </body>
</html>
`;

  fs.writeFile(htmlFilePath, htmlContent, 'utf8');
}

/**
 * Skrifa HTML fyrir yfirlit í index.html
 * @param {any} data Gögn til að skrifa
 * @returns {Promise<void>}
 */
async function writeHtml2(data) {
  const htmlFilePath = `dist/${data.file.replace('.json', '.html')}`;
  
  const htmlContent = `
<!doctype html>
<html>
  <head>
    <title>Verkefni 1</title>
  </head>
  <body>
    <ul>
    
    </ul>
  </body>
</html>
`;

  fs.writeFile(htmlFilePath, htmlContent, 'utf8');
}

async function fileExists(path) {
  try {
    await fs.readFile(path);
    return true;
  } catch(e) {
    return false;
  }
}

/**
 *
 * @param {unknown} data
 * @returns {any}
 */
async function parseIndexJson(data) {
  const validated = [];
  for (let i = 0; i < data.length; i++) {
    const exists = await fileExists(`./data/${data[i].file}`);
    if (
    data[i].hasOwnProperty("file") && 
    data[i].hasOwnProperty("title") &&
    exists
    ){
      validated.push(data[i]);
    }
  };
  return validated;
}

/**
 * Keyrir forritið okkar:
 * 1. Sækir gögn
 * 2. Staðfestir gögn (validation)
 * 3. Skrifar út HTML
 */
async function main() {
  const indexJson = await readJson(INDEX_PATH);
  const indexData = await parseIndexJson(indexJson);
  const allData = (await Promise.all(
    indexData.map(async (item) => {
      const filePath = `./data/${item.file}`;
      const fileData = await readJson(filePath);
      return fileData ? { ...item, content: fileData.title && fileData.questions ? fileData : null} : null;
    }),
  )).filter((item) => item != null && item.content != null);
  writeHtml(allData);

  allData.map(async (data) => {
    writeHtml2(data);
  })
}

main();

/*
// Eftirfarandi kóði kom frá ChatGTP eftir að hafa gefið
// MJÖG einfalt prompt ásamt allri verkefnalýsingu
async function readAllData() {
  const indexPath = './data/index.json';

  try {
    // Read index.json
    const indexData = await readJSON(indexPath);

    if (!Array.isArray(indexData)) {
      console.error('index.json is not an array. Check the file format.');
      return [];
    }

    // Read other JSON files listed in index.json
    const allData = await Promise.all(
      indexData.map(async (item) => {
        const filePath = `./data/${item.file}`;
        const fileData = await readJSON(filePath);
        return fileData ? { ...item, content: fileData } : null;
      }),
    );

    return allData.filter(Boolean); // Remove null entries if any file failed to load
  } catch (error) {
    console.error('Error reading data files:', error.message);
    return [];
  }
}


readAllData().then((data) => console.log(data));
*/
