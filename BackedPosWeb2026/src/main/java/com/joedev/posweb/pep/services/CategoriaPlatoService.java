package com.joedev.posweb.pep.services;

import com.joedev.posweb.pep.entity.CategoriaPlato;
import com.joedev.posweb.pep.exception.DatoInvalidoException;
import com.joedev.posweb.pep.exception.EntidadNoEncontradaException;
import com.joedev.posweb.pep.repository.CategoriaPlatoRepository;
import com.joedev.posweb.pep.repository.PlatoRepository;
import com.joedev.posweb.pep.stream.NotificationService;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.util.List;
import java.util.Map;

@ApplicationScoped
public class CategoriaPlatoService {

    @Inject
    CategoriaPlatoRepository repository;

    @Inject
    PlatoRepository platoRepository;

    @Inject
    NotificationService notifier;

    public List<CategoriaPlato> listarTodos() {
        return repository.listAll();
    }

    public CategoriaPlato obtenerPorId(Integer id) {
        return repository.findByIdOptional(id)
                .orElseThrow(() -> new EntidadNoEncontradaException("La categoría con id " + id + " no existe"));
    }

    public List<CategoriaPlato> listarActivas() {
        return repository.listActivas();
    }

    public List<CategoriaPlato> listarRaicesActivas() {
        return repository.listRaicesActivas();
    }

    public List<CategoriaPlato> listarHijasActivas(Integer idCategoriaPadre) {
        return repository.listHijasActivas(idCategoriaPadre);
    }

    public CategoriaPlato crear(CategoriaPlato categoriaPlato) {
        prepararCategoria(categoriaPlato, null);
        repository.persistAndFlush(categoriaPlato);
        notifier.emitir("catalogo:modificado", Map.of("id", categoriaPlato.getId()));
        return categoriaPlato;
    }

    public CategoriaPlato actualizar(Integer id, CategoriaPlato categoriaPlato) {
        CategoriaPlato existente = obtenerPorId(id);
        prepararCategoria(categoriaPlato, id);
        categoriaPlato.setId(id);
        CategoriaPlato actualizada = repository.getEntityManager().merge(categoriaPlato);
        notifier.emitir("catalogo:modificado", Map.of("id", id));
        return actualizada;
    }

    public void eliminar(Integer id) {
        obtenerPorId(id);
        if (repository.tieneHijas(id) || platoRepository.tienePlatos(id)) {
            throw new DatoInvalidoException("No se puede eliminar una categoría que tiene hijas o platos asociados");
        }
        if (!repository.deleteById(id)) {
            throw new EntidadNoEncontradaException("La categoría con id " + id + " no existe");
        }
        notifier.emitir("catalogo:modificado", Map.of("id", id));
    }

    private void prepararCategoria(CategoriaPlato categoria, Integer idExcluido) {
        if (categoria.getNombre() == null || categoria.getNombre().isBlank()) {
            throw new DatoInvalidoException("El nombre de la categoría es obligatorio");
        }

        CategoriaPlato padre = categoria.getCategoriaPadre();
        if (padre == null) {
            if (repository.existeNombreEnRaiz(categoria.getNombre().trim(), idExcluido)) {
                throw new DatoInvalidoException("Ya existe una categoría raíz con ese nombre");
            }
            categoria.setCategoriaPadre(null);
            return;
        }

        Integer idPadre = padre.getId();
        if (idPadre == null) {
            throw new DatoInvalidoException("La categoría padre es inválida");
        }
        if (idExcluido != null && idExcluido.equals(idPadre)) {
            throw new DatoInvalidoException("Una categoría no puede ser su propio padre");
        }

        CategoriaPlato padreGestionado = repository.findByIdOptional(idPadre)
                .orElseThrow(() -> new EntidadNoEncontradaException("La categoría padre no existe"));
        if (!Boolean.TRUE.equals(padreGestionado.getActivo())) {
            throw new DatoInvalidoException("La categoría padre está inactiva");
        }
        if (repository.existeNombreBajoPadre(categoria.getNombre().trim(), idPadre, idExcluido)) {
            throw new DatoInvalidoException("Ya existe una categoría con ese nombre bajo el mismo padre");
        }

        validarQueNoHayaCiclo(padreGestionado, idExcluido);
        categoria.setNombre(categoria.getNombre().trim());
        categoria.setCategoriaPadre(padreGestionado);
    }

    private void validarQueNoHayaCiclo(CategoriaPlato padre, Integer idCategoria) {
        CategoriaPlato actual = padre;
        while (actual != null) {
            if (idCategoria != null && idCategoria.equals(actual.getId())) {
                throw new DatoInvalidoException("El cambio de padre crearía un ciclo");
            }
            actual = actual.getCategoriaPadre();
        }
    }
}