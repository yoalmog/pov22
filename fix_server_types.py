import sys

with open('server.ts', 'r') as f:
    content = f.read()

content = content.replace(
    'const proxyToEsp32 = async (req, res, path) => {',
    'const proxyToEsp32 = async (req: express.Request, res: express.Response, path: string) => {'
)

content = content.replace(
    '} catch (e) {',
    '} catch (e: any) {'
)

with open('server.ts', 'w') as f:
    f.write(content)

