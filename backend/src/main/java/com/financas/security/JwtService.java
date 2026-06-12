package com.financas.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

/**
 * Responsavel por gerar e ler o token JWT.
 *
 * <p>O token guarda o e-mail do usuario (subject) e uma data de expiracao.
 * E assinado com uma chave secreta, garantindo que ninguem o falsifique.</p>
 */
@Service
public class JwtService {

    private final SecretKey chave;
    private final long expiracaoMs;

    public JwtService(
            @Value("${app.jwt.secret}") String secret,
            @Value("${app.jwt.expiration}") long expiracaoMs) {
        this.chave = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.expiracaoMs = expiracaoMs;
    }

    /** Gera um token novo para o e-mail informado. */
    public String gerarToken(String email) {
        Date agora = new Date();
        Date expira = new Date(agora.getTime() + expiracaoMs);
        return Jwts.builder()
                .subject(email)
                .issuedAt(agora)
                .expiration(expira)
                .signWith(chave)
                .compact();
    }

    /** Le o e-mail guardado dentro do token. */
    public String extrairEmail(String token) {
        return lerClaims(token).getSubject();
    }

    /** Diz se o token e valido (assinatura correta e nao expirado). */
    public boolean tokenValido(String token) {
        try {
            return lerClaims(token).getExpiration().after(new Date());
        } catch (Exception e) {
            return false;
        }
    }

    private Claims lerClaims(String token) {
        return Jwts.parser()
                .verifyWith(chave)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    /** Tempo de expiracao em milissegundos (exposto para o AuthResponse). */
    public long getExpiracaoMs() {
        return expiracaoMs;
    }
}
