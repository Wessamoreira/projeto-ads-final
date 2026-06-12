package com.financas.service;

import com.financas.dto.AlterarSenhaRequest;
import com.financas.dto.AtualizarPerfilRequest;
import com.financas.entity.Usuario;
import com.financas.exception.RegraNegocioException;
import com.financas.jobs.RendaMensalJobs;
import com.financas.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

/**
 * Operacoes relacionadas ao usuario, incluindo descobrir quem esta logado,
 * editar o perfil e trocar a senha.
 */
@Service
@RequiredArgsConstructor
public class UsuarioService {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final RendaMensalJobs rendaMensalJobs;

    /**
     * Retorna o usuario autenticado na requisicao atual.
     *
     * <p>O filtro JWT colocou o e-mail do usuario no contexto de seguranca;
     * aqui buscamos a entidade correspondente no banco.</p>
     */
    public Usuario getLogado() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return usuarioRepository.findByEmail(email)
                .orElseThrow(() -> RegraNegocioException.naoEncontrado("Usuario nao encontrado"));
    }

    /** Atualiza nome e renda mensal do usuario logado. */
    @Transactional
    public Usuario atualizarPerfil(AtualizarPerfilRequest dados) {
        Usuario usuario = getLogado();
        usuario.setNome(dados.nome());
        usuario.setRendaMensal(dados.rendaMensal());
        usuario = usuarioRepository.save(usuario);
        rendaMensalJobs.executarParaUsuario(usuario, LocalDate.now());
        return usuario;
    }

    /** Troca a senha, conferindo antes a senha atual. */
    @Transactional
    public void alterarSenha(AlterarSenhaRequest dados) {
        Usuario usuario = getLogado();

        if (!passwordEncoder.matches(dados.senhaAtual(), usuario.getSenhaHash())) {
            throw new RegraNegocioException("Senha atual incorreta", 400);
        }

        usuario.setSenhaHash(passwordEncoder.encode(dados.novaSenha()));
        usuarioRepository.save(usuario);
    }
}
