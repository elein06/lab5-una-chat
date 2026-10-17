// Pruebas de integracion BDD (Jest): servidor real + cliente Socket.IO real
const { io: ioClient } = require('socket.io-client');
const http = require('http');

// silenciar los console.log de unalib durante las pruebas
jest.spyOn(console, 'log').mockImplementation(() => {});

const { http: server, io } = require('../server');

let url;

beforeAll((done) => {
  server.listen(0, '127.0.0.1', () => {
    url = `http://127.0.0.1:${server.address().port}`;
    done();
  });
});

afterAll((done) => {
  io.close();
  server.close(() => done());
});

// helpers: conectar un cliente y enviar un mensaje esperando el broadcast
function conectarCliente() {
  return new Promise((resolve, reject) => {
    const socket = ioClient(url, { transports: ['websocket'], forceNew: true });
    socket.on('connect', () => resolve(socket));
    socket.on('connect_error', reject);
  });
}

function recibirMensaje(socket) {
  return new Promise((resolve) => {
    socket.once('Evento-Mensaje-Server', (msg) => resolve(JSON.parse(msg)));
  });
}

async function enviarYRecibir(socket, payload) {
  const respuesta = recibirMensaje(socket);
  socket.emit('Evento-Mensaje-Server', JSON.stringify(payload));
  return respuesta;
}

describe('Feature: Chat UNA con contenido multimedia', () => {
  let cliente;

  beforeEach(async () => {
    cliente = await conectarCliente();
  });

  afterEach(() => {
    cliente.disconnect();
  });

  describe('Scenario: el usuario abre la pagina del chat', () => {
    test('Given el servidor esta corriendo, When se pide "/", Then devuelve el HTML del chat', async () => {
      const html = await new Promise((resolve, reject) => {
        http.get(`${url}/`, (res) => {
          let body = '';
          res.on('data', (c) => { body += c; });
          res.on('end', () => resolve({ status: res.statusCode, body }));
        }).on('error', reject);
      });

      expect(html.status).toBe(200);
      expect(html.body).toContain('<form');
      expect(html.body).toContain('id="messages"');
    });
  });

  describe('Scenario: el usuario envia un mensaje de texto', () => {
    test('Given un usuario conectado, When envia "Hola a todos", Then todos reciben el texto, nombre y color', async () => {
      const msg = await enviarYRecibir(cliente, { nombre: 'Ana', mensaje: 'Hola a todos', color: '#1A2B3C' });

      expect(msg).toEqual({ nombre: 'Ana', mensaje: 'Hola a todos', color: '#1A2B3C' });
    });

    test('Given dos usuarios conectados, When uno envia un mensaje, Then el otro tambien lo recibe', async () => {
      const otro = await conectarCliente();
      try {
        const recibidoPorOtro = recibirMensaje(otro);
        await enviarYRecibir(cliente, { nombre: 'Ana', mensaje: 'broadcast', color: '#000000' });

        expect((await recibidoPorOtro).mensaje).toBe('broadcast');
      } finally {
        otro.disconnect();
      }
    });
  });

  describe('Scenario: el usuario comparte una URL de imagen', () => {
    test.each([
      'https://www.w3schools.com/html/pic_trulli.jpg',
      'http://image.com/foto.PNG',
      'https://picsum.photos/400.jpg?grayscale',
      'https://cdn.com/animacion.gif',
    ])('Given un usuario conectado, When envia %s, Then se muestra como <img>', async (url) => {
      const msg = await enviarYRecibir(cliente, { nombre: 'Ana', mensaje: url, color: '#000000' });

      expect(msg.mensaje).toContain('<img');
      expect(msg.mensaje).toContain(`src="${url}"`);
      expect(msg.mensaje).not.toContain('<video');
    });
  });

  describe('Scenario: el usuario comparte una URL de video', () => {
    test.each([
      'https://www.w3schools.com/html/mov_bbb.mp4',
      'https://video.com/clip.webm',
      'http://video.com/clip.ogg',
    ])('Given un usuario conectado, When envia %s, Then se inserta un reproductor <video controls>', async (url) => {
      const msg = await enviarYRecibir(cliente, { nombre: 'Ana', mensaje: url, color: '#000000' });

      expect(msg.mensaje).toMatch(/^<video [^>]*controls/);
      expect(msg.mensaje).toContain(`src="${url}"`);
    });

    test.each([
      ['https://www.youtube.com/watch?v=qYwlqx-JLok', 'qYwlqx-JLok'],
      ['https://youtu.be/dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
      ['https://www.youtube.com/shorts/aqz-KE-bpKQ', 'aqz-KE-bpKQ'],
    ])('Given un usuario conectado, When envia el link de YouTube %s, Then se inserta el reproductor embebido', async (url, id) => {
      const msg = await enviarYRecibir(cliente, { nombre: 'Ana', mensaje: url, color: '#000000' });

      expect(msg.mensaje).toContain('<iframe');
      expect(msg.mensaje).toContain(`https://www.youtube.com/embed/${id}"`);
    });
  });

  describe('Scenario: un atacante intenta inyectar scripts', () => {
    test.each([
      '<script>alert("xss")</script>',
      '<img src=x onerror=alert(1)>',
      '<iframe src="javascript:alert(1)"></iframe>',
      '<svg onload=alert(1)>',
    ])('Given un atacante conectado, When envia %s como mensaje, Then llega escapado y sin etiquetas HTML', async (ataque) => {
      const msg = await enviarYRecibir(cliente, { nombre: 'Hacker', mensaje: ataque, color: '#000000' });

      expect(msg.mensaje).not.toMatch(/</);
      expect(msg.mensaje).toContain('&lt;');
    });

    test('Given un atacante conectado, When pone HTML en su nombre, Then el nombre llega escapado', async () => {
      const msg = await enviarYRecibir(cliente, { nombre: '<script>alert(1)</script>', mensaje: 'hola', color: '#000000' });

      expect(msg.nombre).toBe('&lt;script&gt;alert(1)&lt;/script&gt;');
    });

    test('Given un atacante conectado, When manda CSS malicioso en el color, Then se reemplaza por un color seguro', async () => {
      const msg = await enviarYRecibir(cliente, { nombre: 'Hacker', mensaje: 'hola', color: "red'><script>alert(1)</script>" });

      expect(msg.color).toBe('#000000');
    });

    test.each([
      'http://x.com/a.jpg" onerror="alert(1)',
      'javascript:alert(1)//.jpg',
      'http://x.com/video.mp4"><script>alert(1)</script>',
    ])('Given un atacante conectado, When disfraza un ataque como URL multimedia (%s), Then no se genera ninguna etiqueta', async (ataque) => {
      const msg = await enviarYRecibir(cliente, { nombre: 'Hacker', mensaje: ataque, color: '#000000' });

      expect(msg.mensaje).not.toMatch(/<(img|video|iframe|script)/);
    });

    test('Given un atacante conectado, When envia un JSON invalido, Then el servidor sigue funcionando', async () => {
      const respuesta = recibirMensaje(cliente);
      cliente.emit('Evento-Mensaje-Server', '<script>{no es json');
      const msg = await respuesta;

      expect(msg.mensaje).not.toMatch(/</);

      const siguiente = await enviarYRecibir(cliente, { nombre: 'Ana', mensaje: 'sigo aqui', color: '#000000' });
      expect(siguiente.mensaje).toBe('sigo aqui');
    });
  });
});
