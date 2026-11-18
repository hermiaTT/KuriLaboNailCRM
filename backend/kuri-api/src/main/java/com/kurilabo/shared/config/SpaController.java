package com.kurilabo.shared.config;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class SpaController {
    @GetMapping(value = {"/", "/{path:[^\\.]*}", "/**/{path:[^\\.]*}"})
    public String forwardToWebApp() {
        return "forward:/index.html";
    }
}
