package com.financas.integracao;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Teste de INTEGRACAO do fluxo de autenticacao.
 *
 * <p>Sobe a aplicacao inteira (com banco H2 em memoria) e exercita o caminho real:
 * registrar -> logar -> acessar rota protegida com e sem token.</p>
 */
@SpringBootTest
@AutoConfigureMockMvc
class AuthFlowIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    @DisplayName("Registrar -> Login -> acessar perfil com token -> bloquear sem token")
    void fluxoCompletoDeAutenticacao() throws Exception {
        String email = "integracao@teste.com";

        // 1) REGISTRO: cria a conta e ja devolve um token (201 Created)
        String registroJson = """
            { "nome": "Usuario Integracao", "email": "%s", "senha": "123456", "rendaMensal": 3000.00 }
            """.formatted(email);

        mockMvc.perform(post("/api/v1/auth/registro")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(registroJson))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.accessToken").exists())
                .andExpect(jsonPath("$.usuario.email").value(email));

        // 2) LOGIN: autentica e captura o token devolvido
        String loginJson = """
            { "email": "%s", "senha": "123456" }
            """.formatted(email);

        MvcResult loginResult = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").exists())
                .andReturn();

        JsonNode body = objectMapper.readTree(loginResult.getResponse().getContentAsString());
        String token = body.get("accessToken").asText();

        // 3) ROTA PROTEGIDA COM TOKEN: deve liberar (200) e trazer o usuario certo
        mockMvc.perform(get("/api/v1/usuarios/perfil")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value(email));

        // 4) ROTA PROTEGIDA SEM TOKEN: deve ser bloqueada (401 Nao autorizado)
        mockMvc.perform(get("/api/v1/usuarios/perfil"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Login com senha errada e rejeitado (401)")
    void loginComSenhaErrada_eRejeitado() throws Exception {
        // Cria a conta
        mockMvc.perform(post("/api/v1/auth/registro")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                            { "nome": "Fulano", "email": "fulano@teste.com", "senha": "123456" }
                            """))
                .andExpect(status().isCreated());

        // Tenta logar com a senha errada
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                            { "email": "fulano@teste.com", "senha": "senha-errada" }
                            """))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Registro com e-mail repetido e rejeitado (409)")
    void registroComEmailDuplicado_eRejeitado() throws Exception {
        String corpo = """
            { "nome": "Beltrano", "email": "repetido@teste.com", "senha": "123456" }
            """;

        mockMvc.perform(post("/api/v1/auth/registro")
                        .contentType(MediaType.APPLICATION_JSON).content(corpo))
                .andExpect(status().isCreated());

        // Segundo registro com o mesmo e-mail deve falhar
        mockMvc.perform(post("/api/v1/auth/registro")
                        .contentType(MediaType.APPLICATION_JSON).content(corpo))
                .andExpect(status().isConflict());
    }
}
