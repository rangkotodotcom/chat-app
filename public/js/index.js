let socket = io();

socket.on('connect', function () {
    console.log('Connect to server');
});

socket.on('disconnect', function () {
    console.log('Disconnect from server');
});


document.querySelector('#btn-submit').addEventListener('click', function (e) {
    e.preventDefault();

    socket.emit('createMessage', {
        from: "User",
        text: document.querySelector('input[name="message"]').value,
    }, function (res) {
        console.log(res);
    });
})

document.querySelector('#send-document').addEventListener('click', function (e) {
    if (!navigator.geolocation) {
        return alert('Geolocator Not Support In Browser');
    }

    navigator.geolocation.getCurrentPosition(function (position) {
        socket.emit('createLocationMessage', {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
        });

    }, function () {
        alert('Unable to fetch location');
    });
});


socket.on('newMessage', function (message) {
    const formatedTime = moment(message.createdAt).format('LT');
    let li = document.createElement('li');
    li.innerHTML = `${message.from} ${formatedTime} : ${message.text}`;

    document.querySelector('body').appendChild(li);
})

socket.on('newLocationMessage', function (message) {
    const formatedTime = moment(message.createdAt).format('LT');
    let li = document.createElement('li');
    li.innerHTML = `${message.from} ${formatedTime} : `;
    let a = document.createElement('a');
    a.setAttribute('target', '_blank');
    a.setAttribute('href', message.url);
    a.innerHTML = 'My Location';
    li.appendChild(a);

    document.querySelector('body').appendChild(li);
})