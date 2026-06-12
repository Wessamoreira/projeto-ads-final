package com.financas.service;

import com.financas.dto.AuthResponse;
import com.financas.dto.LoginRequest;
import com.financas.dto.RegistroRequest;
import com.financas.dto.UsuarioResponse;
import com.financas.entity.Categoria;
import com.financas.entity.Usuario;
import com.financas.enums.TipoTransacao;
import com.financas.exception.RegraNegocioException;
import com.financas.jobs.RendaMensalJobs;
import com.financas.repository.CategoriaRepository;
import com.financas.repository.UsuarioRepository;
import com.financas.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

/**
 * Regras de cadastro e login.
 */
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UsuarioRepository usuarioRepository;
    private final CategoriaRepository categoriaRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final RendaMensalJobs rendaMensalJobs;

    /** Cria a conta, ja deixa algumas categorias padrao prontas e devolve o token. */
    @Transactional
    public AuthResponse registrar(RegistroRequest dados) {
        if (usuarioRepository.existsByEmail(dados.email())) {
            throw RegraNegocioException.conflito("Ja existe uma conta com este e-mail");
        }

        Usuario usuario = Usuario.builder()
                .nome(dados.nome())
                .email(dados.email())
                .senhaHash(passwordEncoder.encode(dados.senha()))
                .rendaMensal(dados.rendaMensal())
                .build();
        usuario = usuarioRepository.save(usuario);

        criarCategoriasPadrao(usuario);
        rendaMensalJobs.executarParaUsuario(usuario, LocalDate.now());

        return montarResposta(usuario);
    }

    /** Confere e-mail e senha e devolve o token. */
    public AuthResponse login(LoginRequest dados) {
        // Lanca BadCredentialsException se a senha estiver errada (tratada no handler global).
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(dados.email(), dados.senha()));

        Usuario usuario = usuarioRepository.findByEmail(dados.email())
                .orElseThrow(() -> RegraNegocioException.naoEncontrado("Usuario nao encontrado"));

        return montarResposta(usuario);
    }

    private AuthResponse montarResposta(Usuario usuario) {
        String token = jwtService.gerarToken(usuario.getEmail());
        return new AuthResponse(
                token,
                "Bearer",
                jwtService.getExpiracaoMs(),
                UsuarioResponse.de(usuario));
    }

    /** Cria categorias iniciais para a conta nova nao comecar vazia. */
    private void criarCategoriasPadrao(Usuario usuario) {
        List<Categoria> padroes = List.of(
                novaCategoria(usuario, "Salario", "money-bill", "#059669", TipoTransacao.RECEITA),
                novaCategoria(usuario, "Outras receitas", "coins", "#0D9488", TipoTransacao.RECEITA),
                novaCategoria(usuario, "Alimentacao", "shopping-cart", "#DC2626", TipoTransacao.DESPESA),
                novaCategoria(usuario, "Transporte", "car", "#2563EB", TipoTransacao.DESPESA),
                novaCategoria(usuario, "Moradia", "home", "#7C3AED", TipoTransacao.DESPESA),
                novaCategoria(usuario, "Lazer", "gift", "#EA580C", TipoTransacao.DESPESA)
        );
        categoriaRepository.saveAll(padroes);
    }

    private Categoria novaCategoria(Usuario usuario, String nome, String icone, String cor, TipoTransacao tipo) {
        return Categoria.builder()
                .usuario(usuario)
                .nome(nome)
                .icone(icone)
                .corHex(cor)
                .tipo(tipo)
                .build();
    }
}
