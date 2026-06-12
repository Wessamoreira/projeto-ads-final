package com.financas.service;

import com.financas.dto.TransacaoRequest;
import com.financas.dto.TransacaoResponse;
import com.financas.entity.Categoria;
import com.financas.entity.Transacao;
import com.financas.entity.Usuario;
import com.financas.exception.RegraNegocioException;
import com.financas.repository.CategoriaRepository;
import com.financas.repository.TransacaoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/**
 * Regras de negocio das transacoes (sempre no escopo do usuario logado).
 */
@Service
@RequiredArgsConstructor
public class TransacaoService {

    private final TransacaoRepository transacaoRepository;
    private final CategoriaRepository categoriaRepository;
    private final UsuarioService usuarioService;

    /** Lista paginada das transacoes do usuario. */
    @Transactional(readOnly = true)
    public Page<TransacaoResponse> listar(Pageable pageable) {
        UUID usuarioId = usuarioService.getLogado().getId();
        return transacaoRepository.findByUsuarioId(usuarioId, pageable)
                .map(TransacaoResponse::de);
    }

    @Transactional(readOnly = true)
    public TransacaoResponse buscar(UUID id) {
        return TransacaoResponse.de(buscarEntidade(id));
    }

    @Transactional
    public TransacaoResponse criar(TransacaoRequest dados) {
        Usuario usuario = usuarioService.getLogado();
        Categoria categoria = buscarCategoria(dados.categoriaId(), usuario.getId());

        Transacao transacao = Transacao.builder()
                .usuario(usuario)
                .categoria(categoria)
                .tipo(dados.tipo())
                .valor(dados.valor())
                .descricao(dados.descricao())
                .dataTransacao(dados.dataTransacao())
                .build();

        return TransacaoResponse.de(transacaoRepository.save(transacao));
    }

    @Transactional
    public TransacaoResponse atualizar(UUID id, TransacaoRequest dados) {
        Transacao transacao = buscarEntidade(id);
        Categoria categoria = buscarCategoria(dados.categoriaId(), transacao.getUsuario().getId());

        transacao.setTipo(dados.tipo());
        transacao.setValor(dados.valor());
        transacao.setDescricao(dados.descricao());
        transacao.setDataTransacao(dados.dataTransacao());
        transacao.setCategoria(categoria);

        return TransacaoResponse.de(transacaoRepository.save(transacao));
    }

    @Transactional
    public void excluir(UUID id) {
        transacaoRepository.delete(buscarEntidade(id));
    }

    private Transacao buscarEntidade(UUID id) {
        UUID usuarioId = usuarioService.getLogado().getId();
        return transacaoRepository.findByIdAndUsuarioId(id, usuarioId)
                .orElseThrow(() -> RegraNegocioException.naoEncontrado("Transacao nao encontrada"));
    }

    private Categoria buscarCategoria(UUID categoriaId, UUID usuarioId) {
        return categoriaRepository.findByIdAndUsuarioId(categoriaId, usuarioId)
                .orElseThrow(() -> RegraNegocioException.naoEncontrado("Categoria nao encontrada"));
    }
}
