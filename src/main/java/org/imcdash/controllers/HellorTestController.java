package org.imcdash.controllers;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HellorTestController {

    @GetMapping("/teste")
    String hello(){
        return "Hellor World!";
    }
}
