<?php
// Punto de extensión MVC: las clases de dominio están en models/ y el router público
// delega las operaciones. Se mantiene este archivo para que la estructura sea clara.
require_once __DIR__.'/../models/Usuario.php';
require_once __DIR__.'/../models/Producto.php';
require_once __DIR__.'/../models/Tienda.php';
class UsuarioController { public function __construct(public Usuario $modelo = new Usuario()) {} }
class ProductoController { public function __construct(public Producto $modelo = new Producto()) {} }
class CarritoController { public function __construct(public Tienda $modelo = new Tienda()) {} }
class CompraController { public function __construct(public Tienda $modelo = new Tienda()) {} }
class FavoritoController { public function __construct(public Tienda $modelo = new Tienda()) {} }
class TicketController {}
