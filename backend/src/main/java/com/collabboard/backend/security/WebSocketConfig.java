package com.collabboard.backend.security;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // Enable a simple memory-based message broker to carry broadcast messages back to the client on prefixes destination
        config.enableSimpleBroker("/topic");
        // Designate the application prefix to filter targeted target application actions mapped to controllers
        config.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // Register the connection socket handshake endpoint supporting client SockJS fallback options
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("http://localhost:5173")
                .withSockJS();
    }
}