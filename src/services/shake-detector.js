// Shake Detection Service using DeviceMotion API

let shakeCallback = null;
let lastShakeTime = 0;
let shakeCount = 0;
const SHAKE_THRESHOLD = 25;  // acceleration threshold
const SHAKE_TIMEOUT = 1000;  // reset after 1s of no shaking
const SHAKES_REQUIRED = 3;   // number of shakes to trigger

let lastX = 0, lastY = 0, lastZ = 0;
let isListening = false;

function handleMotion(event) {
    const { x, y, z } = event.accelerationIncludingGravity || {};
    if (x == null || y == null || z == null) return;

    const deltaX = Math.abs(x - lastX);
    const deltaY = Math.abs(y - lastY);
    const deltaZ = Math.abs(z - lastZ);

    const acceleration = Math.sqrt(deltaX ** 2 + deltaY ** 2 + deltaZ ** 2);

    if (acceleration > SHAKE_THRESHOLD) {
        const now = Date.now();
        if (now - lastShakeTime > SHAKE_TIMEOUT) {
            shakeCount = 0;
        }
        shakeCount++;
        lastShakeTime = now;

        if (shakeCount >= SHAKES_REQUIRED) {
            shakeCount = 0;
            if (shakeCallback) {
                shakeCallback();
            }
        }
    }

    lastX = x;
    lastY = y;
    lastZ = z;
}

/**
 * Start listening for shake gestures
 * @param {Function} callback - Called when shake detected
 */
export function startShakeDetection(callback) {
    if (isListening) return;

    shakeCallback = callback;

    // Request permission on iOS 13+
    if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
        DeviceMotionEvent.requestPermission()
            .then(permission => {
                if (permission === 'granted') {
                    window.addEventListener('devicemotion', handleMotion);
                    isListening = true;
                }
            })
            .catch(console.warn);
    } else if ('DeviceMotionEvent' in window) {
        window.addEventListener('devicemotion', handleMotion);
        isListening = true;
    }
}

/**
 * Stop listening for shake gestures
 */
export function stopShakeDetection() {
    window.removeEventListener('devicemotion', handleMotion);
    isListening = false;
    shakeCallback = null;
    shakeCount = 0;
}

/**
 * Check if shake detection is supported
 */
export function isShakeSupported() {
    return 'DeviceMotionEvent' in window;
}
