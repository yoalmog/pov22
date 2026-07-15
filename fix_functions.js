import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');

const helper = `
const getDeviceUrl = (path: string, state: any) => {
  const isCapacitor = !!(window as any).Capacitor;
  const isHttps = window.location.protocol === 'https:';
  if (state && state.wifi && state.wifi.mode === "AP") return \`http://192.168.4.1\${path}\`;
  if (state && state.wifi && state.wifi.ip && state.wifi.ip.trim() !== "") {
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
       // We log or throw but we don't have access to setToastMessage here because it's outside component.
       // We will just throw it.
       throw e;
     }
  }
  return fetch(url, options);
};

`;

content = content.replace("export default function App() {", helper + "export default function App() {");
content = content.replace(/getDeviceUrl\(/g, "getDeviceUrl(");
// Wait, we need to pass `state` to `getDeviceUrl` now, because it's outside.
// Or we put it inside `App()`!
