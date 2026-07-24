import sys

with open('src/components/AdvancedSyncPanel.tsx', 'r') as f:
    content = f.read()

content = content.replace(
    "const offset = Math.sin(t * 0.05) * 3; // Simulated jitter",
    "const offset = 0;"
)

with open('src/components/AdvancedSyncPanel.tsx', 'w') as f:
    f.write(content)
