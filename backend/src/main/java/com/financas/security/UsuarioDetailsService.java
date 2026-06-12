package com.financas.security;

import com.financas.entity.Usuario;
import com.financas.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Ensina o Spring Security a carregar um usuario pelo e-mail.
 * Usado tanto no login quanto na validacao do token a cada requisicao.
 */
@Service
@RequiredArgsConstructor
public class UsuarioDetailsService implements UserDetailsService {

    private final UsuarioRepository usuarioRepository;

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        Usuario usuario = usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("Usuario nao encontrado: " + email));

        // Todos os usuarios tem o mesmo papel; o foco aqui e autenticacao.
        return new User(usuario.getEmail(), usuario.getSenhaHash(), List.of());
    }
}
