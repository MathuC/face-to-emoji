const emotions = ["Angry", "Disgust", "Fear", "Happy", "Neutral", "Sad", "Surprise"];
const emojis = ["&#128545;", "&#129314;", "&#128560;", "&#128516;", "&#128528;", "&#128546;", "&#128561;"];

const run = async() => {
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

        // detect face
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
        
        const loop = async () => {
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
                
                let emotionProbList = emotionDetectionModel.predict(imgTensor).dataSync();
                let emotionId = emotionProbList.indexOf(Math.max(...emotionProbList));
                document.getElementById("emotion-title").innerHTML = emotions[emotionId] + " " +
                    Math.round(emotionProbList[emotionId] * 100) + "%";
                document.getElementById("main-emoji").innerHTML = emojis[emotionId];

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