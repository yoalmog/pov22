import json

with open('metadata.json', 'r') as f:
    data = json.load(f)

perms = data.get("requestFramePermissions", [])
for p in ["bluetooth", "usb", "serial"]:
    if p not in perms:
        perms.append(p)

data["requestFramePermissions"] = perms

with open('metadata.json', 'w') as f:
    json.dump(data, f, indent=2)

print("Updated metadata.json successfully:")
print(open('metadata.json').read())
