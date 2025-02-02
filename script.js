import {
    FaceDetector,
    FilesetResolver,
    // Detection
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0";

const demosSection = document.getElementById("demos");

let faceDetector;
let runningMode = "IMAGE";

// Initialize the object detector
const initializefaceDetector = async () => {
    const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
    );
    faceDetector = await FaceDetector.createFromOptions(vision, {
        baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite`,
            delegate: "GPU"
        },
        runningMode: runningMode
    });
    demosSection.classList.remove("invisible");
};
initializefaceDetector();


/********************************************************************
// Demo 2: Continuously grab image from webcam stream and detect it.
********************************************************************/

let video = document.getElementById("webcam");
const liveView = document.getElementById("liveView");
let enableWebcamButton;

// Check if webcam access is supported.
const hasGetUserMedia = () => !!navigator.mediaDevices?.getUserMedia;

// Keep a reference of all the child elements we create
// so we can remove them easilly on each render.
var children = [];

// If webcam supported, add event listener to button for when user
// wants to activate it.
if (hasGetUserMedia()) {
    enableWebcamButton = document.getElementById("webcamButton");
    enableWebcamButton.addEventListener("click", enableCam);
} else {
    console.warn("getUserMedia() is not supported by your browser");
}

// Enable the live webcam view and start detection.
async function enableCam(event) {
    if (!faceDetector) {
        alert("Face Detector is still loading. Please try again..");
        return;
    }

    // Hide the button.
    enableWebcamButton.classList.add("removed");

    // getUsermedia parameters
    const constraints = {
        video: true
    };

    // Activate the webcam stream.
    navigator.mediaDevices
        .getUserMedia(constraints)
        .then(function (stream) {
            video.srcObject = stream;
            video.addEventListener("loadeddata", predictWebcam);
        })
        .catch((err) => {
            console.error(err);
        });
}

let lastVideoTime = -1;
async function predictWebcam() {
    // if image mode is initialized, create a new classifier with video runningMode
    if (runningMode === "IMAGE") {
        runningMode = "VIDEO";
        await faceDetector.setOptions({ runningMode: "VIDEO" });
    }
    let startTimeMs = performance.now();

    // Detect faces using detectForVideo
    if (video.currentTime !== lastVideoTime) {
        lastVideoTime = video.currentTime;
        const detections = faceDetector.detectForVideo(video, startTimeMs)
            .detections;
        displayVideoDetections(detections);
    }

    // Call this function again to keep predicting when the browser is ready
    window.requestAnimationFrame(predictWebcam);
}

function displayVideoDetections(detections) {
    // Remove any highlighting from previous frame.

    for (let child of children) {
        liveView.removeChild(child);
    }
    children.splice(0);

    // Iterate through predictions and draw them to the live view
    for (let detection of detections) {
        const p = document.createElement("p");
        p.innerText =
            "Confidence: " +
            Math.round(parseFloat(detection.categories[0].score) * 100) +
            "% .";
        p.style = "text-align: center; margin-top: 10px; border-radius: 5px;";
        //     "left: " +
        //     (video.offsetWidth -
        //         detection.boundingBox.width -
        //         detection.boundingBox.originX) +
        //     "px;" +
        //     "top: " +
        //     (detection.boundingBox.originY - 30) +
        //     "px; " +
        //     "width: " +
        //     (detection.boundingBox.width - 10) +
        //     "px;";

        const highlighter = document.createElement("div");
        highlighter.setAttribute("class", "highlighter");
        highlighter.style =
            "left: " +
            (detection.boundingBox.originX / 6) +
            "%;" +
            "top: " +
            (detection.boundingBox.originY / 6) +
            "%;" +
            "width: " +
            ((detection.boundingBox.width - 10) / 7.5) +
            "%;" +
            "height: " +
            (detection.boundingBox.height / 6) +
            "%;";

        liveView.appendChild(highlighter);
        liveView.appendChild(p);

        // Store drawn objects in memory so they are queued to delete at next call
        children.push(highlighter);
        children.push(p);

        // for (let keypoint of detection.keypoints) {
        //     const keypointEl = document.createElement("spam");
        //     keypointEl.className = "key-point";
        //     keypointEl.style.top = `${keypoint.y * video.offsetHeight - 3}px`;
        //     keypointEl.style.left = `${video.offsetWidth - keypoint.x * video.offsetWidth - 3
        //         }px`;
        //     liveView.appendChild(keypointEl);
        //     children.push(keypointEl);
        // }

        for (let i = 0; i < detection.keypoints.length; i++) {
            const keypoint = detection.keypoints[i];
            const keypointEl = document.createElement("spam");
            keypointEl.className = (i === 2) ? "key-point" : "key-dot";
            keypointEl.style.top = `${keypoint.y * video.offsetHeight - 3}px`;
            keypointEl.style.left = `${video.offsetWidth - keypoint.x * video.offsetWidth - 3}px`;
            liveView.appendChild(keypointEl);
            children.push(keypointEl);
        }

        // console.log(`X = ${detection.keypoints[2].y * video.offsetHeight - 3}, X = ${video.offsetWidth - detection.keypoints[2].x * video.offsetWidth - 3}`)
        console.log(`H = ${video.offsetHeight}, W = ${video.offsetWidth}`)
        console.log(`BX = ${detection.boundingBox.originX}, BY = ${detection.boundingBox.originY}`)
    }
}