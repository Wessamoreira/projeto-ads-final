package com.financas.jobs;

import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;

/**
 * Job simples de monitoramento interno da aplicacao.
 *
 * <p>Executa a cada 2 minutos enquanto o processo Java estiver ativo.</p>
 */
@Slf4j
@Component
public class MonitoramentoJobs {

    private final Instant iniciadoEm = Instant.now();

    @Scheduled(cron = "0 */2 * * * ?")
    public void registrarAplicacaoAtiva() {
        long minutosAtiva = Duration.between(iniciadoEm, Instant.now()).toMinutes();
        log.info("[Monitoramento] Aplicacao ativa ha {} minuto(s)", minutosAtiva);
    }
}
