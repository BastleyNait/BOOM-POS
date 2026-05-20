const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

walkDir(path.join('C:/Users/schir/OneDrive/Escritorio/BOOM POS', 'src'), function(filePath) {
  if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    // We do a global replace of 'emerald' with 'orange' and 'teal' with 'amber'
    // But we might want to skip certain lines if they contain 'success' or '✓' or 'Cuadrado'
    // Actually, let's just do a blanket replace because it's the requested primary color.
    
    // Exception: ToastType
    // Actually, Toast uses 'emerald' for success. Let's try to not replace 'emerald' if the line has 'success'
    
    let lines = content.split('\n');
    let newLines = lines.map(line => {
      // Si la línea tiene algo de éxito explícito (como Toast, Cuadrado, etc), la dejamos intacta o la modificamos con cuidado.
      if (line.includes("'success'") || line.includes("Cuadrado") || line.includes("✓")) {
        return line; 
      }
      // Reemplazamos los colores
      return line.replace(/emerald/g, 'orange').replace(/teal/g, 'amber');
    });

    let newContent = newLines.join('\n');

    if (original !== newContent) {
      fs.writeFileSync(filePath, newContent, 'utf8');
      console.log('Updated theme in', filePath);
    }
  }
});
