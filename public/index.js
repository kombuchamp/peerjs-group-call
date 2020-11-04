try {
    const ROOM_ID = location.pathname.slice(1);

    const socket = io('/');
    const videoContainer = document.querySelector('.video-container');
    const peer = new Peer(void 0, {
        host: '/',
        port: 3003,
        path: '/peerjs',
    });
    const users = new Map();

    socket.on('user-disconnected', userId => {
        console.log('user-disconnected', userId);
        if (users.has(userId)) {
            const { call, video } = users.get(userId);
            call.close();
            video.remove();
            users.delete(userId);
        }
    });

    peer.on('open', id => {
        getMediaStream().then(stream => {
            // Add user video
            addVideo(stream, { muted: true });
            // Accept and send streams on call
            peer.on('call', call => {
                call.answer(stream);
                call.on('stream', stream => onStream(stream, call, call.peer));
            });
            // Call new user when he is connected
            socket.on('user-connected', userId => {
                console.log('user-connected', userId);
                const call = peer.call(userId, stream);
                call.on('stream', stream => onStream(stream, call, userId));
            });

            // Ready for calls
            socket.emit('join', ROOM_ID, id);
        });
    });

    function onStream(stream, call, userId) {
        if (users.has(userId)) {
            // TODO: This event fires twice for some reason.
            const { video } = users.get(userId);
            video.remove();
        }
        const video = addVideo(stream);
        users.set(userId, { call, video });
    }

    function addVideo(stream, options = {}) {
        const video = document.createElement('video');
        video.setAttribute('autoplay', true);
        video.setAttribute('controls', true);
        if (options.muted) {
            video.muted = true;
        }
        video.srcObject = stream;
        videoContainer.appendChild(video);

        return video;
    }

    function getMediaStream() {
        return navigator.mediaDevices
            .enumerateDevices()
            .then(devices => ({
                video: devices.some(({ kind }) => kind === 'videoinput'),
                audio: devices.some(({ kind }) => kind === 'audioinput'),
            }))
            .then(constraints =>
                navigator.mediaDevices.getUserMedia(constraints)
            );
    }
} catch (e) {
    document.body.appendChild(document.createTextNode(e.message));
}
