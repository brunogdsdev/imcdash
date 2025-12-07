package org.imcdash.controllers;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.*;

import static org.imcdash.controllers.DashboardController.clampMonth;
import static org.imcdash.controllers.DashboardController.getSheetJson;

@RestController
@RequestMapping("/api/history")
public class HistoricoAulaController {

    private static final String RANGE = "HISTÓRICO DE AULA 2025!A2:D50";


    @GetMapping("/get-history")
    List<List<String>> getHistory(
            @RequestParam(required = false) Integer start,
            @RequestParam(required = false) Integer end,
            @RequestParam(required = false) String data) {

        int s = (start == null) ? 1 : clampMonth(start);
        int e = (end == null) ? 12 : clampMonth(end);
        if (s > e) { int tmp = s; s = e; e = tmp; }

        Map response = getSheetJson(RANGE);
        List<List<String>> values = (List<List<String>>) response.get("values");
        if(values == null || values.isEmpty()) return Collections.emptyList();

        // Normalizar data do filtro se fornecido
        LocalDate filtroData = null;
        if (data != null && !data.isBlank()) {
            try {
                // Tentar formato YYYY-MM-DD (formato do input date)
                filtroData = LocalDate.parse(data.trim(), DateTimeFormatter.ISO_LOCAL_DATE);
            } catch (DateTimeParseException e1) {
                try {
                    // Tentar formato DD/MM/YYYY
                    filtroData = LocalDate.parse(data.trim(), DateTimeFormatter.ofPattern("dd/MM/yyyy"));
                } catch (DateTimeParseException e2) {
                    // Se não conseguir parsear, ignora o filtro
                    filtroData = null;
                }
            }
        }

        List<List<String>> result = new ArrayList<>();

        for(List<String> linha : values.reversed()){
            if(linha.isEmpty()) continue;
            
            // Aplicar filtro de data se fornecido
            if (filtroData != null && linha.size() > 0) {
                String dataLinha = linha.get(0);
                if (dataLinha != null && !dataLinha.isBlank()) {
                    LocalDate dataItem = null;
                    try {
                        // Tentar diferentes formatos de data
                        if (dataLinha.matches("\\d{2}/\\d{2}/\\d{4}")) {
                            dataItem = LocalDate.parse(dataLinha.trim(), DateTimeFormatter.ofPattern("dd/MM/yyyy"));
                        } else if (dataLinha.matches("\\d{4}-\\d{2}-\\d{2}")) {
                            dataItem = LocalDate.parse(dataLinha.trim(), DateTimeFormatter.ISO_LOCAL_DATE);
                        }
                    } catch (DateTimeParseException ex) {
                        // Se não conseguir parsear, continua sem filtrar esta linha
                    }
                    
                    // Se não corresponde à data do filtro, pular esta linha
                    if (dataItem == null || !dataItem.equals(filtroData)) {
                        continue;
                    }
                } else {
                    // Se não tem data na linha, pular se há filtro
                    continue;
                }
            }
            
            result.add(linha);
        }

        return result;
    }


}
