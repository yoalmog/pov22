import fs from 'fs';
let content = fs.readFileSync('src/main.tsx', 'utf8');
const unregister = `
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (const registration of registrations) {
      registration.unregister();
    }
  });
}
`;
if (!content.includes('getRegistrations')) {
  content = content.replace("createRoot", unregister + "\ncreateRoot");
  fs.writeFileSync('src/main.tsx', content);
}
