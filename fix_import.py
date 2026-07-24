import sys

with open('server.ts', 'r') as f:
    content = f.read()

content = content.replace('  import { exec } from "child_process";', '')
content = 'import { exec } from "child_process";\n' + content

with open('server.ts', 'w') as f:
    f.write(content)
