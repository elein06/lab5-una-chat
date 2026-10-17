// Pruebas unitarias: URLs de imagenes, URLs de videos y prevencion de inyeccion de scripts
var val = require('../libs/unalib');
var assert = require('assert');

// silenciar los console.log de validateMessage
var logOriginal;
before(function () { logOriginal = console.log; console.log = function () {}; });
after(function () { console.log = logOriginal; });

// envia un mensaje por validateMessage como lo haria el cliente
function procesar(mensaje, nombre, color) {
  var entrada = { nombre: nombre || 'Ana', mensaje: mensaje, color: color || '#123ABC' };
  return JSON.parse(val.validateMessage(JSON.stringify(entrada)));
}

describe('Validacion de URLs de Imagenes', function () {

  describe('is_valid_url_image acepta URLs de imagen', function () {
    [
      'http://image.com/image.jpg',
      'https://image.com/image.jpeg',
      'https://image.com/image.png',
      'https://image.com/image.gif',
      'https://image.com/image.bmp',
      'https://image.com/image.webp',
      'https://image.com/image.svg',
      'https://IMAGE.com/FOTO.JPG',
      'https://cdn.com/carpeta/sub-carpeta/foto_1.png',
      'https://picsum.photos/400.jpg?grayscale&blur=2',
      'https://cdn.com/foto.png#seccion'
    ].forEach(function (url) {
      it('deberia devolver true para ' + url, function () {
        assert.equal(val.is_valid_url_image(url), true);
      });
    });
  });

  describe('is_valid_url_image rechaza lo que no es imagen', function () {
    [
      'hola mundo',
      '',
      'image.jpg',
      'ftp://image.com/image.jpg',
      'https://image.com/image.jpg.exe',
      'https://image.com/documento.pdf',
      'https://video.com/clip.mp4',
      'texto antes https://image.com/image.jpg'
    ].forEach(function (url) {
      it('deberia devolver false para "' + url + '"', function () {
        assert.equal(val.is_valid_url_image(url), false);
      });
    });

    it('deberia devolver false para valores que no son texto', function () {
      assert.equal(val.is_valid_url_image(null), false);
      assert.equal(val.is_valid_url_image(undefined), false);
      assert.equal(val.is_valid_url_image(12345), false);
    });
  });

  describe('la imagen se muestra correctamente en el chat', function () {
    it('deberia generar una etiqueta <img> con la URL como src', function () {
      var msg = procesar('https://www.w3schools.com/html/pic_trulli.jpg');
      assert.ok(msg.mensaje.indexOf('<img') !== -1);
      assert.ok(msg.mensaje.indexOf('src="https://www.w3schools.com/html/pic_trulli.jpg"') !== -1);
    });

    it('deberia limitar el tamano con la clase chat-media', function () {
      assert.ok(procesar('https://image.com/a.png').mensaje.indexOf('class="chat-media"') !== -1);
    });

    it('deberia abrir la imagen en otra pestana sin dar acceso a la ventana (noopener)', function () {
      var html = procesar('https://image.com/a.png').mensaje;
      assert.ok(html.indexOf('target="_blank"') !== -1);
      assert.ok(html.indexOf('rel="noopener noreferrer"') !== -1);
    });

    it('deberia escapar & del query string dentro del atributo src', function () {
      var html = procesar('https://cdn.com/a.jpg?w=1&h=2').mensaje;
      assert.ok(html.indexOf('src="https://cdn.com/a.jpg?w=1&amp;h=2"') !== -1);
    });

    it('deberia aceptar la URL aunque tenga espacios al inicio o al final', function () {
      assert.ok(procesar('   https://image.com/a.png  ').mensaje.indexOf('<img') !== -1);
    });
  });

});

describe('Validacion de URLs de Videos', function () {

  describe('is_valid_url_video acepta archivos de video', function () {
    [
      'https://www.w3schools.com/html/mov_bbb.mp4',
      'https://video.com/clip.webm',
      'http://video.com/clip.ogg',
      'https://video.com/clip.ogv',
      'https://video.com/clip.MOV',
      'https://video.com/clip.mp4?t=10'
    ].forEach(function (url) {
      it('deberia devolver true para ' + url, function () {
        assert.equal(val.is_valid_url_video(url), true);
      });
    });
  });

  describe('is_valid_url_video rechaza lo que no es video', function () {
    [
      'https://image.com/image.jpg',
      'https://video.com/clip.mp4.exe',
      'clip.mp4',
      'hola mundo'
    ].forEach(function (url) {
      it('deberia devolver false para "' + url + '"', function () {
        assert.equal(val.is_valid_url_video(url), false);
      });
    });
  });

  describe('is_valid_yt_video reconoce links de YouTube', function () {
    [
      ['https://www.youtube.com/watch?v=qYwlqx-JLok', 'qYwlqx-JLok'],
      ['https://youtube.com/watch?v=qYwlqx-JLok&t=30s', 'qYwlqx-JLok'],
      ['https://www.youtube.com/watch?list=PL123&v=dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
      ['https://youtu.be/dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
      ['https://m.youtube.com/watch?v=dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
      ['https://www.youtube.com/embed/dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
      ['https://www.youtube.com/shorts/aqz-KE-bpKQ', 'aqz-KE-bpKQ']
    ].forEach(function (caso) {
      it('deberia extraer el id ' + caso[1] + ' de ' + caso[0], function () {
        assert.equal(val.is_valid_yt_video(caso[0]), true);
        assert.equal(val.getYTVideoId(caso[0]), caso[1]);
      });
    });

    [
      'https://www.youtube.com/',
      'https://www.youtube.com/watch?v=corto',
      'https://vimeo.com/123456',
      'https://notyoutube.com/watch?v=dQw4w9WgXcQ'
    ].forEach(function (url) {
      it('deberia devolver false para ' + url, function () {
        assert.equal(val.is_valid_yt_video(url), false);
      });
    });
  });

  describe('el reproductor se integra en el chat', function () {
    it('deberia insertar un <video> con controles para un .mp4', function () {
      var html = procesar('https://www.w3schools.com/html/mov_bbb.mp4').mensaje;
      assert.ok(/^<video [^>]*controls/.test(html));
      assert.ok(html.indexOf('src="https://www.w3schools.com/html/mov_bbb.mp4"') !== -1);
    });

    it('deberia cargar solo los metadatos del video (preload="metadata")', function () {
      assert.ok(procesar('https://video.com/clip.webm').mensaje.indexOf('preload="metadata"') !== -1);
    });

    it('deberia insertar el reproductor de YouTube con la URL embed', function () {
      var html = procesar('https://youtu.be/dQw4w9WgXcQ').mensaje;
      assert.ok(html.indexOf('<iframe') !== -1);
      assert.ok(html.indexOf('src="https://www.youtube.com/embed/dQw4w9WgXcQ"') !== -1);
      assert.ok(html.indexOf('allowfullscreen') !== -1);
    });

    it('no deberia tratar una imagen como video', function () {
      assert.equal(procesar('https://image.com/a.png').mensaje.indexOf('<video'), -1);
    });
  });

});

describe('Prevencion de Inyeccion de Scripts', function () {

  describe('escapeHtml', function () {
    it('deberia escapar los 5 caracteres peligrosos de HTML', function () {
      assert.equal(val.escapeHtml('<>&"\''), '&lt;&gt;&amp;&quot;&#39;');
    });

    it('no deberia modificar texto normal', function () {
      assert.equal(val.escapeHtml('Hola, como estas?'), 'Hola, como estas?');
    });
  });

  describe('los ataques en el mensaje se bloquean', function () {
    [
      '<script>alert("xss")</script>',
      '<img src=x onerror=alert(1)>',
      '<svg onload=alert(1)>',
      '<iframe src="javascript:alert(1)"></iframe>',
      '<a href="javascript:alert(1)">click</a>',
      '<body onload=alert(1)>',
      '"><script>alert(1)</script>'
    ].forEach(function (ataque) {
      it('deberia escapar ' + ataque, function () {
        var html = procesar(ataque).mensaje;
        assert.equal(html.indexOf('<'), -1);
        assert.equal(html, val.escapeHtml(ataque));
      });
    });
  });

  describe('los ataques disfrazados de URL multimedia se bloquean', function () {
    [
      'http://x.com/a.jpg" onerror="alert(1)',
      'http://x.com/a.jpg"><script>alert(1)</script>',
      "http://x.com/a.jpg' onerror='alert(1)",
      'http://x.com/a.jpg` onerror=`alert(1)',
      'javascript:alert(1)//.jpg',
      'data:image/svg+xml;base64,PHN2ZyBvbmxvYWQ9YWxlcnQoMSk+.png',
      'http://x.com/video.mp4"><script>alert(1)</script>',
      'https://youtu.be/dQw4w9WgXcQ"><script>alert(1)</script>'
    ].forEach(function (ataque) {
      it('no deberia generar etiquetas para ' + ataque, function () {
        var html = procesar(ataque).mensaje;
        assert.equal(/<(img|video|iframe|script)/.test(html), false, html);
      });
    });
  });

  describe('los otros campos del mensaje tambien se protegen', function () {
    it('deberia escapar HTML en el nombre de usuario', function () {
      assert.equal(procesar('hola', '<img src=x onerror=alert(1)>').nombre, '&lt;img src=x onerror=alert(1)&gt;');
    });

    it('deberia reemplazar un color que no es hexadecimal', function () {
      assert.equal(procesar('hola', 'Ana', "red'><script>alert(1)</script>").color, '#000000');
    });

    it('deberia conservar un color hexadecimal valido', function () {
      assert.equal(procesar('hola', 'Ana', '#A1B2C3').color, '#A1B2C3');
    });

    it('deberia usar "Anonimo" si el nombre no es texto', function () {
      var msg = JSON.parse(val.validateMessage(JSON.stringify({ nombre: { x: 1 }, mensaje: 'hola', color: '#000000' })));
      assert.equal(msg.nombre, 'Anonimo');
    });
  });

  describe('las entradas malformadas no rompen el servidor', function () {
    it('deberia escapar un mensaje que no es JSON', function () {
      var msg = JSON.parse(val.validateMessage('<script>alert(1)</script>'));
      assert.equal(msg.mensaje, '&lt;script&gt;alert(1)&lt;/script&gt;');
    });

    it('deberia devolver mensaje vacio para null o no-string', function () {
      assert.equal(JSON.parse(val.validateMessage(null)).mensaje, '');
      assert.equal(JSON.parse(val.validateMessage(42)).mensaje, '');
    });

    it('deberia convertir un mensaje que no es texto en vacio', function () {
      var msg = JSON.parse(val.validateMessage(JSON.stringify({ nombre: 'Ana', mensaje: { tag: '<script>' }, color: '#000000' })));
      assert.equal(msg.mensaje, '');
    });
  });

});
