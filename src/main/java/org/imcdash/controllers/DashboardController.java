package org.imcdash.controllers;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.client.RestTemplate;

import java.time.format.DateTimeFormatter;
import java.util.Map;

@Controller
public class DashboardController {
    private static final String API_KEY = "AIzaSyCqeytiZOohC_LasDdu2puR4gxLg1bVxK0";
    private static final String SHEET_ID = "1FO7GB7LwtG0LUIFyb5f2TUo83O5JYH8LDGoOL_2F0ng";

    private static final RestTemplate rest = new RestTemplate();

    static DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    public static String url(String range){
        return String.format("https://sheets.googleapis.com/v4/spreadsheets/%s/values/%s?key=%s",
                SHEET_ID, range, API_KEY);
    }

    public static <T> T getJson(Class<T> tipo, String range){
        return rest.getForObject(url(range), tipo);
    }

    public static final String[] nomesMes = {
            "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
            "Jul", "Ago", "Set", "Out", "Nov", "Dez"
    };
    // Muito importante: start/end são meses 1..12
    public static int clampMonth(int m) {
        if (m < 1) return 1;
        if (m > 12) return 12;
        return m;
    }

    // retorna o JSON do Sheets (assuma que getJson está implementado no seu projeto)
    public static Map getSheetJson(String range) {
        return getJson(Map.class, range); // se você não tiver esse helper, substitua por sua chamada atual
    }

    public static int safeParseInt(String s) {
        if (s == null) return 0;
        s = s.trim();
        if (s.isEmpty()) return 0;
        try {
            // caso células tenham vírgula ou ponto, remover
            s = s.replace(",", "").replace(".", "");
            return Integer.parseInt(s);
        } catch (Exception e) {
            try {
                return (int) Double.parseDouble(s);
            } catch (Exception ex) {
                return 0;
            }
        }
    }

    @GetMapping("/dashboard")
    String dashboard(){
        return "visitantes";
    }

    @GetMapping("/presenca")
    String presenca(){
        return "presenca";
    }

    @GetMapping("/membros")
    String membros() {return "membros"; }
}
