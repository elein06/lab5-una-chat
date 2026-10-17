// modulo de ejemplo.

// caracteres permitidos en una URL (sin espacios, comillas ni < >)
var URL_CHARS = "[^\\s\"'<>`]";

module.exports = {


    // logica que valida si un telefono esta correcto...
    is_valid_phone: function (phone) {
      // inicializacion lazy
      var isValid = false;
      // expresion regular copiada de StackOverflow
      var re = /^[+]*[(]{0,1}[0-9]{1,4}[)]{0,1}[-\s\./0-9]*$/i;

      // validacion Regex
      try {
        isValid = re.test(phone);
      } catch (e) {
        console.log(e);
      } finally {
          return isValid;
      }
      // fin del try-catch block
    },

    // URL http(s) que termina en una extension de imagen (permite query string)
    is_valid_url_image: function (url) {

      // inicializacion lazy
      var isValid = false;
      var re = new RegExp("^https?://" + URL_CHARS + "+\\.(?:jpg|jpeg|png|gif|bmp|webp|svg)(?:[?#]" + URL_CHARS + "*)?$", "i");

      // validacion Regex
      try {
        isValid = re.test(url);
      } catch (e) {
        console.log(e);
      } finally {
          return isValid;
      }
      // fin del try-catch block
    },

    // URL http(s) que apunta directo a un archivo de video
    is_valid_url_video: function (url) {

      // inicializacion lazy
      var isValid = false;
      var re = new RegExp("^https?://" + URL_CHARS + "+\\.(?:mp4|webm|ogg|ogv|mov)(?:[?#]" + URL_CHARS + "*)?$", "i");

      // validacion Regex
      try {
        isValid = re.test(url);
      } catch (e) {
        console.log(e);
      } finally {
          return isValid;
      }
      // fin del try-catch block
    },

    is_valid_yt_video: function (url) {

      // inicializacion lazy
      var isValid = false;

      // validacion Regex
      try {
        isValid = this.getYTVideoId(url) !== null;
      } catch (e) {
        console.log(e);
      } finally {
          return isValid;
      }
      // fin del try-catch block
    },

    // devuelve el id de 11 caracteres del video o null
    getYTVideoId: function(url){
      if (typeof url !== 'string') {
        return null;
      }
      var re = /^(?:https?:\/\/)?(?:www\.|m\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|shorts\/|watch\?(?:[^\s#]*&)?v=))([\w-]{11})(?:[?&#][^\s"'<>`]*)?$/i;
      var match = url.match(re);
      return match ? match[1] : null;
    },

    // escapa caracteres especiales para evitar inyeccion de HTML (XSS)
    escapeHtml: function(text){
      return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    },

    getEmbeddedCode: function (url){
      var id = this.getYTVideoId(url);
      var code = '<iframe class="chat-media" width="560" height="315" src="https://www.youtube.com/embed/'+id+ '" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>';
      return code;
    },

    getImageTag: function(url){
      var safeUrl = this.escapeHtml(url);
      var tag = '<a href="'+safeUrl+'" target="_blank" rel="noopener noreferrer"><img class="chat-media" src="'+safeUrl+'" alt="imagen"></a>';
      return tag;
    },

    getVideoTag: function(url){
      var tag = '<video class="chat-media" controls preload="metadata" src="'+this.escapeHtml(url)+'">Su navegador no soporta video.</video>';
      return tag;
    },

    validateMessage: function(msg){
      // Handle invalid input
      if (!msg || typeof msg !== 'string') {
        return JSON.stringify({ mensaje: '' });
      }

      try {
        var obj = JSON.parse(msg);
        var texto = typeof obj.mensaje === 'string' ? obj.mensaje.trim() : '';

        // el nombre y el color tambien se insertan como HTML en el cliente
        obj.nombre = this.escapeHtml(typeof obj.nombre === 'string' ? obj.nombre : 'Anonimo');
        obj.color = /^#[0-9a-f]{6}$/i.test(obj.color) ? obj.color : '#000000';

      if(this.is_valid_url_image(texto)){
        console.log("Es una imagen!")
        obj.mensaje = this.getImageTag(texto);
      }
      else if(this.is_valid_yt_video(texto)){
        console.log("Es un video de YouTube!")
        obj.mensaje = this.getEmbeddedCode(texto);
      }
      else if(this.is_valid_url_video(texto)){
        console.log("Es un video!")
        obj.mensaje = this.getVideoTag(texto);
      }
      else{
        console.log("Es un texto!")
        obj.mensaje = this.escapeHtml(texto);
      }

      return JSON.stringify(obj);
      } catch (e) {
        console.log('Error processing message:', e);
        return JSON.stringify({ mensaje: this.escapeHtml(msg) }); // Return original message on error
      }
    }

  // fin del modulo
  };
