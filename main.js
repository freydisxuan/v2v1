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
 * 
 * @param {*} unsafeText Tekur inn texta sem á að escape-a
 * @returns öruggum javascript texta
 */

function escapeHtml(unsafeText) {
  if (typeof unsafeText !== "string") {
    return "";
  }

  return unsafeText
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
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
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verkefni 1</title>
  <link rel="stylesheet" href="../styles.css">
  </head>
  <body>
    <h2>Þetta er vissulega spurningaleikur :D</h2>
    <ul>
      ${html}
    </ul>
  </body>
</html>
`;

  fs.writeFile(htmlFilePath, htmlContent, 'utf8');
}

/**
 * Skrifa HTML fyrir efni síður HTML, CSS, JS
 * @param {any} data Gögn til að skrifa
 * @returns {Promise<void>}
 */
async function writeHtml2(data) {
  const htmlFilePath = `dist/${data.file.replace('.json', '.html')}`;

  if (!data.content || !Array.isArray(data.content.questions)) {
    console.error(`No valid questions found for ${data.file}`);
    return;
  }

  const questionsHtml = data.content.questions.map((q, index) => {
    if (!q.answers || !Array.isArray(q.answers)) {
      console.warn(`Skipping question ${index} in ${data.file} due to invalid answers.`);
      return '';
    }

    const validAnswers = q.answers.filter(a => a.hasOwnProperty("answer") && a.hasOwnProperty("correct"));
    const answersHtml = validAnswers.map((answer, ansIndex) => `
      <label>
      <input type="radio" name="q${index}" value="${escapeHtml(answer.answer)}" ${answer.correct ? 'data-correct="true"' : ''}>
        ${escapeHtml(answer.answer)}
      </label><br>
    `).join('');

    return `
      <div class="question">
        <p><strong>${escapeHtml(q.question)}</strong></p>
        ${answersHtml}
      </div>
    `;
  }).join('');

  const htmlContent = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${data.content.title}</title>
    <link rel="stylesheet" href="../styles.css">
  </head>
  <body>
  <h2>${data.content.title}</h2>
  <form id="quiz-form">
    ${questionsHtml}
    <button type="button" onclick="checkAnswers()">Senda svör</button>
  </form>
  <script>
  function checkAnswers() {
    const questions = document.querySelectorAll('.question');

    questions.forEach((question, index) => {
      const selectedAnswer = question.querySelector('input[name="q' + index + '"]:checked');
      const allAnswers = question.querySelectorAll('label');

      allAnswers.forEach(label => {
        label.classList.remove('correct', 'incorrect');
      });

      if (selectedAnswer) {
        const correctAnswer = question.querySelector('input[name="q' + index + '"][data-correct="true"]');

        if (selectedAnswer === correctAnswer) {
          selectedAnswer.parentElement.classList.add('correct');
        } else {
          selectedAnswer.parentElement.classList.add('incorrect');
          correctAnswer.parentElement.classList.add('correct');
        }
      }
    });
  }
</script>
  </body>
  </html>
    `;

  await fs.writeFile(htmlFilePath, htmlContent, 'utf8');
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
