package com.joedev.posweb.pep.services;

import com.joedev.posweb.pep.auth.DireccionRequest;
import com.joedev.posweb.pep.auth.SecurityUtils;
import com.joedev.posweb.pep.auth.UsuarioRequest;
import com.joedev.posweb.pep.auth.UsuarioResponse;
import com.joedev.posweb.pep.entity.Direccion;
import com.joedev.posweb.pep.entity.Usuario;
import com.joedev.posweb.pep.exception.ConflictoException;
import com.joedev.posweb.pep.exception.DatoInvalidoException;
import com.joedev.posweb.pep.exception.EntidadNoEncontradaException;
import com.joedev.posweb.pep.repository.DireccionRepository;
import com.joedev.posweb.pep.repository.UsuarioRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;

import java.util.List;

@ApplicationScoped
public class UsuarioService {

    @Inject
    UsuarioRepository repository;

    @Inject
    DireccionRepository direccionRepository;

    public List<UsuarioResponse> listarTodos() {
        return repository.listAll().stream().map(UsuarioResponse::from).toList();
    }

    public UsuarioResponse obtenerPorId(Integer id) {
        return UsuarioResponse.from(obtenerEntidad(id));
    }

    @Transactional
    public UsuarioResponse crear(UsuarioRequest request) {
        if (request.password() == null || request.password().isBlank()) {
            throw new DatoInvalidoException("La contraseña es obligatoria");
        }
        validarDuplicados(null, request);

        Usuario usuario = new Usuario();
        aplicar(usuario, request);
        usuario.setPassword(SecurityUtils.hash(request.password()));
        usuario.setActivo(request.activo() == null ? Boolean.TRUE : request.activo());

        repository.persistAndFlush(usuario);
        return UsuarioResponse.from(usuario);
    }

    @Transactional
    public UsuarioResponse actualizar(Integer id, UsuarioRequest request) {
        Usuario usuario = obtenerEntidad(id);
        validarDuplicados(id, request);
        aplicar(usuario, request);
        if (request.password() != null && !request.password().isBlank()) {
            usuario.setPassword(SecurityUtils.hash(request.password()));
        }
        repository.persistAndFlush(usuario);
        return UsuarioResponse.from(usuario);
    }

    @Transactional
    public void eliminar(Integer id) {
        if (!repository.deleteById(id)) {
            throw new EntidadNoEncontradaException("El usuario con id " + id + " no existe");
        }
    }

    @Transactional
    public UsuarioResponse cambiarEstado(Integer id, Boolean activo) {
        if (activo == null) {
            throw new DatoInvalidoException("El campo 'activo' es obligatorio");
        }
        Usuario usuario = obtenerEntidad(id);
        usuario.setActivo(activo);
        repository.persistAndFlush(usuario);
        return UsuarioResponse.from(usuario);
    }

    @Transactional
    public void restablecerPassword(Integer id, String password) {
        if (password == null || password.isBlank() || password.length() < 6) {
            throw new DatoInvalidoException("La contraseña debe tener al menos 6 caracteres");
        }
        Usuario usuario = obtenerEntidad(id);
        usuario.setPassword(SecurityUtils.hash(password));
        repository.persistAndFlush(usuario);
    }

    private Usuario obtenerEntidad(Integer id) {
        return repository.findByIdOptional(id)
                .orElseThrow(() -> new EntidadNoEncontradaException("El usuario con id " + id + " no existe"));
    }

    private void aplicar(Usuario usuario, UsuarioRequest request) {
        if (request.nombre() != null) usuario.setNombre(request.nombre());
        if (request.cedula() != null) usuario.setCedula(request.cedula());
        if (request.telefono() != null) usuario.setTelefono(request.telefono());
        if (request.correo() != null) usuario.setCorreo(request.correo());
        if (request.cargo() != null) usuario.setCargo(request.cargo());
        if (request.usuario() != null) usuario.setUsuario(request.usuario());
        if (request.rol() != null) usuario.setRol(request.rol());
        if (request.activo() != null) usuario.setActivo(request.activo());
        aplicarDireccion(usuario, request.direccion());
    }

    private void aplicarDireccion(Usuario usuario, DireccionRequest request) {
        if (request == null || usuario == null) {
            return;
        }
        if (esVacia(request)) {
            usuario.setDireccion(null);
            return;
        }

        Direccion direccion = usuario.getDireccion();
        if (direccion == null) {
            direccion = new Direccion();
            direccion.setActivo(true);
        }
        direccion.setCallePrincipal(blankToNull(request.callePrincipal()));
        direccion.setCalleSecundaria(blankToNull(request.calleSecundaria()));
        direccion.setCiudad(blankToNull(request.ciudad()));
        direccion.setSector(blankToNull(request.sector()));
        usuario.setDireccion(direccion);
        direccionRepository.persist(direccion);
    }

    private boolean esVacia(DireccionRequest request) {
        return esBlank(request.callePrincipal())
                && esBlank(request.calleSecundaria())
                && esBlank(request.ciudad())
                && esBlank(request.sector());
    }

    private boolean esBlank(String valor) {
        return valor == null || valor.isBlank();
    }

    private String blankToNull(String valor) {
        return esBlank(valor) ? null : valor.trim();
    }

    private void validarDuplicados(Integer exceptoId, UsuarioRequest request) {
        if (request.correo() != null && !request.correo().isBlank()) {
            boolean existe = repository.find("correo = ?1", request.correo())
                    .firstResultOptional()
                    .filter(u -> !u.getId().equals(exceptoId))
                    .isPresent();
            if (existe) {
                throw new ConflictoException("Ya existe un usuario con el correo " + request.correo());
            }
        }
        if (request.usuario() != null && !request.usuario().isBlank()) {
            boolean existe = repository.find("usuario = ?1", request.usuario())
                    .firstResultOptional()
                    .filter(u -> !u.getId().equals(exceptoId))
                    .isPresent();
            if (existe) {
                throw new ConflictoException("El nombre de usuario '" + request.usuario() + "' ya está en uso");
            }
        }
    }
}