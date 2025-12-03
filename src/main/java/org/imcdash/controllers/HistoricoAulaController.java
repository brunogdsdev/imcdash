package org.imcdash.controllers;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
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
            @RequestParam(required = false) Integer end

    ){

        int s = (start == null) ? 1 : clampMonth(start);
        int e = (end == null) ? 12 : clampMonth(end);
        if (s > e) { int tmp = s; s = e; e = tmp; }

        Map response = getSheetJson(RANGE);
        List<List<String>> values = (List<List<String>>) response.get("values");
        if(values == null || values.isEmpty()) return Collections.emptyList();


        List<List<String>> result = new ArrayList<>();

        for(List<String> linha : values.reversed()){
            if(linha.isEmpty()) continue;
            result.add(linha);
        }


        return result;

    }


}
