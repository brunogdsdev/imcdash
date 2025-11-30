package org.imcdash.controllers;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;

@RestController
@RequestMapping("/api/sheets")
public class SheetsController {

    private final String API_KEY = "AIzaSyCqeytiZOohC_LasDdu2puR4gxLg1bVxK0";
    private final String SHEET_ID = "1FO7GB7LwtG0LUIFyb5f2TUo83O5JYH8LDGoOL_2F0ng";
    private final String RANGE = "VISITANTES 2025!A1:H269";
    private final String url = String.format("https://sheets.googleapis.com/v4/spreadsheets/%s/values/%s?key=%s",
            SHEET_ID, RANGE, API_KEY);
    private final RestTemplate rest = new RestTemplate();

    private final String[] nomesMes = {
            "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
            "Jul", "Ago", "Set", "Out", "Nov", "Dez"
    };

    DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy");



    public <T> T getJson(Class<T> tipo){
        return rest.getForObject(url, tipo);
    }





    @GetMapping("/dados")
     String getDados(){
        return getJson(String.class);
    }


    @GetMapping("/contagem")
    int getContagem(
            @RequestParam String inicio,
            @RequestParam String fim
    ){

        System.out.println("count");
        LocalDate dataInicio = LocalDate.parse(inicio, formatter);
        LocalDate dataFim = LocalDate.parse(fim, formatter);

        var response = getJson(Map.class);
        List<List<String>> values = (List<List<String>>) response.get("values");

        long count = values.stream()
                .filter(linha -> linha.size() > 1 && linha.get(1) != null && !linha.get(1).isEmpty())
                .map(linha -> {
                    try {
                        return LocalDate.parse(linha.get(1), formatter);
                    } catch (Exception e) {
                        return null;
                    }
                })
                .filter(Objects::nonNull)
                .filter(data -> !data.isBefore(dataInicio) && !data.isAfter(dataFim))
                .count();

        System.out.println(count);
        return (int) count - 1;
    }

    @GetMapping("/get-total")
    List<Map<String, Object>> getTotal(
            @RequestParam String chave,
            @RequestParam int index,
            @RequestParam String inicio,
            @RequestParam String fim
    ){
        LocalDate dataInicio = LocalDate.parse(inicio, formatter);
        LocalDate dataFim = LocalDate.parse(fim, formatter);
        try{
            var response = getJson(Map.class);

            List<List<String>> values = (List<List<String>>) response.get("values");

            values.remove(0);
            Map<String, Integer> contador = new HashMap<>();

            for (List<String> linha : values) {
                // filtra pelo intervalo de datas (coluna 1)
                if (linha.size() > 1 && linha.get(1) != null && !linha.get(1).isEmpty()) {
                    try {
                        LocalDate data = LocalDate.parse(linha.get(1), formatter);
                        if (!data.isBefore(dataInicio) && !data.isAfter(dataFim)) {
                            String item = (linha.size() > index && linha.get(index) != null && !linha.get(index).isEmpty())
                                    ? linha.get(index)
                                    : "Sem dados";
                            contador.put(item, contador.getOrDefault(item, 0) + 1);
                        }
                    } catch (Exception e) {
                        e.printStackTrace();
                    }
                }
            }

            return contador.entrySet()
                    .stream()
                    .sorted((a,b) -> b.getValue() - a.getValue())
                    .map(e -> {
                        Map<String, Object> item = new HashMap<>();
                        item.put(chave, e.getKey());
                        item.put("total", e.getValue());
                        return item;
                    })
                    .toList();
        } catch (RuntimeException e) {
            e.printStackTrace();

        }

        return List.of();
    }


    @GetMapping("/por-mes")
    public List<Map<String, Object>> getTotalPorMes(
            @RequestParam String inicio,
            @RequestParam String fim
    ) {
        LocalDate dataInicio = LocalDate.parse(inicio, formatter);
        LocalDate dataFim = LocalDate.parse(fim, formatter);

        var response = getJson(Map.class);
        List<List<String>> values = (List<List<String>>) response.get("values");

        // remover cabeçalho
        values.remove(0);

        Map<String, Integer> contador = new LinkedHashMap<>();

        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy");

        for (List<String> linha : values) {
            if (linha.size() > 1 && linha.get(1) != null && !linha.get(1).isEmpty()) {
                try {
                    LocalDate data = LocalDate.parse(linha.get(1), formatter);

                    // filtrar pelo intervalo
                    if (!data.isBefore(dataInicio) && !data.isAfter(dataFim)) {
                        String chaveMes = nomesMes[data.getMonthValue() - 1];
                        contador.put(chaveMes, contador.getOrDefault(chaveMes, 0) + 1);
                    }

                } catch (Exception e) {
                    e.printStackTrace();
                }
            }
        }

        return contador.entrySet()
                .stream()
                .sorted((a, b) -> a.getKey().compareTo(b.getKey())) // ordenar por mês crescente
                .map(e -> {
                    Map<String, Object> item = new HashMap<>();
                    item.put("mes", e.getKey());
                    item.put("total", e.getValue());
                    return item;
                })
                .toList();
    }

}
