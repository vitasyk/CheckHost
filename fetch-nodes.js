const https = require('https');

https.get('https://check-host.net/nodes/hosts', (res) => {
    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });
    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            const nodes = json.nodes;
            const uniqueLocations = new Set();

            Object.values(nodes).forEach(node => {
                // location format: [CountryCode, CountryName, City]
                if (node.location && node.location.length >= 3) {
                    uniqueLocations.add(`${node.location[2]} (${node.location[1]})`);
                }
            });

            console.log("Current Check-Host Node Locations:");
            Array.from(uniqueLocations).sort().forEach(loc => console.log(loc));
        } catch (e) {
            console.error("Error parsing JSON:", e.message);
        }
    });
}).on('error', (err) => {
    console.error("Error fetching nodes:", err.message);
});
