const { exec } = require('child_process');
const { version } = require('./package.json');

const vsixFileName = `code-translate-${version}.vsix`;
const installCommand = `code --install-extension ${vsixFileName}`;

exec(installCommand, (error, stdout, stderr) => {
  if (error) {
    console.error(`Error installing extension: ${error.message}`);
    return;
  }

  if (stderr) {
    console.error(`stderr: ${stderr}`);
    return;
  }

  console.log(`stdout: ${stdout}`);
});
