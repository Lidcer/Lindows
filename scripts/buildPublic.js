const path = require('path');
const fs = require('fs');
const manifest = require('../dist/statics/manifest.json');
const ejs = require('ejs');
const npc = require('ncp');

const public = path.join(process.cwd(), 'public');
try {
  fs.accessSync(public);
  fs.rmdirSync(public, { recursive: true });
} catch (error) { /* ignored */}
fs.mkdirSync(public);

function getHtmlTemplate(main, vendors) {
  return `<!doctype html>
<html lang="en">

<head>
    <meta charset="utf-8">
    <title> Lindows </title>
    <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Roboto:300,400,500">
    <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.5.0/css/bootstrap.min.css" integrity="sha384-9aIt2nRpC12Uk9gS9baDl411NQApFmC26EwAOH8WgZl5MYYxFfc+NcPb1dKGj7Sk" crossorigin="anonymous">

    <meta name="viewport" content="width=device-width, initial-scale=1 user-scalable=no">
    <link rel="stylesheet" href="/assets/basic.css">
    <link rel="icon" href="/assets/favicon.ico" type="image/x-icon"/>

<body style="overflow: hidden;">
    <div id="app">
        <div id="header">
            <div id="boot-cursor"></div>
        </div>
    </div>

    <script type="text/javascript" src="./${vendors}"></script>
    <script type="text/javascript" src="./${main}"></script>
</body>
</html>`;
}

const main = manifest['main.js'];
const mainFileName = main.split('/')[2];
const vendorFileName = manifest['vendors.js'].split('/')[2];
const revision = main.split('-')[1];

const client = path.join(process.cwd(), 'dist', 'statics', mainFileName);
const clientPublic = path.join(public, mainFileName);

const vendorP = path.join(process.cwd(), 'dist', 'statics', vendorFileName);
const vendorPublic = path.join(public, vendorFileName);

let mainContent = fs.readFileSync(client, 'UTF-8');
fs.writeFileSync(clientPublic, mainContent, 'UTF-8');

const vendorContent = fs.readFileSync(vendorP, 'UTF-8');
fs.writeFileSync(vendorPublic, vendorContent, 'UTF-8');

const index = path.join(public, 'index.html');
const htmlContent = getHtmlTemplate(manifest['main.js'].split('/')[2], manifest['vendors.js'].split('/')[2]);
fs.writeFileSync(index, htmlContent, 'UTF-8');

const sourceAssets = path.join(process.cwd(), 'assets');
const targetAssets = path.join(process.cwd(), 'public', 'assets');
npc(sourceAssets, targetAssets, error => {
  if (error) {
    console.error(error);
  }
  console.info('done');
});
