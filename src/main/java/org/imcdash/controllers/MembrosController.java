package org.imcdash.controllers;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.concurrent.atomic.AtomicInteger;

import static org.imcdash.controllers.DashboardController.*;


@RestController
@RequestMapping("/api/membros")
public class MembrosController {
    private static final String API_KEY = "AIzaSyCqeytiZOohC_LasDdu2puR4gxLg1bVxK0";
    private static final String SHEET_ID = "1Dxg_QYJ92d6pA4WH0Qp_AkBy3awurN0s2Dn1_3VoHRQ";
    private static final String RANGE = "Respostas ao formulário 1!B2:W150";

    private static final RestTemplate rest = new RestTemplate();

    public static String url = String.format("https://sheets.googleapis.com/v4/spreadsheets/%s/values/%s?key=%s",
                SHEET_ID, RANGE, API_KEY);

    public static <T> T getJson(Class<T> tipo, String range){
        return rest.getForObject(url, tipo);
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

    @GetMapping("/contagem")
    Map<String, String> getContagem(){
        var response = getJson(Map.class,RANGE);
        List<List<String>> values = (List<List<String>>) response.get("values");


        AtomicInteger totalBatizado = new AtomicInteger(0);
        AtomicInteger totalComFoto = new AtomicInteger(0);
        AtomicInteger totalComCarteirinha = new AtomicInteger(0);

        values.stream()
                .filter(linha -> filterIndex(1,linha))
                .forEach(linha -> {
                    String batizado = safeGet(linha, 10);
                    String foto = safeGet(linha, 13);
                    String carteirinha = safeGet(linha, 21);

                    if("SIM".equalsIgnoreCase(batizado)){
                        totalBatizado.incrementAndGet();
                    }
                    if(!foto.isEmpty()){
                        totalComFoto.incrementAndGet();
                    }
                    if("SIM".equalsIgnoreCase(carteirinha)){
                        totalComCarteirinha.incrementAndGet();
                    }

                });


        return Map.of(
                "total", String.format("%d", values.size()),
                "batizado", String.format("%d / %d", totalBatizado.get(), values.size() - totalBatizado.get()),
                "foto", String.format("%d / %d", totalComFoto.get(), values.size() - totalComFoto.get()),
                "carteirinha", String.format("%d / %d", totalComCarteirinha.get(), values.size() - totalComCarteirinha.get())
        );
    }

}
