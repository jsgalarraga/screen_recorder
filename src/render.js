const {desktopCapturer, remote} = require('electron');
const {Menu, dialog} = remote;
const {writeFile} = require('fs');

//Buttons
const videoElement = document.querySelector('video');

const startBtn = document.getElementById('startBtn');
startBtn.onclick = e => {
    mediaRecorder.start();
    startBtn.classList.add('is-danger');
    startBtn.innerText = 'Recording';
};

const stopBtn = document.getElementById('stopBtn');
stopBtn.onclick = e => {
    mediaRecorder.stop();
    startBtn.classList.remove('is-danger');
    startBtn.innerText = 'Start';
};

const videoSelectLbl = document.getElementById('videoSelectLbl');
const videoSelectBtn = document.getElementById('videoSelectBtn');
videoSelectBtn.onclick = getVideoSources;


//Get the video sources
async function getVideoSources(){
    const inputSources = await desktopCapturer.getSources({
        types: ['window', 'screen']
    });

    const videoOptionsMenu = Menu.buildFromTemplate(
        inputSources.map(source => {
            return {
                label: source.name,
                click: () => selectSource(source)
            };
        })
    );

    videoOptionsMenu.popup();
}

let mediaRecorder;
const recordedChunks = [];

// Change the source window to record
async function selectSource(source){
    videoSelectLbl.innerText = source.name;

    const constraints = {
        audio: false,
        video: {
            mandatory: {
                chromeMediaSource: 'desktop',
                chromeMediaSourceId: source.id
            }
        }
    };

    // Create a stream
    const stream = await navigator.mediaDevices.getUserMedia(constraints)

    // Preview the source
    videoElement.srcObject = stream;
    videoElement.play();

    // Create the recorder
    const options = { mimeType: 'video/webm; codecs=vp9' };
    mediaRecorder = new MediaRecorder(stream, options);

    // Event Handlers
    mediaRecorder.ondataavailable = handleDataAvailable;
    mediaRecorder.onstop = handleStop;
}

// Capture all recorded chunks
function handleDataAvailable(e){
    console.log('video data available');
    recordedChunks.push(e.data);
}

// Save the video file on stop
async function handleStop(e){
    const blob =  new Blob(recordedChunks, {
        type: 'video/web; codecs=vp9'
    });

    const buffer = Buffer.from(await blob.arrayBuffer())

    const { filePath } = await dialog.showSaveDialog({
        buttonLabel: 'Save video',
        defaultPath: `vid-${Date.now()}.webm`
    });

    console.log(filePath)

    writeFile(filePath, buffer, () => console.log('video saved succesfully!!'));
}


