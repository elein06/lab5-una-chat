var val = require('../libs/unalib');
var assert = require('assert');


describe('unalib', function(){


  describe('funcion is_valid_phone', function(){

    it('deberia devolver true para 8297-8547', function(){

      assert.equal(val.is_valid_phone('8297-8547'), true);

    });

    it('deberia devolver false para 8297p-8547', function(){

      assert.equal(val.is_valid_phone('8297p-8547'), false);

    });

  });


  describe('funcion is_valid_url_image', function(){

    it('deberia devolver true para http://image.com/image.jpg', function(){

      assert.equal(val.is_valid_url_image('http://image.com/image.jpg'), true);

    });

    it('deberia devolver true para http://image.com/image.gif', function(){

      assert.equal(val.is_valid_url_image('http://image.com/image.gif'), true);

    });
    
  });

  describe('funcion is_valid_yt_video', function(){

    it('deberia devolver true para https://www.youtube.com/watch?v=qYwlqx-JLok', function(){

      assert.equal(val.is_valid_yt_video('https://www.youtube.com/watch?v=qYwlqx-JLok'), true);

    });

    it('deberia devolver true para https://youtu.be/qYwlqx-JLok', function(){

      assert.equal(val.is_valid_yt_video('https://youtu.be/qYwlqx-JLok'), true);

    });

    it('deberia devolver false para http://image.com/image.jpg', function(){

      assert.equal(val.is_valid_yt_video('http://image.com/image.jpg'), false);

    });

  });

  describe('funcion is_valid_url_image (casos extra)', function(){

    it('deberia devolver true con query string', function(){

      assert.equal(val.is_valid_url_image('https://cdn.com/foto.png?w=200'), true);

    });

    it('deberia devolver false para texto normal', function(){

      assert.equal(val.is_valid_url_image('hola mundo'), false);

    });

    it('deberia devolver false si la URL contiene comillas', function(){

      assert.equal(val.is_valid_url_image('http://x.com/a.jpg" onerror="alert(1)'), false);

    });

  });

  describe('funcion is_valid_url_video', function(){

    it('deberia devolver true para https://video.com/clip.mp4', function(){

      assert.equal(val.is_valid_url_video('https://video.com/clip.mp4'), true);

    });

    it('deberia devolver true para https://video.com/clip.webm', function(){

      assert.equal(val.is_valid_url_video('https://video.com/clip.webm'), true);

    });

    it('deberia devolver false para http://image.com/image.jpg', function(){

      assert.equal(val.is_valid_url_video('http://image.com/image.jpg'), false);

    });

  });

  describe('funcion validateMessage', function(){

    function procesar(mensaje, nombre){
      return JSON.parse(val.validateMessage(JSON.stringify({ nombre: nombre || 'Ana', mensaje: mensaje, color: '#123ABC' })));
    }

    it('deberia convertir una URL de imagen en <img>', function(){

      assert.ok(procesar('http://image.com/image.jpg').mensaje.indexOf('<img') !== -1);

    });

    it('deberia convertir una URL de video en <video>', function(){

      assert.ok(procesar('https://video.com/clip.mp4').mensaje.indexOf('<video') !== -1);

    });

    it('deberia convertir un link de YouTube en <iframe>', function(){

      assert.ok(procesar('https://www.youtube.com/watch?v=qYwlqx-JLok').mensaje.indexOf('youtube.com/embed/qYwlqx-JLok') !== -1);

    });

    it('deberia escapar HTML en mensajes de texto', function(){

      assert.equal(procesar('<script>alert(1)</script>').mensaje, '&lt;script&gt;alert(1)&lt;/script&gt;');

    });

    it('deberia escapar HTML en el nombre', function(){

      assert.equal(procesar('hola', '<b>x</b>').nombre, '&lt;b&gt;x&lt;/b&gt;');

    });

  });

});







