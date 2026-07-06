import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';

let handLandmarker: HandLandmarker | null = null;

async function init() {
  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
  );
  handLandmarker = await HandLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
      delegate: "GPU"
    },
    runningMode: "VIDEO",
    numHands: 1
  });
  postMessage({ type: 'READY' });
}

onmessage = async (e) => {
  if (e.data.type === 'INIT') {
    await init();
  } else if (e.data.type === 'PROCESS') {
    if (!handLandmarker) return;
    const { imageBitmap, timestamp } = e.data;
    const results = handLandmarker.detectForVideo(imageBitmap, timestamp);
    postMessage({ type: 'RESULTS', results }, [imageBitmap] as any);
  }
};
