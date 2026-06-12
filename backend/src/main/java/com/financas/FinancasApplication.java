package com.financas;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Ponto de entrada da aplicacao.
 *
 * <p>Versao enxuta do controle financeiro: login, categorias,
 * transacoes (receitas/despesas) e dashboard de resumo.</p>
 *
 * <p><b>Rotinas Agendadas (Scheduling):</b></p>
 * <ul>
 *   <li>{@link com.financas.jobs.RendaMensalJobs} -
 *       Lanca automaticamente a renda mensal no 5o dia util</li>
 *   <li>{@link com.financas.jobs.MonitoramentoJobs} -
 *       Registra heartbeat interno a cada 2 minutos</li>
 * </ul>
 */
@SpringBootApplication
@EnableScheduling
public class FinancasApplication {

    public static void main(String[] args) {
        SpringApplication.run(FinancasApplication.class, args);
    }
}
