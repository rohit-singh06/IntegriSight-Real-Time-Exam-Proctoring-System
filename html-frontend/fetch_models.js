const fs = require('fs');

async function getModels() {
    const res = await fetch('https://openrouter.ai/api/v1/models');
    const data = await res.json();
    const freeModels = data.data.filter(m => m.id.endsWith(':free')).map(m => m.id);
    fs.writeFileSync('free_models.txt', freeModels.join('\n'));
}

getModels();
