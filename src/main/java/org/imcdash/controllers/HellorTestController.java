package org.imcdash.controllers;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HellorTestController {

    @GetMapping("/hello")
    String hello(){
        return "Hellor World!";
    }
}
