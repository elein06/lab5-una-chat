// Escenarios BDD de seguridad (Snyk SNYK-JS-PROXYADDR-19812342 / CVE-2026-90711)
var express = require('express');
var http = require('http');
var assert = require('assert');

// levanta una app express con la lista de proxies confiables dada y
// devuelve el req.ip que calcula para una peticion con X-Forwarded-For
function obtenerIpDelCliente(trustProxy, xForwardedFor, callback) {
  var app = express();
  app.set('trust proxy', trustProxy);
  app.get('/ip', function (req, res) {
    res.send(req.ip);
  });

  var server = app.listen(0, '127.0.0.1', function () {
    var opciones = {
      host: '127.0.0.1',
      port: server.address().port,
      path: '/ip',
      headers: { 'X-Forwarded-For': xForwardedFor }
    };

    http.get(opciones, function (res) {
      var body = '';
      res.on('data', function (chunk) { body += chunk; });
      res.on('end', function () {
        server.close();
        callback(null, body);
      });
    }).on('error', function (e) {
      server.close();
      callback(e);
    });
  });
}

describe('Feature: Express no permite suplantar la IP del cliente', function () {

  context('Scenario: un atacante envia X-Forwarded-For falso', function () {

    var ipCalculada;

    // Given: el servidor solo confia en proxies de la red ::ffff:10.0.0.0/8
    // When: un cliente externo (127.0.0.1) envia "X-Forwarded-For: 6.6.6.6"
    before(function (done) {
      obtenerIpDelCliente('::ffff:10.0.0.0/8', '6.6.6.6', function (err, ip) {
        ipCalculada = ip;
        done(err);
      });
    });

    it('Then req.ip deberia ser la IP real del cliente y no la del header', function () {
      assert.notEqual(ipCalculada, '6.6.6.6');
      assert.ok(/127\.0\.0\.1$/.test(ipCalculada), 'IP calculada: ' + ipCalculada);
    });

  });

  context('Scenario: la peticion llega desde un proxy confiable', function () {

    var ipCalculada;

    // Given: el servidor confia en loopback como proxy
    // When: el proxy reenvia la IP del cliente original 203.0.113.5
    before(function (done) {
      obtenerIpDelCliente('loopback', '203.0.113.5', function (err, ip) {
        ipCalculada = ip;
        done(err);
      });
    });

    it('Then req.ip deberia ser la IP del cliente original', function () {
      assert.equal(ipCalculada, '203.0.113.5');
    });

  });

});
