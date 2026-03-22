const express = require('express');
const multer = require('multer');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg'); // Pour fusionner audio+image en vidéo

const app = express();
const port = 3000;

// Configuration de Multer pour sauvegarder les fichiers uploadés
const storage = multer.diskStorage({
    destination: './uploads/',
    filename: (req, file, cb) => {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// Sert le fichier HTML
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Route qui gère le formulaire
app.post('/upload', upload.fields([{ name: 'audio' }, { name: 'cover' }]), (req, res) => {
    const title = req.body.title;
    const tags = req.body.tags;
    const audioFile = req.files['audio'][0].path;
    const coverFile = req.files['cover'][0].path;
    
    const uploadYoutube = req.body.youtube === 'on';
    const uploadBandcamp = req.body.bandcamp === 'on';

    console.log(`[START] Traitement de la prod: ${title}`);
    res.send("<h1>Upload en cours... Regarde la console du serveur !</h1>");

    // ÉTAPE 1 : Création de la vidéo pour YouTube (Image + Audio)
    if (uploadYoutube) {
        const outputVideo = `./uploads/output-${Date.now()}.mp4`;
        
        console.log("Création de la vidéo MP4 en cours...");
        
        // C'est ici que FFmpeg intervient
        ffmpeg()
            .input(coverFile)
            .loop(1) // Répète l'image
            .input(audioFile)
            .outputOptions([
                '-c:v libx264',
                '-tune stillimage',
                '-c:a aac',
                '-b:a 320k', // Qualité audio
                '-pix_fmt yuv420p',
                '-shortest' // Arrête la vidéo à la fin de l'audio
            ])
            .save(outputVideo)
            .on('end', () => {
                console.log('Vidéo créée avec succès !');
                // ÉTAPE 2 : Ici viendrait la fonction d'upload vers l'API YouTube
                // uploadToYouTube(outputVideo, title, tags);
            })
            .on('error', (err) => console.error('Erreur vidéo:', err));
    }

    // ÉTAPE 3 : Bot Bandcamp (Nécessite Puppeteer)
    if (uploadBandcamp) {
        console.log("Lancement du bot Bandcamp (à développer via Puppeteer)...");
        // bandcampBot(audioFile, coverFile, title, tags);
    }
});

app.listen(port, () => {
    console.log(`Serveur d'upload lancé sur http://localhost:${port}`);
});
