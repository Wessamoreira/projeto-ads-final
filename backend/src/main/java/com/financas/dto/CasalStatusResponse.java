package com.financas.dto;

import java.util.List;

/**
 * Retrato completo da situacao de casal do usuario logado, em uma unica resposta.
 * A tela de "Casal" usa isso para decidir o que mostrar.
 *
 * @param vinculoAtivo            vinculo ja aceito, ou {@code null} se nao houver
 * @param convitePendenteEnviado convite que o usuario enviou e aguarda resposta, ou {@code null}
 * @param convitesRecebidos      convites que o usuario recebeu e pode aceitar/recusar
 */
public record CasalStatusResponse(
        CasalVinculoResponse vinculoAtivo,
        CasalVinculoResponse convitePendenteEnviado,
        List<CasalVinculoResponse> convitesRecebidos
) {}
