package com.joedev.posweb.pep.repository;

import com.joedev.posweb.pep.entity.Usuario;
import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import jakarta.enterprise.context.ApplicationScoped;

@ApplicationScoped
public class UsuarioRepository implements PanacheRepositoryBase<Usuario, Integer> {

	public java.util.List<Usuario> listColaboradoresActivos() {
		return find("rol = ?1 and activo = true order by nombre", "COLABORADOR").list();
	}
}
