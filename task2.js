const fs = require('fs');
const path = require('path');
const { SHA3 } = require('crypto-js'); 

const email = 'alibekolimov.info@gmail.com'; 
const directoryPath = path.join(__dirname, 'files'); 

async function getFileHashes() {
  const files = fs.readdirSync(directoryPath);
  const hashes = [];

  files.forEach(file => {
    const filePath = path.join(directoryPath, file);
    const fileData = fs.readFileSync(filePath); 
    const hash = SHA3(fileData).toString();
    hashes.push(hash);
  });

  return hashes;
}

async function main() {
  let hashes = await getFileHashes();
  hashes.sort().reverse(); 

  const concatenatedHashes = hashes.join('') + email.toLowerCase(); 
  const finalHash = SHA3(concatenatedHashes).toString(); 

  console.log(finalHash); 
}

main();
