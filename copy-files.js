import fs from 'fs-extra';

fs.copy('public', 'dist')
  .then(() => console.log('Public files copied to dist'))
  .catch(err => console.error('Error:', err));

// cpy cirkar ekki lol