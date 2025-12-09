const express = require('express');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

// IMPORT CONTROLLER
const appController = require('./controllers/appController');

const app = express();

// MIDDLEWARE
app.use(cors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use((req, res, next) => {
    res.header("Access-Control-Allow-Private-Network", "true");
    next();
});

app.use(bodyParser.json({ limit: '10mb' }));

// STATIC FILES
const sitesDir = path.join(__dirname, 'sites');
app.use('/sites', express.static(sitesDir));

// --- API ROUTES ---
app.post('/api/analyze', appController.handleAnalyze);
app.post('/api/chat', appController.handleChat);
app.post('/api/create', appController.handleCreate);
app.post('/api/edit', appController.handleEdit);
app.post('/api/restore', appController.handleRestore);
app.post('/api/deploy', appController.handleDeploy);
app.get('/api/download/:sessionId', appController.handleDownload);
app.get('/api/image', appController.handleImage);

// FRONTEND SERVING
const clientBuildPath = path.join(__dirname, '../client/dist');
const fs = require('fs'); // Just for the check below

if (fs.existsSync(clientBuildPath)) {
    console.log("📂 Serving React App from:", clientBuildPath);
    app.use(express.static(clientBuildPath));
    app.get(/.*/, (req, res) => {
        if (req.path.startsWith('/api') || req.path.startsWith('/sites')) {
            return res.status(404).json({ error: "Not Found" });
        }
        res.sendFile(path.join(clientBuildPath, 'index.html'));
    });
} else {
    app.get('/', (req, res) => res.send('<h1>Backend is running!</h1>'));
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));