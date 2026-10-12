(function () {
    var API = "/api";
    var TOKEN_KEY = "visor-pos-token";
    var PROFILE_KEY = "visor-pos-perfiles";
    var ACTIVE_PROFILE_KEY = "visor-pos-perfil-activo";
    var token = null;
    var categorias = [];
    var categoriaIds = [];
    var perfiles = [];
    var perfilActivoId = "";
    var perfilInicioId = "";
    var pedidosAnteriores = null;
    var cargando = false;
    var actualizarPendiente = false;
    var audioContext = null;
    var fuenteEventos = null;
    var reconexionEventos = null;
    var eventosAbiertosAntes = false;

    function porId(id) {
        return document.getElementById(id);
    }

    function prepararAudio() {
        try {
            if (!audioContext) {
                audioContext = window.AudioContext ? new window.AudioContext() : (window.webkitAudioContext ? new window.webkitAudioContext() : null);
            }
            if (audioContext && audioContext.state === "suspended" && audioContext.resume) {
                audioContext.resume();
            }
        } catch (error) {
            mostrarMensaje("No se pudo habilitar el audio en este navegador.", true);
        }
    }

    function crear(nombre, clase, texto) {
        var nodo = document.createElement(nombre);
        if (clase) {
            nodo.className = clase;
        }
        if (typeof texto !== "undefined" && texto !== null) {
            nodo.textContent = texto;
        }
        return nodo;
    }

    function textoError(error) {
        if (error && error.message) {
            return error.message;
        }
        return "Ocurrió un error inesperado.";
    }

    function esErrorAutorizacion(error) {
        return !!(error && error.message &&
            (error.message.indexOf("sesión expiró") !== -1 || error.message.indexOf("permiso") !== -1));
    }

    function leerJson(texto) {
        try {
            return JSON.parse(texto);
        } catch (error) {
            return null;
        }
    }

    function mostrarConexion(texto, clase) {
        var estado = porId("estado-conexion");
        estado.className = "estado-conexion " + (clase || "");
        estado.textContent = texto;
    }

    function mostrarMensaje(texto, error) {
        var mensaje = porId("mensaje-visor");
        mensaje.textContent = texto || "";
        mensaje.className = error ? "mensaje-visor mensaje-error" : "mensaje-visor";
    }

    function peticion(metodo, ruta, cuerpo, callback) {
        var xhr = new XMLHttpRequest();
        var terminada = false;
        xhr.open(metodo, API + ruta, true);
        xhr.setRequestHeader("Accept", "application/json");
        if (token) {
            xhr.setRequestHeader("Authorization", "Bearer " + token);
        }
        if (cuerpo) {
            xhr.setRequestHeader("Content-Type", "application/json");
        }
        xhr.onreadystatechange = function () {
            var respuesta;
            if (xhr.readyState !== 4) {
                return;
            }
            if (terminada) {
                return;
            }
            terminada = true;
            respuesta = leerJson(xhr.responseText);
            if (xhr.status >= 200 && xhr.status < 300) {
                if (xhr.responseText && respuesta === null) {
                    callback(new Error("El servidor devolvió una respuesta JSON inválida."));
                    return;
                }
                callback(null, respuesta);
                return;
            }
            if (xhr.status === 401 || xhr.status === 403) {
                callback(new Error("La sesión expiró o no tiene permiso. Ingresa de nuevo."));
                return;
            }
            callback(new Error(respuesta && respuesta.message ? respuesta.message : "Error HTTP " + xhr.status));
        };
        xhr.onerror = function () {
            if (terminada) {
                return;
            }
            terminada = true;
            callback(new Error("No se pudo conectar con el servidor. Comprueba la red local."));
        };
        xhr.ontimeout = function () {
            if (terminada) {
                return;
            }
            terminada = true;
            callback(new Error("La solicitud tardó demasiado. Se volverá a intentar."));
        };
        xhr.timeout = 8000;
        xhr.send(cuerpo ? JSON.stringify(cuerpo) : null);
    }

    function mostrarLogin(mensaje) {
        porId("login-panel").className = "panel login-panel";
        porId("visor-panel").className = "visor-panel oculto";
        porId("error-login").textContent = mensaje || "";
        mostrarConexion("Sin sesión", "desconectado");
    }

    function iniciarSesion(evento) {
        var usuario;
        var contrasena;
        if (evento && evento.preventDefault) {
            evento.preventDefault();
        }
        prepararAudio();
        usuario = porId("usuario").value.replace(/^\s+|\s+$/g, "");
        contrasena = porId("contrasena").value;
        porId("error-login").textContent = "";
        peticion("POST", "/auth/login", {
            email: usuario,
            password: contrasena
        }, function (error, respuesta) {
            if (error) {
                porId("error-login").textContent = textoError(error);
                return;
            }
            if (!respuesta || !respuesta.token) {
                porId("error-login").textContent = "El servidor no devolvió una sesión válida.";
                return;
            }
            token = respuesta.token;
            try {
                window.localStorage.setItem(TOKEN_KEY, token);
            } catch (storageError) {
                porId("error-login").textContent = "No se pudo guardar la sesión en este navegador.";
                token = null;
                return;
            }
            porId("contrasena").value = "";
            iniciarVisor();
        });
    }

    function cerrarEventos() {
        if (reconexionEventos) {
            window.clearTimeout(reconexionEventos);
            reconexionEventos = null;
        }
        if (fuenteEventos) {
            fuenteEventos.close();
            fuenteEventos = null;
        }
    }

    function conectarEventos() {
        var datos;
        cerrarEventos();
        if (!token || !window.EventSource) {
            return;
        }
        fuenteEventos = new window.EventSource(API + "/stream?token=" + encodeURIComponent(token));
        fuenteEventos.onopen = function () {
            if (eventosAbiertosAntes) {
                actualizarPedidos();
            }
            eventosAbiertosAntes = true;
        };
        fuenteEventos.onmessage = function (evento) {
            datos = leerJson(evento.data);
            if (datos && datos.type && datos.type.indexOf("pedido:") === 0) {
                actualizarPedidos();
            }
        };
        fuenteEventos.onerror = function () {
            cerrarEventos();
            reconexionEventos = window.setTimeout(conectarEventos, 3000);
        };
    }

    function cerrarSesion() {
        cerrarEventos();
        token = null;
        try {
            window.localStorage.removeItem(TOKEN_KEY);
        } catch (error) {
            mostrarMensaje("No se pudo borrar el token guardado. Cierra esta pestaña si el problema continúa.", true);
        }
        mostrarLogin("");
    }

    function cargarPerfiles() {
        try {
            perfiles = leerJson(window.localStorage.getItem(PROFILE_KEY) || "[]") || [];
            perfilInicioId = window.localStorage.getItem(ACTIVE_PROFILE_KEY) || "";
            if (!perfiles || Object.prototype.toString.call(perfiles) !== "[object Array]") {
                perfiles = [];
            }
        } catch (error) {
            perfiles = [];
            mostrarMensaje("No se pudieron leer los perfiles guardados en este navegador.", true);
        }
    }

    function guardarPerfiles() {
        try {
            window.localStorage.setItem(PROFILE_KEY, JSON.stringify(perfiles));
            return true;
        } catch (error) {
            mostrarMensaje("No se pudo guardar el perfil. Revisa el espacio disponible del navegador.", true);
            return false;
        }
    }

    function mostrarPerfiles() {
        var selector = porId("perfil-guardado");
        var i;
        var opcion;
        while (selector.options.length > 1) {
            selector.remove(1);
        }
        for (i = 0; i < perfiles.length; i += 1) {
            opcion = document.createElement("option");
            opcion.value = perfiles[i].id;
            opcion.textContent = perfiles[i].nombre;
            selector.appendChild(opcion);
        }
        selector.value = perfilActivoId;
    }

    function dibujarCategorias() {
        var contenedor = porId("categorias");
        var i;
        var boton;
        var seleccionada;
        contenedor.textContent = "";
        if (!categorias.length) {
            contenedor.appendChild(crear("span", "mensaje-visor", "No hay categorías disponibles."));
            return;
        }
        for (i = 0; i < categorias.length; i += 1) {
            seleccionada = categoriaIds.indexOf(categorias[i].id) !== -1;
            boton = crear("button", "categoria" + (seleccionada ? " seleccionada" : ""), nombreCompletoCategoria(categorias[i]));
            boton.type = "button";
            boton.setAttribute("data-categoria-id", categorias[i].id);
            boton.setAttribute("aria-pressed", seleccionada ? "true" : "false");
            boton.addEventListener("click", alternarCategoria);
            contenedor.appendChild(boton);
        }
    }

    function nombreCompletoCategoria(categoria) {
        if (categoria.categoriaPadre && categoria.categoriaPadre.nombre) {
            return categoria.categoriaPadre.nombre + " › " + categoria.nombre;
        }
        return categoria.nombre;
    }

    function alternarCategoria(evento) {
        var id = parseInt(evento.currentTarget.getAttribute("data-categoria-id"), 10);
        var indice = categoriaIds.indexOf(id);
        if (indice === -1) {
            categoriaIds.push(id);
        } else {
            categoriaIds.splice(indice, 1);
        }
        perfilActivoId = "";
        perfilInicioId = "";
        try {
            window.localStorage.removeItem(ACTIVE_PROFILE_KEY);
        } catch (error) {
            mostrarMensaje("El perfil se eliminó, pero no se pudo borrar la selección recordada.", true);
        }
        porId("perfil-guardado").value = "";
        dibujarCategorias();
        actualizarPedidos();
    }

    function seleccionarTodasCategorias() {
        var i;
        categoriaIds = [];
        for (i = 0; i < categorias.length; i += 1) {
            categoriaIds.push(categorias[i].id);
        }
        perfilActivoId = "";
        porId("perfil-guardado").value = "";
        dibujarCategorias();
        actualizarPedidos();
    }

    function quitarTodasCategorias() {
        categoriaIds = [];
        perfilActivoId = "";
        porId("perfil-guardado").value = "";
        dibujarCategorias();
        dibujarPedidos([]);
        porId("ultima-actualizacion").textContent = "Selecciona al menos una categoría";
    }

    function cargarCategorias(callback) {
        peticion("GET", "/categorias-plato/activos", null, function (error, datos) {
            var i;
            if (error) {
                mostrarMensaje("No se pudieron cargar las categorías. " + textoError(error), true);
                if (esErrorAutorizacion(error)) {
                    cerrarSesion();
                }
                callback();
                return;
            }
            categorias = datos && Object.prototype.toString.call(datos) === "[object Array]" ? datos : [];
            if (!categoriaIds.length) {
                for (i = 0; i < categorias.length; i += 1) {
                    categoriaIds.push(categorias[i].id);
                }
            }
            dibujarCategorias();
            callback();
        });
    }

    function aplicarPerfil(id) {
        var i;
        var perfil = null;
        for (i = 0; i < perfiles.length; i += 1) {
            if (perfiles[i].id === id) {
                perfil = perfiles[i];
                break;
            }
        }
        if (!perfil) {
            perfilActivoId = "";
            return;
        }
        perfilActivoId = perfil.id;
        porId("nombre-perfil").value = perfil.nombre;
        categoriaIds = perfil.categoriaIds.slice(0);
        porId("mostrar-mesa").checked = perfil.mostrarMesa !== false;
        porId("mostrar-comentario").checked = perfil.mostrarComentario !== false;
        porId("sonido-activo").checked = perfil.sonido !== false;
        dibujarCategorias();
        actualizarPedidos();
    }

    function guardarPerfil() {
        var nombre = porId("nombre-perfil").value.replace(/^\s+|\s+$/g, "");
        var perfil = {
            id: perfilActivoId || String(new Date().getTime()),
            nombre: nombre,
            categoriaIds: categoriaIds.slice(0),
            mostrarMesa: porId("mostrar-mesa").checked,
            mostrarComentario: porId("mostrar-comentario").checked,
            sonido: porId("sonido-activo").checked
        };
        var i;
        if (!nombre) {
            mostrarMensaje("Escribe un nombre para guardar el perfil.", true);
            porId("nombre-perfil").focus();
            return;
        }
        for (i = 0; i < perfiles.length; i += 1) {
            if (perfiles[i].id === perfil.id) {
                perfiles[i] = perfil;
                break;
            }
        }
        if (i === perfiles.length) {
            perfiles.push(perfil);
        }
        if (!guardarPerfiles()) {
            return;
        }
        perfilActivoId = perfil.id;
        try {
            window.localStorage.setItem(ACTIVE_PROFILE_KEY, perfilActivoId);
        } catch (error) {
            mostrarMensaje("El perfil se guardó, pero no se pudo recordar como el último usado.", true);
        }
        mostrarPerfiles();
        mostrarMensaje("Perfil guardado en este iPad.", false);
        actualizarPedidos();
    }

    function eliminarPerfil() {
        var i;
        if (!perfilActivoId) {
            mostrarMensaje("Selecciona primero un perfil guardado.", true);
            return;
        }
        if (!window.confirm("¿Eliminar este perfil guardado de este iPad?")) {
            return;
        }
        for (i = 0; i < perfiles.length; i += 1) {
            if (perfiles[i].id === perfilActivoId) {
                perfiles.splice(i, 1);
                break;
            }
        }
        if (!guardarPerfiles()) {
            return;
        }
        perfilActivoId = "";
        porId("perfil-guardado").value = "";
        porId("nombre-perfil").value = "";
        categoriaIds = [];
        dibujarCategorias();
        mostrarPerfiles();
        actualizarPedidos();
    }

    function categoriaIncluida(plato) {
        var categoria;
        var padre;
        if (!plato || !plato.idCategoria) {
            return false;
        }
        categoria = plato.idCategoria;
        if (categoriaIds.indexOf(categoria.id) !== -1) {
            return true;
        }
        padre = categoria.categoriaPadre;
        return !!(padre && categoriaIds.indexOf(padre.id) !== -1);
    }

    function fechaPedido(pedido) {
        var fecha = pedido && pedido.fecha ? new Date(pedido.fecha) : new Date();
        if (isNaN(fecha.getTime())) {
            return new Date();
        }
        return fecha;
    }

    function dosDigitos(valor) {
        return valor < 10 ? "0" + valor : String(valor);
    }

    function horaTexto(fecha) {
        return dosDigitos(fecha.getHours()) + ":" + dosDigitos(fecha.getMinutes());
    }

    function minutosEspera(fecha) {
        return Math.max(0, Math.floor((new Date().getTime() - fecha.getTime()) / 60000));
    }

    function reproducirSonido() {
        var contexto;
        var oscilador;
        var ganancia;
        try {
            if (!porId("sonido-activo").checked) {
                return;
            }
            contexto = audioContext;
            if (!contexto) {
                contexto = window.AudioContext ? new window.AudioContext() : (window.webkitAudioContext ? new window.webkitAudioContext() : null);
                audioContext = contexto;
            }
            if (!contexto) {
                mostrarMensaje("Este navegador no permite generar alertas sonoras.", true);
                return;
            }
            if (contexto.state === "suspended" && contexto.resume) {
                contexto.resume();
            }
            oscilador = contexto.createOscillator();
            ganancia = contexto.createGain();
            oscilador.type = "sine";
            oscilador.frequency.value = 880;
            ganancia.gain.value = 0.12;
            oscilador.connect(ganancia);
            ganancia.connect(contexto.destination);
            oscilador.start(0);
            ganancia.gain.setValueAtTime(0.12, contexto.currentTime);
            ganancia.gain.exponentialRampToValueAtTime(0.001, contexto.currentTime + 0.6);
            oscilador.stop(contexto.currentTime + 0.6);
        } catch (error) {
            mostrarMensaje("No se pudo reproducir el sonido. Toca «Probar sonido» y revisa el volumen del iPad.", true);
        }
    }

    function etiquetaServicio(pedido) {
        if (pedido.tipoServicio === "LLEVAR") {
            return "Para llevar";
        }
        if (pedido.tipoServicio === "DELIVERY") {
            return "Delivery";
        }
        if (pedido.tipoServicio === "APLICACION") {
            return "Aplicación";
        }
        if (pedido.numMesa !== null && typeof pedido.numMesa !== "undefined") {
            return "Mesa " + pedido.numMesa;
        }
        return "Mesa";
    }

    function listaPlatos(items) {
        var lista = crear("ul", "platos-pedido");
        var i;
        var detalle;
        var fila;
        for (i = 0; i < items.length; i += 1) {
            detalle = items[i];
            fila = crear("li", "plato-pedido");
            fila.appendChild(crear("span", "cantidad-plato", (detalle.cantidad || 1) + "×"));
            fila.appendChild(crear("span", "", detalle.idPlato && detalle.idPlato.nombre ? detalle.idPlato.nombre : "Plato"));
            lista.appendChild(fila);
        }
        return lista;
    }

    function tarjetaPedido(pedido, detalles) {
        var tarjeta = crear("article", "tarjeta-pedido");
        var cabecera = crear("div", "cabecera-pedido");
        var numero = crear("span", "numero-pedido tipo-pedido", etiquetaServicio(pedido));
        var hora = crear("span", "hora-pedido");
        var fecha = fechaPedido(pedido);
        var espera = minutosEspera(fecha);
        var itemsMesa = [];
        var itemsLlevar = [];
        var separador;
        var i;
        var comentario;
        var pie;
        var botonListo;

        if (espera >= 15) {
            tarjeta.className += " espera-larga";
        } else if (espera >= 8) {
            tarjeta.className += " espera-media";
        }
        hora.textContent = horaTexto(fecha) + " · " + espera + " min";
        cabecera.appendChild(numero);
        cabecera.appendChild(hora);
        tarjeta.appendChild(cabecera);
        tarjeta.appendChild(crear("p", "id-pedido", "Pedido #" + pedido.id));
        for (i = 0; i < detalles.length; i += 1) {
            if (detalles[i].paraLlevar) {
                itemsLlevar.push(detalles[i]);
            } else {
                itemsMesa.push(detalles[i]);
            }
        }
        if (itemsMesa.length > 0) {
            tarjeta.appendChild(listaPlatos(itemsMesa));
        }
        if (itemsMesa.length > 0 && itemsLlevar.length > 0) {
            separador = crear("div", "separador-llevar");
            separador.appendChild(crear("span", "", "Para llevar"));
            tarjeta.appendChild(separador);
        }
        if (itemsLlevar.length > 0) {
            tarjeta.appendChild(listaPlatos(itemsLlevar));
        }
        if (porId("mostrar-comentario").checked && pedido.comentario) {
            comentario = crear("p", "comentario-pedido", pedido.comentario);
            tarjeta.appendChild(comentario);
        }
        pie = crear("div", "pie-pedido");
        pie.appendChild(crear("span", "total-pedido", "Total " + dinero(pedido.total)));
        botonListo = crear("button", "boton-listo", "Pedido listo");
        botonListo.type = "button";
        botonListo.onclick = function () {
            marcarListo(pedido, botonListo);
        };
        pie.appendChild(botonListo);
        tarjeta.appendChild(pie);
        return tarjeta;
    }

    function dinero(valor) {
        var numero = Number(valor);
        if (isNaN(numero)) {
            numero = 0;
        }
        return "$" + numero.toFixed(2);
    }

    function marcarListo(pedido, boton) {
        boton.disabled = true;
        boton.textContent = "Enviando…";
        peticion("PATCH", "/pedidos/" + pedido.id + "/estado", { estadoPedido: "ENTREGADO" }, function (error) {
            if (error) {
                boton.disabled = false;
                boton.textContent = "Pedido listo";
                mostrarMensaje("Pedido #" + pedido.id + ": " + textoError(error), true);
                if (esErrorAutorizacion(error)) {
                    cerrarSesion();
                }
                return;
            }
            actualizarPedidos();
        });
    }

    function dibujarPedidos(tarjetas) {
        var contenedor = porId("lista-pedidos");
        var i;
        contenedor.textContent = "";
        if (!tarjetas.length) {
            contenedor.appendChild(crear("div", "vacio", "No hay pedidos pendientes para las categorías seleccionadas."));
            return;
        }
        for (i = 0; i < tarjetas.length; i += 1) {
            contenedor.appendChild(tarjetaPedido(tarjetas[i].pedido, tarjetas[i].detalles));
        }
    }

    function finalizarCarga(tarjetas, nuevos, errorCarga) {
        var siguiente;
        dibujarPedidos(tarjetas);
        porId("ultima-actualizacion").textContent = "Actualizado " + horaTexto(new Date());
        if (errorCarga) {
            mostrarConexion("Datos incompletos", "desconectado");
            mostrarMensaje(errorCarga, true);
        } else {
            mostrarConexion("Conectado", "conectado");
            mostrarMensaje("", false);
        }
        if (nuevos) {
            reproducirSonido();
        }
        cargando = false;
        if (actualizarPendiente) {
            actualizarPendiente = false;
            siguiente = window.setTimeout(actualizarPedidos, 10);
        }
    }

    function cargarDetalles(pedidos, callback) {
        var tarjetas = [];
        var pendientes = pedidos.length;
        var i;
        var pedido;
        var nuevos = false;
        var errores = [];
        var idsActuales = {};
        var callbackOriginal = callback;
        callback = function (lista, sonar, errorCarga) {
            pedidosAnteriores = idsActuales;
            callbackOriginal(lista, sonar, errorCarga);
        };
        if (!pendientes) {
            callback([], false, "");
            return;
        }
        for (i = 0; i < pedidos.length; i += 1) {
            pedido = pedidos[i];
            idsActuales[String(pedido.id)] = true;
            (function (pedidoActual) {
                peticion("GET", "/pedidos/" + pedidoActual.id + "/detalles", null, function (error, detalles) {
                    var platos;
                    var seleccionados = [];
                    var j;
                    if (error) {
                        pendientes -= 1;
                        errores.push("Pedido #" + pedidoActual.id + ": " + textoError(error));
                        if (esErrorAutorizacion(error)) {
                            cerrarSesion();
                        }
                        if (!pendientes) {
                            callback(tarjetas, nuevos, errores.join(" "));
                        }
                        return;
                    }
                    platos = detalles && Object.prototype.toString.call(detalles) === "[object Array]" ? detalles : [];
                    seleccionados = [];
                    for (j = 0; j < platos.length; j += 1) {
                        if (categoriaIncluida(platos[j].idPlato)) {
                            seleccionados.push(platos[j]);
                        }
                    }
                    if (seleccionados.length) {
                        tarjetas.push({ pedido: pedidoActual, detalles: seleccionados });
                        if (pedidosAnteriores !== null && !pedidosAnteriores[String(pedidoActual.id)]) {
                            nuevos = true;
                        }
                    }
                    pendientes -= 1;
                    if (!pendientes) {
                        callback(tarjetas, nuevos, errores.join(" "));
                    }
                });
            }(pedido));
        }
    }

    function actualizarPedidos() {
        if (!token) {
            return;
        }
        if (cargando) {
            actualizarPendiente = true;
            return;
        }
        if (!categoriaIds.length) {
            dibujarPedidos([]);
            porId("ultima-actualizacion").textContent = "Selecciona al menos una categoría";
            cargando = false;
            return;
        }
        cargando = true;
        peticion("GET", "/pedidos", null, function (error, datos) {
            var pedidos = [];
            var i;
            if (error) {
                cargando = false;
                mostrarConexion("Sin conexión", "desconectado");
                mostrarMensaje(textoError(error), true);
                if (esErrorAutorizacion(error)) {
                    cerrarSesion();
                }
                return;
            }
            datos = datos && Object.prototype.toString.call(datos) === "[object Array]" ? datos : [];
            for (i = 0; i < datos.length; i += 1) {
                if (datos[i].estadoPedido === "PENDIENTE") {
                    pedidos.push(datos[i]);
                }
            }
            cargarDetalles(pedidos, finalizarCarga);
        });
    }

    function iniciarVisor() {
        porId("login-panel").className = "panel login-panel oculto";
        porId("visor-panel").className = "visor-panel";
        cargarPerfiles();
        mostrarPerfiles();
        eventosAbiertosAntes = false;
        conectarEventos();
        cargarCategorias(function () {
            if (perfilInicioId) {
                aplicarPerfil(perfilInicioId);
            }
            actualizarPedidos();
        });
    }

    function elementoNativoPantallaCompleta() {
        return document.fullscreenElement || document.webkitFullscreenElement || null;
    }

    function actualizarBotonPantalla() {
        var activa = document.body.className.indexOf("pantalla-completa") !== -1;
        porId("pantalla-completa").textContent = activa ? "Salir de pantalla completa" : "En pantalla completa";
    }

    function alternarPantallaCompleta() {
        var raiz = document.documentElement;
        var activa = document.body.className.indexOf("pantalla-completa") !== -1;
        prepararAudio();
        if (activa) {
            document.body.className = document.body.className.replace(/\s*pantalla-completa/g, "");
            try {
                if (elementoNativoPantallaCompleta()) {
                    if (document.exitFullscreen) {
                        document.exitFullscreen();
                    } else if (document.webkitExitFullscreen) {
                        document.webkitExitFullscreen();
                    }
                }
            } catch (error) {
                mostrarMensaje("No se pudo salir del modo nativo. Toca la pantalla o recarga la página.", true);
            }
        } else {
            document.body.className += " pantalla-completa";
            try {
                if (raiz.requestFullscreen) {
                    raiz.requestFullscreen();
                } else if (raiz.webkitRequestFullscreen) {
                    raiz.webkitRequestFullscreen();
                }
            } catch (error) {
                mostrarMensaje("Este navegador no permite pantalla completa nativa. Para ocultar la barra de Safari, usa Compartir › Añadir a pantalla de inicio.", false);
            }
        }
        actualizarBotonPantalla();
    }

    function iniciar() {
        porId("pantalla-completa").addEventListener("click", alternarPantallaCompleta);
        document.addEventListener("webkitfullscreenchange", function () {
            if (!elementoNativoPantallaCompleta()) {
                document.body.className = document.body.className.replace(/\s*pantalla-completa/g, "");
                actualizarBotonPantalla();
            }
        });
        porId("form-login").addEventListener("submit", iniciarSesion);
        porId("guardar-perfil").addEventListener("click", guardarPerfil);
        porId("eliminar-perfil").addEventListener("click", eliminarPerfil);
        porId("cerrar-sesion").addEventListener("click", cerrarSesion);
        porId("probar-sonido").addEventListener("click", reproducirSonido);
        porId("todas-categorias").addEventListener("click", seleccionarTodasCategorias);
        porId("ninguna-categoria").addEventListener("click", quitarTodasCategorias);
        porId("perfil-guardado").addEventListener("change", function () {
            aplicarPerfil(porId("perfil-guardado").value);
        });
        porId("mostrar-mesa").addEventListener("change", actualizarPedidos);
        porId("mostrar-comentario").addEventListener("change", actualizarPedidos);
        porId("sonido-activo").addEventListener("change", function () {
            if (porId("sonido-activo").checked) {
                reproducirSonido();
            }
        });
        document.addEventListener("touchstart", prepararAudio);
        document.addEventListener("click", prepararAudio);
        try {
            token = window.localStorage.getItem(TOKEN_KEY);
        } catch (error) {
            token = null;
            mostrarMensaje("El navegador no permite guardar una sesión. Habilita almacenamiento local para este sitio.", true);
        }
        if (token) {
            iniciarVisor();
        } else {
            mostrarLogin("");
        }
        // Respaldo por si Safari corta la conexión de eventos en segundo plano
        window.setInterval(actualizarPedidos, 30000);
        window.addEventListener("focus", function () {
            actualizarPedidos();
        });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", iniciar);
    } else {
        iniciar();
    }
}());
