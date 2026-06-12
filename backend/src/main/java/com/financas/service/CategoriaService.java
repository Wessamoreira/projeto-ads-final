package com.financas.service;

import com.financas.dto.CategoriaRequest;
import com.financas.dto.CategoriaResponse;
import com.financas.entity.Categoria;
import com.financas.entity.Usuario;
import com.financas.enums.TipoTransacao;
import com.financas.exception.RegraNegocioException;
import com.financas.repository.CategoriaRepository;
import com.financas.repository.TransacaoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/**
 * Regras de negocio das categorias (sempre no escopo do usuario logado).
 */
@Service
@RequiredArgsConstructor
public class CategoriaService {

    private final CategoriaRepository categoriaRepository;
    private final TransacaoRepository transacaoRepository;
    private final UsuarioService usuarioService;

    /** Lista as categorias do usuario; se 'tipo' vier, filtra por RECEITA/DESPESA. */
    public List<CategoriaResponse> listar(TipoTransacao tipo) {
        UUID usuarioId = usuarioService.getLogado().getId();
        List<Categoria> categorias = (tipo == null)
                ? categoriaRepository.findByUsuarioIdOrderByNomeAsc(usuarioId)
                : categoriaRepository.findByUsuarioIdAndTipoOrderByNomeAsc(usuarioId, tipo);
        return categorias.stream().map(CategoriaResponse::de).toList();
    }

    public CategoriaResponse buscar(UUID id) {
        return CategoriaResponse.de(buscarEntidade(id));
    }

    @Transactional
    public CategoriaResponse criar(CategoriaRequest dados) {
        Usuario usuario = usuarioService.getLogado();
        if (categoriaRepository.existsByNomeAndUsuarioId(dados.nome(), usuario.getId())) {
            throw RegraNegocioException.conflito("Ja existe uma categoria com este nome");
        }

        Categoria categoria = Categoria.builder()
                .usuario(usuario)
                .nome(dados.nome())
                .icone(dados.icone())
                .corHex(corOuPadrao(dados.cor()))
                .tipo(dados.tipo())
                .orcamento(dados.orcamento())
                .descricao(dados.descricao())
                .build();

        return CategoriaResponse.de(categoriaRepository.save(categoria));
    }

    @Transactional
    public CategoriaResponse atualizar(UUID id, CategoriaRequest dados) {
        Categoria categoria = buscarEntidade(id);
        categoria.setNome(dados.nome());
        categoria.setIcone(dados.icone());
        categoria.setCorHex(corOuPadrao(dados.cor()));
        categoria.setTipo(dados.tipo());
        categoria.setOrcamento(dados.orcamento());
        categoria.setDescricao(dados.descricao());
        return CategoriaResponse.de(categoriaRepository.save(categoria));
    }

    @Transactional
    public void excluir(UUID id) {
        Categoria categoria = buscarEntidade(id);
        if (transacaoRepository.existsByCategoriaId(id)) {
            throw new RegraNegocioException(
                    "Nao e possivel excluir: existem transacoes nesta categoria", 409);
        }
        categoriaRepository.delete(categoria);
    }

    /** Busca a categoria garantindo que ela pertence ao usuario logado. */
    private Categoria buscarEntidade(UUID id) {
        UUID usuarioId = usuarioService.getLogado().getId();
        return categoriaRepository.findByIdAndUsuarioId(id, usuarioId)
                .orElseThrow(() -> RegraNegocioException.naoEncontrado("Categoria nao encontrada"));
    }

    private String corOuPadrao(String cor) {
        return (cor == null || cor.isBlank()) ? "#6B7280" : cor;
    }
}
