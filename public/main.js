const run = async() => {
    const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false
    });

    const videoFeed = document.getElementById("video-feed");
    videoFeed.srcObject = stream;

    videoFeed.style.transform = "scaleX(-1)";  // Mirror the video horizontally
    videoFeed.style.objectFit = "cover";       // Crop the video by covering the area

};

run();