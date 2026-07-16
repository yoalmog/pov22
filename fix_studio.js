import fs from 'fs';
let content = fs.readFileSync('src/components/AiEffectStudio.tsx', 'utf8');

// Add import
content = content.replace(
  'import { Sparkles, Loader2, Send, Cpu, Copy, Check } from "lucide-react";',
  'import { Sparkles, Loader2, Send, Cpu, Copy, Check } from "lucide-react";\nimport { PlatformGuideModal } from "./PlatformGuideModal";'
);

// Add state
content = content.replace(
  'const [copied, setCopied] = useState<boolean>(false);',
  'const [copied, setCopied] = useState<boolean>(false);\n  const [showPlatformGuide, setShowPlatformGuide] = useState<boolean>(false);'
);

// Add modal logic to the return statement (at the end of the main div)
const lastDivIdx = content.lastIndexOf('</div>');
if (lastDivIdx !== -1) {
  content = content.substring(0, lastDivIdx) + 
    `      {showPlatformGuide && (\n        <PlatformGuideModal onClose={() => setShowPlatformGuide(false)} />\n      )}\n    </div>` +
    content.substring(lastDivIdx + 6);
}

// Modify the engine switch button for 'chrome' to show the guide on mobile
content = content.replace(
  /onClick=\{\(\) => \{\s*if \(isLocalAiAvailable\) \{\s*setEngine\("chrome"\);\s*\} else \{\s*setError\("Chrome window\.ai is not available in this browser\. To use Chrome Nano, enable Gemini Nano in chrome:\/\/flags\."\);\s*setTimeout\(\(\) => setError\(null\), 5000\);\s*\}\s*\}\}/g,
  `onClick={() => {
            if (isLocalAiAvailable) {
              setEngine("chrome");
            } else {
              if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
                setShowPlatformGuide(true);
              } else {
                setError("Chrome window.ai is not available in this browser. To use Chrome Nano, enable Gemini Nano in chrome://flags.");
                setTimeout(() => setError(null), 5000);
              }
            }
          }}`
);

fs.writeFileSync('src/components/AiEffectStudio.tsx', content);
