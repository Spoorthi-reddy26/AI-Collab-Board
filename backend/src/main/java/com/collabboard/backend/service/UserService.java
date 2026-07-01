package com.collabboard.backend.service;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.collabboard.backend.dto.LoginRequest;
import com.collabboard.backend.dto.LoginResponse;
import com.collabboard.backend.dto.RegisterRequest;
import com.collabboard.backend.entity.User;
import com.collabboard.backend.repository.UserRepository;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    // Register User
    public String register(RegisterRequest request) {

        if (userRepository.existsByEmail(request.getEmail())) {
            return "Email already exists";
        }

        User user = new User();

        user.setFullName(request.getFullName());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));

        userRepository.save(user);

        return "Registration Successful";
    }

    // Login User
    public LoginResponse login(LoginRequest request) {

        User user = userRepository.findByEmail(request.getEmail()).orElse(null);

        if (user == null) {
            return new LoginResponse("User not found", null, null, null);
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            return new LoginResponse("Invalid Password", null, null, null);
        }

        return new LoginResponse("Login Successful", user.getId(), user.getFullName(), user.getEmail());
    }
}