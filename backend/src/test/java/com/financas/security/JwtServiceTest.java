package com.financas.security;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Teste UNITARIO do JwtService.
 *
 * <p>Nao sobe o Spring nem usa banco: cria o servico direto, com um segredo de teste.
 * Verifica a geracao, a leitura e a validacao do token JWT.</p>
 */
class JwtServiceTest {

    // Segredo com tamanho suficiente para HMAC-SHA256 (>= 256 bits)
    private static final String SEGREDO = "segredo-de-teste-apenas-para-rodar-os-testes-256-bits";

    @Test
    @DisplayName("Gera um token e consegue ler o e-mail de dentro dele")
    void gerarToken_eExtrairEmail() {
        JwtService jwtService = new JwtService(SEGREDO, 3_600_000L); // 1h

        String token = jwtService.gerarToken("usuario@teste.com");

        assertTrue(token != null && !token.isBlank(), "deveria gerar um token");
        assertEquals("usuario@teste.com", jwtService.extrairEmail(token),
                "o e-mail lido deve ser o mesmo que foi colocado no token");
    }

    @Test
    @DisplayName("Token recem-criado e valido")
    void tokenRecemCriado_eValido() {
        JwtService jwtService = new JwtService(SEGREDO, 3_600_000L);

        String token = jwtService.gerarToken("usuario@teste.com");

        assertTrue(jwtService.tokenValido(token), "token dentro da validade deve ser valido");
    }

    @Test
    @DisplayName("Token expirado e invalido")
    void tokenExpirado_eInvalido() throws InterruptedException {
        // Expiracao de 1 ms: o token nasce praticamente ja vencido
        JwtService jwtService = new JwtService(SEGREDO, 1L);

        String token = jwtService.gerarToken("usuario@teste.com");
        Thread.sleep(20); // garante que passou da expiracao

        assertFalse(jwtService.tokenValido(token), "token expirado nao deve ser valido");
    }

    @Test
    @DisplayName("Token assinado com OUTRA chave e invalido (anti-falsificacao)")
    void tokenComOutraChave_eInvalido() {
        JwtService servicoQueAssina = new JwtService(SEGREDO, 3_600_000L);
        JwtService servicoComOutraChave =
                new JwtService("uma-chave-completamente-diferente-da-outra-256-bits!!", 3_600_000L);

        String token = servicoQueAssina.gerarToken("usuario@teste.com");

        // O segundo servico tem outra chave: a assinatura nao bate -> invalido
        assertFalse(servicoComOutraChave.tokenValido(token),
                "token assinado com outra chave deve ser rejeitado");
    }

    @Test
    @DisplayName("Texto que nao e um JWT e invalido")
    void textoQualquer_naoEValido() {
        JwtService jwtService = new JwtService(SEGREDO, 3_600_000L);

        assertFalse(jwtService.tokenValido("isto-nao-e-um-token"),
                "texto malformado deve ser tratado como invalido, sem quebrar");
    }
}
