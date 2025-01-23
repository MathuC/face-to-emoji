const run = async() => {
    const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false
    });

    const videoFeed = document.getElementById("video-feed");
    videoFeed.srcObject = stream;
    videoFeed.style.transform = "scaleX(-1)";  // Mirror the video horizontally
    videoFeed.style.objectFit = "cover";       // Crop the video by covering the area
    
    const canvas = document.getElementById("canvas");
    let ctx = canvas.getContext("2d");

    // wait till video loads up
    videoFeed.addEventListener("loadeddata", async ()=> {
        let videoWidth = videoFeed.videoWidth;
        let videoHeight = videoFeed.videoHeight;
        let videoScale;
        let videoOffsetX
        let videoOffsetY;
        // set offsets and scaling
        if (videoWidth > videoHeight) {
            videoScale = 500/videoHeight;
            videoOffsetY = 0;
            videoOffsetX = ((videoScale * videoWidth) - 500)/2
        } else {
            videoScale = 500/videoWidth;
            videoOffsetX = 0;
            videoOffsetY = ((videoScale * videoHeight) - 500)/2
        }

        // detect faces
        const faceDetectorModel = faceDetection.SupportedModels.MediaPipeFaceDetector;
        const faceDetectorConfig = {
        runtime: 'mediapipe',
        solutionPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/face_detection',
        };
        faceDetector = await faceDetection.createDetector(faceDetectorModel, faceDetectorConfig);
        const estimationConfig = {flipHorizontal: true};
        const detectFace = async () => {
            const faces = await faceDetector.estimateFaces(videoFeed, estimationConfig);
            ctx.clearRect(0, 0, 500, 500);
            if (faces.length > 0) {
                let box = faces[0].box;
                ctx.strokeStyle = "blue";
                ctx.lineWidth = 3;
                ctx.strokeRect(box.xMin * videoScale - videoOffsetX, 
                    box.yMin * videoScale - videoOffsetY, box.width * videoScale, box.height * videoScale);
            }
        };
        setInterval(detectFace, 100);
    });
};

run().catch((error) => {
    console.error("Webcam setup error:", error);
});