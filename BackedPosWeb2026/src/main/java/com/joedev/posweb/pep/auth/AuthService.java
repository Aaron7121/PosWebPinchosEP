package com.joedev.posweb.pep.auth;

import com.joedev.posweb.pep.entity.Usuario;
import com.joedev.posweb.pep.exception.CredencialesInvalidasException;
import com.joedev.posweb.pep.exception.ConflictoException;
import com.joedev.posweb.pep.repository.UsuarioRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;

@ApplicationScoped
public class AuthService {

    @Inject
    UsuarioRepository usuarioRepository;

    @Inject
    JwtService jwtService;

    public AuthResponse login(LoginRequest request) {
        Usuario usuario = usuarioRepository
                .find("correo = ?1 OR usuario = ?1", request.email())
                .firstResultOptional()
                .orElseThrow(() -> new CredencialesInvalidasException("Correo, usuario o contraseña incorrectos"));

        if (!SecurityUtils.verificar(request.password(), usuario.getPassword())) {
            throw new CredencialesInvalidasException("Correo, usuario o contraseña incorrectos");
        }
        if (Boolean.FALSE.equals(usuario.getActivo())) {
            throw new CredencialesInvalidasException("La cuenta está inactiva");
        }

        return new AuthResponse(jwtService.generarToken(usuario), UserResponse.from(usuario));
    }

    @Transactional
    public UserResponse register(RegisterRequest request) {
        if (usuarioRepository.find("correo", request.correo()).firstResultOptional().isPresent()) {
            throw new ConflictoException("Ya existe un usuario con el correo " + request.correo());
        }
        if (usuarioRepository.find("usuario", request.usuario()).firstResultOptional().isPresent()) {
            throw new ConflictoException("El nombre de usuario '" + request.usuario() + "' ya está en uso");
        }

        Usuario usuario = new Usuario();
        usuario.setNombre(request.nombre());
        usuario.setCorreo(request.correo());
        usuario.setUsuario(request.usuario());
        usuario.setPassword(SecurityUtils.hash(request.password()));
        usuario.setRol(request.rol());
        usuario.setActivo(true);

        usuarioRepository.persistAndFlush(usuario);
        return UserResponse.from(usuario);
    }

    public UserResponse me(String correo) {
        Usuario usuario = usuarioRepository.find("correo", correo)
                .firstResultOptional()
                .orElseThrow(() -> new CredencialesInvalidasException("No se encontró el usuario del token"));
        if (Boolean.FALSE.equals(usuario.getActivo())) {
            throw new CredencialesInvalidasException("La cuenta está inactiva");
        }
        return UserResponse.from(usuario);
    }
}