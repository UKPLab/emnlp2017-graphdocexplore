package de.tudarmstadt.ukp.exploration.graph_doc_explorer.webapp.web.controllers;

import org.springframework.stereotype.Controller;
import org.springframework.ui.ModelMap;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;

@Controller
@RequestMapping("/")
public class HomeController {
	@RequestMapping(value = "/", method = RequestMethod.GET)
	public String index(ModelMap model) {
		return "index";
	}
}
