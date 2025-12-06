package org.imcdash.controllers;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.atomic.AtomicInteger;

import static org.imcdash.controllers.DashboardController.*;


@RestController
@RequestMapping("/api/membros")
public class MembrosController {
    private static final String API_KEY = "AIzaSyCqeytiZOohC_LasDdu2puR4gxLg1bVxK0";
    private static final String SHEET_ID = "1Dxg_QYJ92d6pA4WH0Qp_AkBy3awurN0s2Dn1_3VoHRQ";
    private static final String RANGE = "Respostas ao formulário 1!B2:W150";

    private static final RestTemplate rest = new RestTemplate();

    public static String url(String range){
        return String.format("https://sheets.googleapis.com/v4/spreadsheets/%s/values/%s?key=%s",
                SHEET_ID, range, API_KEY);
    }

    public static <T> T getJson(Class<T> tipo, String range){
        return rest.getForObject(url(range), tipo);
    }

    private static boolean filterIndex(int index, List<String> linha){
        return linha.size() > 1 && linha.get(1) != null && !linha.get(1).isEmpty();
    }
    private static String safeGet(List<String> linha, int index) {
        if (index < linha.size()) {
            String value = linha.get(index);
            return value == null ? "" : value;
        }
        return "";
    }

    @GetMapping("/test")
    String test(){
        return "MembrosController está funcionando!";
    }

    @GetMapping("/todos")
    Map<String, Object> getTodos(){
        try {
            System.out.println("Endpoint /api/membros/todos chamado");
            
            // Busca os headers (primeira linha)
            String headerRange = "Respostas ao formulário 1!B1:W1";
            var headerResponse = getJson(Map.class, headerRange);
            List<String> headers = new ArrayList<>();
            if (headerResponse != null) {
                List<List<String>> headerValues = (List<List<String>>) headerResponse.get("values");
                if (headerValues != null && !headerValues.isEmpty()) {
                    headers = headerValues.get(0);
                }
            }
            
            // Busca todos os dados
            var response = getJson(Map.class, RANGE);
            System.out.println("Resposta recebida do Google Sheets");
            
            if (response == null) {
                System.out.println("Resposta é null");
                return Map.of(
                        "headers", Collections.emptyList(),
                        "dados", Collections.emptyList()
                );
            }
            
            List<List<String>> values = (List<List<String>>) response.get("values");
            
            if (values == null) {
                System.out.println("Values é null");
                return Map.of(
                        "headers", Collections.emptyList(),
                        "dados", Collections.emptyList()
                );
            }
            
            // Filtra linhas válidas (que têm pelo menos nome)
            List<List<String>> dadosFiltrados = values.stream()
                    .filter(linha -> filterIndex(1, linha))
                    .collect(java.util.stream.Collectors.toList());
            
            System.out.println("Retornando " + dadosFiltrados.size() + " linhas com " + headers.size() + " colunas");
            
            return Map.of(
                    "headers", headers,
                    "dados", dadosFiltrados
            );
        } catch (Exception e) {
            System.err.println("Erro no endpoint /api/membros/todos: " + e.getMessage());
            e.printStackTrace();
            return Map.of(
                    "headers", Collections.emptyList(),
                    "dados", Collections.emptyList()
            );
        }
    }

    @GetMapping("/contagem")
    Map<String, Object> getContagem(){
        try {
            System.out.println("Endpoint /api/membros/contagem chamado");
            var response = getJson(Map.class,RANGE);
            System.out.println("Resposta recebida do Google Sheets");
            
            if (response == null) {
                System.out.println("Resposta é null");
                return Map.of(
                        "total", "0",
                        "batizado", "0 / 0",
                        "foto", "0 / 0",
                        "carteirinha", "0 / 0",
                        "nomes", "[]"
                );
            }
            
            List<List<String>> values = (List<List<String>>) response.get("values");
            
            if (values == null) {
                System.out.println("Values é null");
                return Map.of(
                        "total", "0",
                        "batizado", "0 / 0",
                        "foto", "0 / 0",
                        "carteirinha", "0 / 0",
                        "nomes", "[]"
                );
            }
            
            System.out.println("Processando " + values.size() + " linhas");


        AtomicInteger totalBatizado = new AtomicInteger(0);
        AtomicInteger totalComFoto = new AtomicInteger(0);
        AtomicInteger totalComCarteirinha = new AtomicInteger(0);

        Map<String,List<String>> nomes = new HashMap<>();

        values.stream()
                .filter(linha -> filterIndex(1,linha))
                .forEach(linha -> {
                    String nome = safeGet(linha, 0);
                    String batizado = safeGet(linha, 10);
                    String foto = safeGet(linha, 13);
                    String carteirinha = safeGet(linha, 21);

                    if ("SIM".equalsIgnoreCase(batizado)) {
                        totalBatizado.incrementAndGet();
                        nomes.computeIfAbsent("batizados", k -> new ArrayList<>()).add(nome);
                    } else {
                        nomes.computeIfAbsent("nao-batizados", k -> new ArrayList<>()).add(nome);
                    }

                    if (!foto.isEmpty()) {
                        totalComFoto.incrementAndGet();
                        nomes.computeIfAbsent("foto", k -> new ArrayList<>()).add(nome);
                    } else {
                        nomes.computeIfAbsent("sem-foto", k -> new ArrayList<>()).add(nome);
                    }

                    if ("SIM".equalsIgnoreCase(carteirinha)) {
                        totalComCarteirinha.incrementAndGet();
                        nomes.computeIfAbsent("carteirinha", k -> new ArrayList<>()).add(nome);
                    } else {
                        nomes.computeIfAbsent("sem-carteirinha", k -> new ArrayList<>()).add(nome);
                    }

                });


            return Map.of(
                    "total", String.format("%d", values.size()),
                    "batizado", String.format("%d / %d", totalBatizado.get(), values.size() - totalBatizado.get()),
                    "foto", String.format("%d / %d", totalComFoto.get(), values.size() - totalComFoto.get()),
                    "carteirinha", String.format("%d / %d", totalComCarteirinha.get(), values.size() - totalComCarteirinha.get()),
                    "nomes", nomes
            );
        } catch (Exception e) {
            System.err.println("Erro no endpoint /api/membros/contagem: " + e.getMessage());
            e.printStackTrace();
            return Map.of(
                    "total", "Erro",
                    "batizado", "Erro",
                    "foto", "Erro",
                    "carteirinha", "Erro",
                    "nomes", "Erro"
            );
        }
    }

}
