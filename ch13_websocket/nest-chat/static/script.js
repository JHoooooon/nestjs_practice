const socket = io('http://localhost:3000/chat');
const roomSocket = io('http://localhost:3000/room');
const nickname = prompt('닉네임을 입력해주세요.');
let currentRoom = '';

socket.on('connect', () => {
  console.log('connected');
});

// room 생성하는 함수
function createRoom() {
  const room = prompt('생성할 방의 이름을 입력해주세요.');
  roomSocket.emit('createRoom', { room, nickname });
}

// room 에 join
function joinRoom(room) {
  const chat = document.getElementById('chat');
  chat.innerHTML = '';
  roomSocket.emit('joinRoom', { room, nickname, toLeaveRoom: currentRoom });

  currentRoom = room;
}

// message 를 보내는 함수
function sendMessage() {
  if (currentRoom == '') {
    alert('방을 선택해주세요.');
    return;
  }
  const message = document.querySelector('#message').value;
  const chat = document.querySelector('#chat');
  const div = document.createElement('div');
  const data = { message, nickname, room: currentRoom };

  div.innerHTML = `<div>나: ${message}</div>`;
  chat.appendChild(div);
  roomSocket.emit('message', data);
  return false;
}

socket.on('message', (message) => {
  const chat = document.querySelector('#chat');
  const div = document.createElement('div');
  div.innerHTML = message;
  chat.appendChild(div);
});

// 클라이언트 측에서 채팅방을 추가하는 함수
roomSocket.on('room', (data) => {
  const rooms = document.querySelector('#rooms');
  rooms.innerHTML = '';
  data.forEach((room) => {
    console.log(room);
    const li = document.createElement('li');
    li.innerHTML = `${room} <button onclick="joinRoom('${room}')">join</button>`;
    rooms.appendChild(li);
  });
});
