const emotions = ["Angry", "Disgust", "Fear", "Happy", "Neutral", "Sad", "Surprise"];
const emojis = ["&#128545;", "&#129314;", "&#128560;", "&#128516;", "&#128528;", "&#128546;", "&#128561;"];
const emotions_with_emojis = emotions.map((emotion, id) => (emotion + " " + emojis[id]));
const moreEmojis = [["&#128545;", "&#128544;", "&#129324;", "&#128127;", "&#128548;", "&#128580;", "&#128530;", "&#128574;"],
    ["&#129314;", "&#129326;", "&#128534;", "&#128547;","&#128555;", "&#128567;", "&#128565;", "&#128128;"], 
    ["&#128560;", "&#128552;", "&#128549;"], 
    ["&#128516;"],
    ["&#128528;", "&#128529;", "&#128566;"],
    ["&#128546;"],
    ["&#128561;", "&#128562;", "&#128558;", "&#128559;"]
];
let currentEmotionId = null;

// socket.io socket
const socket = io();

function updateEmojis(id) {
    let innerHTML = "";
    for (let emoji of moreEmojis[id]) {
        innerHTML += `<div class='clickable-emoji' onclick='onEmojiClick(event,"${emoji}");'>${emoji}</div>`;
    }
    document.getElementById("emoji-list").innerHTML = innerHTML;
}

const emojiCopyCount = document.getElementById("emoji-copy-count");

// get emoji copy count
fetch('/api/emojiCopyCount')
    .then(response => response.json())
    .then(data => {
        emojiCopyCount.innerHTML = data.emojiCopyCount;
    })
    .catch(error => {
        console.error('Error fetching emoji copy count:', error);
        emojiCopyCount.innerHTML = 'undefined';
    });

function onEmojiClick(event, emoji) {
    navigator.clipboard.writeText(emoji); // copied to clipboard
    emojiCopyCount.innerHTML = parseInt(emojiCopyCount.innerHTML) + 1;
    socket.emit('incrementCopyCount'); 
    
    // Show the alert
    let alert = document.getElementById("copy-alert");
    alert.style.display = "inline";
    alert.style.left = `${event.pageX - 90}px`; // Set alert position based on cursor
    alert.style.top = `${event.pageY + 20}px`; // Position slightly below the cursor

    // Fade out the alert
    alert.style.opacity = 1;

    // After 1 second, fade out the alert
    setTimeout(function() {
        alert.style.opacity = 0;
    }, 300);
}
    
socket.on('emojiCountUpdated', async (updatedCopyCount) => {
    document.getElementById("emoji-copy-count").innerHTML = updatedCopyCount ? updatedCopyCount : 'undefined';
});

const run = async() => {
    // loading the trained convolutional neural network model
    const emotionDetectionModel = await tf.loadLayersModel('emotion_detection_model/model.json');

    const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false
    });

    const videoFeed = document.getElementById("video-feed");
    videoFeed.srcObject = stream;
    videoFeed.style.transform = "scaleX(-1)";  // Mirror the video horizontally
    videoFeed.style.objectFit = "cover";       // Crop the video by covering the area
    
    const canvas = document.getElementById("canvas");
    const ctx = canvas.getContext("2d");

    const hiddenCanvas = document.createElement("canvas"); 
    const hiddenCtx = hiddenCanvas.getContext("2d", { willReadFrequently: true });

    const croppedCanvas = document.createElement("canvas");
    const croppedCtx = croppedCanvas.getContext("2d");

    //const resizedCanvas = document.createElement("canvas");
    const resizedCanvas = document.getElementById("small-canvas");
    const resizedCtx = resizedCanvas.getContext("2d");
    // input format of tensor in emotion_detection_model was [batch_size, 48, 48, 1] when training
    resizedCanvas.width = 48;
    resizedCanvas.height = 48;

    // wait till video loads up
    videoFeed.addEventListener("loadeddata", async ()=> {

        document.getElementById('play-pause-btn').addEventListener('click', () => {
            if (videoFeed.paused == false){
                videoFeed.pause();
                document.getElementById('play-pause-btn').innerHTML = '&#9654;';
            } else {
                videoFeed.play();
                document.getElementById('play-pause-btn').innerHTML = '&#10074;&#10074;';
            }
        });

        let videoWidth = videoFeed.videoWidth;
        let videoHeight = videoFeed.videoHeight;
        let videoScale;
        let videoOffsetX
        let videoOffsetY;
        // set offsets and scaling because of videoFeed.style.objectFit = "cover"; 
        if (videoWidth > videoHeight) {
            videoScale = 500/videoHeight;
            videoOffsetY = 0;
            videoOffsetX = ((videoScale * videoWidth) - 500)/2
        } else {
            videoScale = 500/videoWidth;
            videoOffsetX = 0;
            videoOffsetY = ((videoScale * videoHeight) - 500)/2
        }

        // detect face using a publicly available AI model published by Mediapipe
        const faceDetectorModel = faceDetection.SupportedModels.MediaPipeFaceDetector;
        const faceDetectorConfig = {
        runtime: 'mediapipe',
        solutionPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/face_detection',
        };
        faceDetector = await faceDetection.createDetector(faceDetectorModel, faceDetectorConfig);
        const estimationConfig = {flipHorizontal: true};

        // prepare image 
        hiddenCanvas.width = videoFeed.videoWidth;
        hiddenCanvas.height = videoFeed.videoHeight;

        // bar chart
        let emotionProbs = [0, 0, 0, 0, 0, 0, 0];
        let emotionPercs = emotionProbs;
        let maxEmotionId = 0;

        function getColors(maxId) {
            return Array.from({ length: 7 }, (_, index) => index === maxId ? "#2dbd54" : "#5979c9");
        }

        function probsToPercs(probs) {
            probs = Array.from(probs); // probs is in Float32Array format not an array of Number
            return probs.map((prob) => (Math.round(prob*10000)/100));
        }

        const chartData = [{
            x: emotions_with_emojis,
            y: emotionPercs,
            type: 'bar'
        }];
        
        const chartLayout = {
            title: 'Emotion Probability Distribution Output from CNN',
            xaxis: {
                title: 'Emotions',
                tickmode: 'array',
                tickvals: emotions_with_emojis,
                ticktext: emotions_with_emojis,
                showgrid: false
            },
            yaxis: {
                title: 'Probability (%)',
                range: [0, 100],
                showgrid: true
            },
            barmode: 'group',
            showlegend: false
        };

        // Render the chart initially
        Plotly.newPlot('bar-chart', chartData, chartLayout);
        
        const loop = async () => {
            if (videoFeed.paused == false) {
                // detect face
                const faces = await faceDetector.estimateFaces(videoFeed, estimationConfig);
                ctx.clearRect(0, 0, 500, 500);
                if (faces.length > 0) {
                    // clear canvas
                    clearCanvas(hiddenCanvas, hiddenCtx);
                    clearCanvas(croppedCanvas, croppedCtx);
                    clearCanvas(resizedCanvas, resizedCtx);

                    let box = faces[0].box;
                    ctx.strokeStyle = "blue";
                    ctx.lineWidth = 3;
                    ctx.strokeRect(box.xMin * videoScale - videoOffsetX, 
                        box.yMin * videoScale - videoOffsetY, box.width * videoScale, box.height * videoScale);
                        
                    // prepare image
                    hiddenCtx.drawImage(videoFeed, 0, 0, hiddenCanvas.width, hiddenCanvas.height);
                    
                    let imageData = hiddenCtx.getImageData(videoFeed.videoWidth - box.xMin - box.width, box.yMin, box.width, box.height);
                    croppedCanvas.width = box.width;
                    croppedCanvas.height = box.height;
                    croppedCtx.putImageData(imageData, 0, 0);
                    
                    resizedCtx.fillStyle = 'grey'; 
                    resizedCtx.fillRect(0, 0, 48, 48);
                    resizedCtx.drawImage(croppedCanvas, 0, 0, 48, 48);

                    // feed prepared image into emotion detection model
                    let imgTensor = tf.browser.fromPixels(resizedCanvas);

                    // Separate the RGB channels
                    let r = imgTensor.slice([0, 0, 0], [-1, -1, 1]);
                    let g = imgTensor.slice([0, 0, 1], [-1, -1, 1]);
                    let b = imgTensor.slice([0, 0, 2], [-1, -1, 1]);

                    // Compute the grayscale using the luminance formula: 0.299*R + 0.587*G + 0.114*B
                    imgTensor = r.mul(0.299).add(g.mul(0.587)).add(b.mul(0.114));
                    imgTensor = imgTensor.toFloat().div(tf.scalar(255)); // changing greyscale 0-255 value to 0.0-1.0
                    imgTensor = imgTensor.expandDims(0); //adding batchsize at the beginning so input is exactly like inputs the model trained with
                    
                    emotionProbs = emotionDetectionModel.predict(imgTensor).dataSync();
                    emotionPercs = probsToPercs(emotionProbs);
                    maxEmotionId = emotionProbs.indexOf(Math.max(...emotionProbs));
                    document.getElementById("emotion-title").innerHTML = emotions[maxEmotionId] + " " +
                        Math.round(emotionProbs[maxEmotionId] * 100) + "%";
                    
                    // can't constantly update these if no change, this interferes with client clicks
                    if (maxEmotionId != currentEmotionId) {
                        currentEmotionId = maxEmotionId;
                        document.getElementById("emoji-title").innerHTML = emojis[maxEmotionId];
                        updateEmojis(maxEmotionId);
                    }
                    

                    // update bar chart
                    // Update the chart with new data using Plotly.react
                    Plotly.react('bar-chart', [{
                        x: emotions_with_emojis,
                        y: emotionPercs,
                        type: 'bar',
                        text: emotionPercs.map((perc) => perc.toFixed(2)),
                        textposition: 'inside',
                        hoverinfo: 'x+y',
                        marker: {
                            color: getColors(maxEmotionId),
                        }
                    }], chartLayout);
                }
            }
        };


        setInterval(loop, 100);
    });
};

run().catch((error) => {
    console.error("Error:", error);
});

function clearCanvas(canvas, ctx) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}