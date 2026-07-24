import sys
with open('src/components/AiEffectStudio.tsx', 'r') as f:
    content = f.read()

content = content.replace(
    '// Simulate a brief generation delay for premium UX feeling\n        await new Promise((resolve) => setTimeout(resolve, 350));',
    ''
)

with open('src/components/AiEffectStudio.tsx', 'w') as f:
    f.write(content)
