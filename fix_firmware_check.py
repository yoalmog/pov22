import sys

with open('src/App.tsx', 'r') as f:
    content = f.read()

content = content.replace(
    '''      // 2. Get server version (1.2.0 baseline)
      // In a real app, this would be a fetch to a manifest file
      const srvVer = "1.2.0"; 
      setServerVersion(srvVer);

      await new Promise(r => setTimeout(r, 1500)); // Aesthetic delay

      if (srvVer !== devVer && devVer !== "unknown") {''',
    '''      const srvVer = "1.2.0"; 
      setServerVersion(srvVer);

      if (srvVer !== devVer && devVer !== "unknown") {'''
)

content = content.replace(
    '// Simulate a brief generation delay for premium UX feeling\n        await new Promise((resolve) => setTimeout(resolve, 350));',
    ''
)

with open('src/App.tsx', 'w') as f:
    f.write(content)

