package com.financas.exception;

/**
 * Erro de regra de negocio (ex: e-mail ja cadastrado, recurso nao encontrado).
 * O {@code status} define o codigo HTTP que sera devolvido ao cliente.
 */
public class RegraNegocioException extends RuntimeException {

    private final int status;

    public RegraNegocioException(String mensagem, int status) {
        super(mensagem);
        this.status = status;
    }

    public static RegraNegocioException naoEncontrado(String mensagem) {
        return new RegraNegocioException(mensagem, 404);
    }

    public static RegraNegocioException conflito(String mensagem) {
        return new RegraNegocioException(mensagem, 409);
    }

    public int getStatus() {
        return status;
    }
}
