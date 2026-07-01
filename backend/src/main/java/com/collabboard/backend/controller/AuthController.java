package com.collabboard.backend.controller;

import org.springframework.web.bind.annotation.*;

import com.collabboard.backend.dto.LoginRequest;
import com.collabboard.backend.dto.LoginResponse;
import com.collabboard.backend.dto.RegisterRequest;
import com.collabboard.backend.service.UserService;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:5173")
public class AuthController {

    private final UserService userService;

    public AuthController(UserService userService) {
        this.userService = userService;
    }

    // Register API
    @PostMapping("/register")
    public String register(@RequestBody RegisterRequest request) {
        return userService.register(request);
    }

    // Login API
    @PostMapping("/login")
    public LoginResponse login(@RequestBody LoginRequest request) {
        return userService.login(request);
    }
}