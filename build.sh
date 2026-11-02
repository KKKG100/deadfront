#!/bin/bash
# Builds server/sim.js (headless authoritative simulation) and public/index.html (client)
set -e
cd "$(dirname "$0")"
{ echo "'use strict';"; for f in 00_core 05_rules 10_world 11_gen 30_sim 99_server_exports; do sed "s/^'use strict';$//" src/$f.js; echo; done; } > server/sim.js
node --check server/sim.js && echo "server/sim.js ok ($(wc -c < server/sim.js) bytes)"
if ls src/70_net.js >/dev/null 2>&1; then
{ cat src/head.html; cat src/body.html; echo '<script>'; for f in 00_core 05_rules 10_world 12_terrain 15_audio 20_sprites 35_fx 40_render 50_ui 70_net 60_main; do cat src/$f.js; echo; done; echo '</script>'; } > public/index.html
node -e "
const fs=require('fs');const h=fs.readFileSync('public/index.html','utf8');const s=h.slice(h.indexOf('<script>')+8,h.lastIndexOf('</script>'));
try{new Function(s);console.log('client syntax ok ('+h.length+' bytes)')}catch(e){console.log('CLIENT SYNTAX',e.message);process.exit(1)}"
fi
