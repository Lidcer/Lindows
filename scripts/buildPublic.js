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
    <link rel="stylesheet" href="/assets/basic.css">
    <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Roboto:300,400,500">
    <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.5.0/css/bootstrap.min.css" integrity="sha384-9aIt2nRpC12Uk9gS9baDl411NQApFmC26EwAOH8WgZl5MYYxFfc+NcPb1dKGj7Sk" crossorigin="anonymous">
    <script src="https://code.jquery.com/jquery-3.5.1.slim.min.js" integrity="sha384-DfXdz2htPH0lsSSs5nCTpuj/zy4C+OGpamoFVy38MVBnE+IbbVYUew+OrCXaRkfj" crossorigin="anonymous"></script>
    <script src="https://cdn.jsdelivr.net/npm/popper.js@1.16.0/dist/umd/popper.min.js" integrity="sha384-Q6E9RHvbIyZFJoft+2mJbHaEWldlvI9IOYy5n3zV9zzTtmI3UksdQRVvoxMfooAo" crossorigin="anonymous"></script>
    <script src="https://stackpath.bootstrapcdn.com/bootstrap/4.5.0/js/bootstrap.min.js" integrity="sha384-OgVRvuATP1z7JjHLkuOU7Xw704+h835Lr+6QL9UvYjZE3Ipu6Tp75j7Bh/kR0JKI" crossorigin="anonymous"></script>

    <meta name="viewport" content="width=device-width, initial-scale=1 user-scalable=no">
    <link rel="stylesheet" href="/assets/basic.css">
    <link rel="icon" href="/assets/favicon.ico" type="image/x-icon"/>

<body style="overflow: hidden;">
    <div id="app">
        <div id="header">
            <div id="boot-cursor"></div>
        </div>
    </div>

    <script crossorigin type="text/javascript" src="https://unpkg.com/react@16/umd/react.production.min.js"></script>
    <script crossorigin type="text/javascript" src="https://unpkg.com/react-dom@16/umd/react-dom.production.min.js"></script>
    <script crossorigin type="text/javascript" src="https://unpkg.com/@ungap/custom-elements-builtin"></script>

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
mainContent = mainContent.replace('location.href="terms-of-service"', 'location.href="terms-of-service.html"');
fs.writeFileSync(clientPublic, mainContent, 'UTF-8');

const vendorContent = fs.readFileSync(vendorP, 'UTF-8');
fs.writeFileSync(vendorPublic, vendorContent, 'UTF-8');

const index = path.join(public, 'index.html');
const htmlContent = getHtmlTemplate(manifest['main.js'].split('/')[2], manifest['vendors.js'].split('/')[2]);
fs.writeFileSync(index, htmlContent, 'UTF-8');

const termsOfServiceRaw = path.join(process.cwd(), 'views', 'terms-of-service.ejs');
const termsOfService = path.join(public, 'terms-of-service.html');
const tos = fs.readFileSync(termsOfServiceRaw, 'UTF-8');
const tosContent = ejs.render(tos, {});
fs.writeFileSync(termsOfService, tosContent, 'UTF-8');

const sourceAssets = path.join(process.cwd(), 'assets');
const targetAssets = path.join(process.cwd(), 'public', 'assets');
npc(sourceAssets, targetAssets, error => {
  if (error) {
    console.error(error);
  }
  console.info('done');
});
