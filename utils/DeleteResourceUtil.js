const fs = require('fs').promises;
const path = require('path');
const RESOURCES_FILE = path.join('utils', 'resources.json');
async function deleteResource(req, res) {
try {
const { id } = req.params;
let resources = [];
try {
const data = await fs.readFile(RESOURCES_FILE, 'utf8');
resources = JSON.parse(data);
} catch (err) {
if (err.code === 'ENOENT') {
return res.status(404).json({ message: 'No resources found to delete.' });
} else {
throw err;
}
}
const resourceIndex = resources.findIndex(r => r.id == id);
if (resourceIndex === -1) {
return res.status(404).json({ message: 'Resource not found.' });
}
const deletedResource = resources.splice(resourceIndex, 1)[0];
await fs.writeFile(RESOURCES_FILE, JSON.stringify(resources, null, 2), 'utf8');
return res.status(200).json({ message: 'Resource deleted successfully!' });
} catch (error) {
console.error(error);
return res.status(500).json({ message: error.message });
}
}
module.exports = { deleteResource };

// somehow this is not in github