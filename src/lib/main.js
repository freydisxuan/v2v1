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
    //þetta er expected throw ætla ekki að handlea errorin :P
    /*eslint-disable-next-line no-unused-vars*/
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

function stringToHtml(str) {
  return escapeHtml(str)
      .split('\n\n')
      .map((line) => `<p>${line.replace(/\n/g, '<br>')}</p>`)
      .join('')
      .replace(/\n/g, '<br>')
      .replace(/ {2}/g, '&nbsp;&nbsp;');
}

/**
 * Skrifa HTML fyrir yfirlit í index.html
 * @param {any} data Gögn til að skrifa
 * @returns {Promise<void>}
 */
async function writeHtml(data) {
  if (!(await folderExists('dist'))) {
    await fs.mkdir('dist');
  }
  const htmlFilePath = 'dist/index.html';

  const html = data.map((item) => `<li><a href="./${item.file.replace('.json','.html')}">${item.title}</a></li>`).join('\n');
  
  const htmlContent = `
<!doctype html>
<html>
  <head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verkefni 1</title>
  <link rel="stylesheet" href="../public/styles.css">
  </head>
  <body>
    <h2>Þetta er vissulega spurningaleikur :D</h2>
    <p>Veldu flokk tbg</p>
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

    const validAnswers = q.answers.filter(a => a.hasOwnProperty.call(a,"answer") && a.hasOwnProperty.call(a,"correct"));
    const answersHtml = validAnswers.map((answer) => `
      <label>
      <input type="radio" name="q${index}" value="${escapeHtml(answer.answer)}" ${answer.correct ? 'data-correct="true"' : ''}>
        ${escapeHtml(answer.answer)}
      </label><br>
    `).join('');

    return `
      <div class="question">
        <p><strong>${stringToHtml(q.question)}</strong></p>
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
    <link rel="stylesheet" href="../public/styles.css">
  </head>
  <body>
  <section id="header">
  <a href="index.html" id="back-btn"><</a>
  <h2>${data.content.title}</h2>
  </section>
  <form id="quiz-form">
    ${questionsHtml}
    <button type="button" id="clear-btn" onclick="clearAnswers()">Hreinsa svör</button>
    <button type="button" id="submit-btn" onclick="checkAnswers()" disabled>Senda svör</button>
  </form>
  <script>
    function checkAnswers() {
      const questions = document.querySelectorAll('.question');
      let allAnswered = true;

      questions.forEach((question, index) => {
        const selectedAnswer = question.querySelector('input[name="q' + index + '"]:checked');
        const allAnswers = question.querySelectorAll('label');

        allAnswers.forEach(label => {
          label.classList.remove('correct', 'incorrect');
        });

        if (!selectedAnswer) {
          allAnswered = false;
        } else {
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

    function enableSubmitButton() {
      const questions = document.querySelectorAll('.question');
      const submitBtn = document.getElementById('submit-btn');
      let allAnswered = true;

      questions.forEach((question, index) => {
        const selectedAnswer = question.querySelector('input[name="q' + index + '"]:checked');
        if (!selectedAnswer) {
          allAnswered = false;
        }
      });

      submitBtn.disabled = !allAnswered;
    }

    function clearAnswers() {
      document.querySelectorAll('input[type="radio"]').forEach(input => {
        input.checked = false;
      });

      document.querySelectorAll('.correct, .incorrect').forEach(label => {
        label.classList.remove('correct', 'incorrect');
      });

      document.getElementById('submit-btn').disabled = true;
    }

    document.querySelectorAll('input[type="radio"]').forEach(input => {
      input.addEventListener('change', enableSubmitButton);
    });
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
    //þetta er expected throw ætla ekki að handlea errorin :P
    /*eslint-disable-next-line no-unused-vars*/
  } catch(e) {
    return false;
  }
}

export async function folderExists(path) {
  try {
    await fs.readdir(path);
  // Þetta er expected throw, ætla ekki að handlea errorinn 😛
  /* eslint-disable-next-line no-unused-vars */
  } catch (e) {
    return false;
  }
  return true;
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
    data[i].hasOwnProperty.call(data[i], "file") && 
    data[i].hasOwnProperty.call(data[i], "title") &&
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
  await writeHtml(allData);

  allData.map(async (data) => {
   writeHtml2(data);
  })
}

main();
