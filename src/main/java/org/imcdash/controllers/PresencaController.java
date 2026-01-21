package org.imcdash.controllers;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.*;
import java.util.stream.Collectors;

import static org.imcdash.controllers.DashboardController.*;

@RestController
@RequestMapping("/api/presenca")
public class PresencaController {
    // helper: coluna indexes (0-based)
    private static final int INDEX_CLASSE = 0;   // A
    private static final int INDEX_NOME = 1;     // B
    private static final int INDEX_MES_START = 4; // E -> janeiro
    private static final int INDEX_MES_END = 15;  // P -> dezembro
    private static final int INDEX_TOTAL_ANUAL = 16; // Q
    
    private static String getRange(Integer ano) {
        int anoFinal = (ano == null) ? 2026 : ano;
        return String.format("RELATÓRIO %d!A2:Q320", anoFinal);
    }


    // ============================
    // Ranking por pessoa
    // ============================
    @GetMapping("/ranking")
    public List<Map<String, Object>> ranking(
            @RequestParam(required = false) Integer start,
            @RequestParam(required = false) Integer end,
            @RequestParam(required = false) String nome,
            @RequestParam(required = false) Integer ano) {

        int s = (start == null) ? 1 : clampMonth(start);
        int e = (end == null) ? 12 : clampMonth(end);
        if (s > e) { int tmp = s; s = e; e = tmp; }

        Map response = getSheetJson(getRange(ano));
        List<List<String>> values = (List<List<String>>) response.get("values");
        if (values == null || values.isEmpty()) return Collections.emptyList();

        // rows start at A2 per seu range; if headers present, ensure we're using provided range (you're using A2 so header likely absent)
        // but to be safe, do not remove first row.
        // iterate rows
        Map<String, Integer> contador = new HashMap<>();
        
        // Normalizar filtro de nome para comparação case-insensitive
        String filtroNome = (nome != null && !nome.isBlank()) ? nome.trim().toLowerCase() : null;

        for (List<String> linha : values) {
            if (linha.size() <= INDEX_NOME) continue;
            String nomeLinha = (linha.get(INDEX_NOME) == null || linha.get(INDEX_NOME).isBlank()) ? "Sem Nome" : linha.get(INDEX_NOME).trim();
            
            // Aplicar filtro de nome se fornecido
            if (filtroNome != null && !nomeLinha.toLowerCase().contains(filtroNome)) {
                continue;
            }

            int soma = 0;
            for (int mes = s; mes <= e; mes++) {
                int colIndex = INDEX_MES_START + (mes - 1);
                if (linha.size() > colIndex) {
                    soma += safeParseInt(linha.get(colIndex));
                }
            }
            // opcional: se soma == 0 você pode ignorar, mas vamos incluir
            contador.put(nomeLinha, contador.getOrDefault(nomeLinha, 0) + soma);
        }

        return contador.entrySet().stream()
                .sorted((a,b) -> b.getValue().compareTo(a.getValue()))
                .map(ei -> {
                    Map<String,Object> m = new HashMap<>();
                    m.put("nome", ei.getKey());
                    m.put("total", ei.getValue());
                    return m;
                })
                .collect(Collectors.toList());
    }

    /*
     ============================
     Total por classe
     ============================
    */
    @GetMapping("/por-classe")
    public List<Map<String, Object>> porClasse(
            @RequestParam(required = false) Integer start,
            @RequestParam(required = false) Integer end,
            @RequestParam(required = false) Integer ano) {

        int s = (start == null) ? 1 : clampMonth(start);
        int e = (end == null) ? 12 : clampMonth(end);
        if (s > e) { int tmp = s; s = e; e = tmp; }

        Map response = getSheetJson(getRange(ano));
        List<List<String>> values = (List<List<String>>) response.get("values");
        if (values == null || values.isEmpty()) return Collections.emptyList();

        Map<String, Integer> contador = new HashMap<>();

        for (List<String> linha : values) {
            String classe = (linha.size() > INDEX_CLASSE && linha.get(INDEX_CLASSE) != null && !linha.get(INDEX_CLASSE).isBlank())
                    ? linha.get(INDEX_CLASSE).trim()
                    : "Sem Classe";

            int soma = 0;
            for (int mes = s; mes <= e; mes++) {
                int colIndex = INDEX_MES_START + (mes - 1);
                if (linha.size() > colIndex) soma += safeParseInt(linha.get(colIndex));
            }

            contador.put(classe, contador.getOrDefault(classe, 0) + soma);
        }

        return contador.entrySet().stream()
                .sorted((a,b) -> b.getValue().compareTo(a.getValue()))
                .map(ei -> {
                    Map<String, Object> m = new HashMap<>();
                    m.put("classe", ei.getKey());
                    m.put("total", ei.getValue());
                    return m;
                }).collect(Collectors.toList());
    }

    @GetMapping("/mensal")
    public List<Map<String, Object>> getPresencaMensal(
            @RequestParam(required = false) Integer inicio,
            @RequestParam(required = false) Integer fim,
            @RequestParam(required = false) Integer ano) {

        // Valores padrão (1 = Janeiro, 12 = Dezembro)
        int mesInicio = (inicio == null) ? 1 : Math.max(1, Math.min(inicio, 12));
        int mesFim = (fim == null) ? 12 : Math.max(1, Math.min(fim, 12));

        if (mesFim < mesInicio) {
            int tmp = mesInicio;
            mesInicio = mesFim;
            mesFim = tmp;
        }

        // Carrega dados
        var response = getJson(Map.class, getRange(ano));
        List<List<String>> values = (List<List<String>>) response.get("values");

        if (values == null || values.size() <= 1) {
            return List.of();
        }

        // Mapa final
        Map<String, Map<String, Object>> resultado = new LinkedHashMap<>();

        for (int i = mesInicio - 1; i < mesFim; i++) {

            String mes = nomesMes[i];

            Map<String, Object> infoMes = new HashMap<>();
            infoMes.put("mes", mes);
            infoMes.put("total", 0);
            infoMes.put("classes", new HashMap<String, Integer>());

            resultado.put(mes, infoMes);
        }

        // Processar linhas
        for (List<String> linha : values) {

            if (linha.size() < 5) continue;

            String classe = linha.getFirst(); // Coluna A

            if(classe.equals("CLASSE")) continue;

            for (int i = mesInicio - 1; i < mesFim; i++) {

                int coluna = 4 + i; // Jan = col 4, Fev = 5, ...

                if (linha.size() <= coluna) continue;

                String valorStr = linha.get(coluna).trim();
                int valor = valorStr.isEmpty() ? 0 : Integer.parseInt(valorStr);

                String mes = nomesMes[i];

                Map<String, Object> dadosMes = resultado.get(mes);

                // Total do mês
                int totalAtual = (Integer) dadosMes.get("total");
                dadosMes.put("total", totalAtual + valor);

                // Total por classe
                Map<String, Integer> mapaClasses = (Map<String, Integer>) dadosMes.get("classes");
                mapaClasses.put(classe, mapaClasses.getOrDefault(classe, 0) + valor);
            }
        }

        return new ArrayList<>(resultado.values());
    }


    // ============================
    // Mensal (retorna lista de {mes,label,total})
    // ============================
    @GetMapping("/mensal-old")
    public List<Map<String,Object>> mensal(
            @RequestParam(required = false) Integer start,
            @RequestParam(required = false) Integer end,
            @RequestParam(required = false) Integer ano) {

        int s = (start == null) ? 1 : clampMonth(start);
        int e = (end == null) ? 12 : clampMonth(end);
        if (s > e) { int tmp = s; s = e; e = tmp; }

        Map response = getSheetJson(getRange(ano));
        List<List<String>> values = (List<List<String>>) response.get("values");
        if (values == null || values.isEmpty()) return Collections.emptyList();

        // init totals for months 1..12
        int[] totals = new int[12];
        for (List<String> linha : values) {
            for (int mes = s; mes <= e; mes++) {
                int colIndex = INDEX_MES_START + (mes - 1);
                if (linha.size() > colIndex) totals[mes-1] += safeParseInt(linha.get(colIndex));
            }
        }

        String[] nomes = {"Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"};
        List<Map<String,Object>> out = new ArrayList<>();
        for (int mes = s; mes <= e; mes++) {
            Map<String,Object> m = new HashMap<>();
            m.put("mes", nomes[mes-1]);
            m.put("index", mes);
            m.put("total", totals[mes-1]);
            out.add(m);
        }
        return out;
    }

    // ============================
    // Total geral no período
    // ============================
    @GetMapping("/total")
    public Map<String,Object> totalGeral(
            @RequestParam(required = false) Integer start,
            @RequestParam(required = false) Integer end,
            @RequestParam(required = false) Integer ano) {

        int s = (start == null) ? 1 : clampMonth(start);
        int e = (end == null) ? 12 : clampMonth(end);
        if (s > e) { int tmp = s; s = e; e = tmp; }

        Map response = getSheetJson(getRange(ano));
        List<List<String>> values = (List<List<String>>) response.get("values");

        System.out.println(values);
        if (values == null || values.isEmpty()) return Map.of("total", 0);

        long total = 0;
        for (List<String> linha : values) {
            for (int mes = s; mes <= e; mes++) {
                int colIndex = INDEX_MES_START + (mes - 1);
                if (linha.size() > colIndex) total += safeParseInt(linha.get(colIndex));
            }
        }

        return Map.of("total", total);
    }
}
