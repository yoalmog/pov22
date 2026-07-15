import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');

const helper = `
  const getDeviceUrl = (path: string) => {
    const isCapacitor = !!(window as any).Capacitor;
    if (state.wifi.mode === "AP") return \`http://192.168.4.1\${path}\`;
    if (state.wifi.ip && state.wifi.ip.trim() !== "") {
      const ipStr = state.wifi.ip.trim();
      return ipStr.startsWith("http") ? \`\${ipStr}\${path}\` : \`http://\${ipStr}\${path}\`;
    }
    return path;
  };

  const safeFetch = async (url: string, options?: any) => {
    const isHttps = window.location.protocol === 'https:';
    if (isHttps && url.startsWith('http://') && !url.includes('localhost') && !url.includes('127.0.0.1')) {
       try {
         const res = await fetch(url, options);
         return res;
       } catch (e: any) {
         if (e.message && e.message.includes('Failed to fetch')) {
           setToastMessage("שגיאת חיבור: דפדפנים חוסמים גישה לכתובות HTTP מתוך סביבת HTTPS. יש להוריד את האפליקציה למחשב או להתחבר דרך Bluetooth! / Browser blocked HTTP connection from HTTPS.");
         }
         throw e;
       }
    }
    return fetch(url, options);
  };
`;

content = content.replace("export default function App() {\n", "export default function App() {\n" + helper);

// I need to remove the previous outside ones if they exist, but they don't because I just overwrote the file in my mind but wait, I did `node fix_functions.js`
fs.writeFileSync('src/App.tsx', content);
